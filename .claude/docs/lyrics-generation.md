# Lyrics Generation

## User flow

1. Paste Chinese lyrics in Edit screen
2. Choose primary language (e.g. English, Vietnamese)
3. Optionally add a second or third language
4. Hit Generate — AI returns pinyin + translations for each line
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

AI returns a JSON array:
```json
[
  { "chinese": "...", "pinyin": "...", "translations": [{ "lang": "English", "text": "..." }] }
]
```

## Partial JSON recovery

Long lyrics can hit the token limit mid-response. `recoverPartialJson()` finds the last `}` in the raw string and closes the array — recovering all complete lines.

## Merge behavior (re-generate)

When re-generating a song that already has lines:
- Existing translations **win** — new langs are added, existing ones are not overwritten
- Pinyin is preserved unless `overridePinyin = true`
- Line IDs are preserved for stability

## Key files

- `src/lib/groq.ts` — API call, key management, partial JSON recovery, merge logic
- `src/prompts/generate.md` — system prompt
