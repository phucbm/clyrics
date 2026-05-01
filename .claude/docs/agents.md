# AI Layer

## Provider
Groq API — `https://api.groq.com/openai/v1/chat/completions`

## Model
`llama-3.3-70b-versatile` (override via `VITE_GROQ_MODEL` env)

## Key management (`src/lib/groq.ts`)
- Priority: `VITE_GROQ_API_KEY` env → localStorage `clyrics_groq_key`
- `getGroqKey()` / `saveUserGroqKey()` / `clearUserGroqKey()` are the only entry points

## Prompt
- System prompt: `src/prompts/generate.md` — imported as raw string via `?raw` Vite import
- User message: `"Translate to {language}. [secondLang instr]\n\nLyrics:\n{chinese}"`
- Temperature: 0.1, max_tokens: 6000

## Output
- Expects JSON array: `{ chinese, pinyin, translation, secondTranslation }[]`
- `recoverPartialJson()` handles truncated responses (finds last `}`, closes array)
- Each line gets a stable `id` = `${Date.now()}-${index}`

## Constraints
- Called directly from browser — no server proxy
- No streaming; waits for full response
- Single call per song generation; no chunking for long lyrics
