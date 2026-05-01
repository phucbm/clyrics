import type { LyricLine, Translation } from '../types'
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

type RawLine = {
  chinese: string
  pinyin?: string
  translations?: { lang: string; text: string }[]
}

export async function generateLyrics(
  chinese: string,
  primaryLang: string,
  secondaryLang?: string,
  existingLines?: LyricLine[],
  overridePinyin = false,
  thirdLang?: string
): Promise<LyricLine[]> {
  const key = getGroqKey()
  if (!key) throw new Error('NO_KEY')

  const extraInstr = [
    secondaryLang ? `Also add a second entry in the translations array for "${secondaryLang}".` : '',
    thirdLang ? `Also add a third entry in the translations array for "${thirdLang}".` : '',
  ].filter(Boolean).join(' ')
  const secondInstr = extraInstr ? ` ${extraInstr}` : ''

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
        {
          role: 'user',
          content: `Translate to "${primaryLang}".${secondInstr}\n\nLyrics:\n${chinese}`,
        },
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

  let parsed: RawLine[]
  try {
    parsed = JSON.parse(raw)
  } catch {
    parsed = JSON.parse(recoverPartialJson(raw))
  }

  return parsed.map((l, i) => {
    const existing = existingLines?.[i]
    const newTranslations: Translation[] = (l.translations ?? []).filter((t) => t.text.trim())
    const baseTranslations: Translation[] = existing?.translations ?? []

    // Existing translations win; only add langs not already present
    const merged = [...baseTranslations]
    for (const t of newTranslations) {
      if (!merged.some((m) => m.lang === t.lang)) merged.push(t)
    }

    return {
      id: existing?.id ?? `${Date.now()}-${i}`,
      chinese: l.chinese,
      pinyin: overridePinyin || !existing?.pinyin ? (l.pinyin ?? '') : existing.pinyin,
      translations: merged,
    }
  })
}
