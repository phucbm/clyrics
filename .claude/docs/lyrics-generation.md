# Lyrics Generation

## User flow

1. Paste Chinese lyrics in Edit screen
2. Choose primary language (e.g. English, Vietnamese)
3. Optionally add a second or third language
4. Hit Generate — AI returns translations for each line; pinyin is generated client-side via `linePinyin()`
5. Lines saved to the song via `useSongStore.updateSong`

## AI provider

**Groq** — `llama-3.3-70b-versatile` (override via `VITE_GROQ_MODEL` env).  
Called directly from the browser. No server proxy.

## API key

Priority: `VITE_GROQ_API_KEY` env → user-entered key saved in `localStorage` (`clyrics_groq_key`).  
Get a free key at [console.groq.com](https://console.groq.com).

## Prompt structure

- System prompt: `src/prompts/generate.md` (imported as raw string at build time)
- User message: `Translate to "{lang}". [optional extra lang instructions]\n\nLyrics:\n{chinese}`
- Temperature: `0.1` — low for consistent output
- Max tokens: `6000`

## Output format

AI returns a JSON array (translations only — no pinyin):
```json
[
  { "chinese": "...", "translations": [{ "lang": "English", "text": "..." }] }
]
```

## Pinyin generation

Pinyin is **not** handled by the LLM. It is generated client-side using two libs:

- **`pinyin-pro`** — converts Chinese → pinyin with accurate polyphonic resolution (e.g. `了` → `le` not `liǎo`) by processing the full line as context
- **`segmentit`** — pure-JS Chinese word segmenter; used only for word boundaries so pinyin is grouped by word (`wǒmen` not `wǒ men`)

Entry point: `src/lib/pinyin.ts` → `linePinyin(chinese: string): string`

Pinyin auto-regenerates on save in `EditSongSheet`, `AddSongSheet`, and `LineEditSheet`. Reactive preview shown below title/artist/chinese inputs as user types.

**Why not LLM for pinyin:** LLMs inconsistently group pinyin by word and misread polyphonics. Client-side libs are deterministic and accurate.

## Partial JSON recovery

Long lyrics can hit the token limit mid-response. `recoverPartialJson()` finds the last `}` in the raw string and closes the array — recovering all complete lines.

## Merge behavior (re-generate)

When re-generating a song that already has lines:
- Existing translations **win** — new langs are added, existing ones are not overwritten
- Pinyin always regenerated via `linePinyin()` when `overridePinyin = true`
- Line IDs are preserved for stability

## Key files

- `src/lib/groq.ts` — API call, key management, partial JSON recovery, merge logic
- `src/lib/pinyin.ts` — `linePinyin()` using pinyin-pro + segmentit
- `src/prompts/generate.md` — system prompt
