import type { LyricLine } from '../types'
import SYSTEM_PROMPT_RAW from '../prompts/generate.md?raw'

const GROQ_API = 'https://api.groq.com/openai/v1/chat/completions'
const LS_KEY = 'clyrics_groq_key'
const MODEL = (import.meta.env.VITE_GROQ_MODEL as string | undefined) || 'llama-3.3-70b-versatile'

export function getGroqKey(): string | null {
  const envKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined
  if (envKey) return envKey
  return localStorage.getItem(LS_KEY)
}

export function saveUserGroqKey(key: string) {
  localStorage.setItem(LS_KEY, key)
}

export function clearUserGroqKey() {
  localStorage.removeItem(LS_KEY)
}

function recoverPartialJson(raw: string): string {
  const lastClose = raw.lastIndexOf('}')
  if (lastClose === -1) return '[]'
  return raw.slice(0, lastClose + 1) + ']'
}

export async function generateLyrics(
  chinese: string,
  language: string
): Promise<LyricLine[]> {
  const key = getGroqKey()
  if (!key) throw new Error('NO_KEY')

  const res = await fetch(GROQ_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT_RAW },
        { role: 'user', content: `Translate to ${language}.\n\nLyrics:\n${chinese}` },
      ],
      temperature: 0.1,
      max_tokens: 6000,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Groq error: ${err}`)
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] }
  const raw = (data.choices[0]?.message?.content ?? '[]').trim()

  let parsed: Omit<LyricLine, 'id'>[]
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = JSON.parse(recoverPartialJson(raw))
  }

  return parsed.map((l, i) => ({
    id: `${Date.now()}-${i}`,
    chinese: l.chinese,
    pinyin: l.pinyin ?? '',
    translation: l.translation ?? '',
  }))
}
