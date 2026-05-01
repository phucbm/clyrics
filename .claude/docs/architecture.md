# Architecture

## Stack
- React 19 + TypeScript + Vite 6
- Tailwind CSS 4 (Vite plugin, no config file)
- Framer Motion (screen transitions, animations)
- Zustand 5 + persist middleware (state)
- vite-plugin-pwa (offline support)
- Octokit (GitHub PR contribution flow)

## Directory structure
```
src/
  App.tsx              — root, screen router, desktop alignment controls
  components/
    screens/           — HomeScreen, EditScreen, PlayScreen
    sheets/            — bottom sheets (modals)
    shell/             — BottomSheetProvider
    ui/                — reusable UI components
  hooks/
    useYouTube.ts      — YouTube IFrame API loader
    useYouTubePlayer.ts — player state, sync, scrubbing
  lib/
    groq.ts            — Groq API client, key management
    github.ts          — Octokit PR creation
  store/
    useSongStore.ts    — songs[], activeSongId, githubSettings (persisted)
    useUIStore.ts      — screen, direction, playConfig, generateConfig
  types/index.ts       — Song, LyricLine, PlayConfig, GenerateConfig, GitHubSettings
  prompts/generate.md  — system prompt imported as raw string at build time
```

## Data flow
1. User pastes Chinese lyrics in EditScreen → `generateLyrics()` calls Groq → `LyricLine[]` saved to song via `useSongStore.updateSong`
2. PlayScreen reads active song lines, syncs scroll to YouTube player time via `useYouTubePlayer`
3. GitHub contribution: user sets token in settings → `github.ts` opens PR against phucbm/clyrics

## Key types
- `Song.source`: `'local' | 'repo'` — repo songs fetched from GitHub, local songs user-created
- `LyricLine`: `{ id, chinese, pinyin, translation, secondTranslation? }`
- `PlayConfig`: `{ pinyin, translation, secondLang, scrollSpeed, loop }`

## Colors (design tokens in use)
- Outer bg: `#ECEAE6`
- Content bg: `#F8F7F5`
- Active/text: `#0F0F0F`
- Subtle controls: `#E4E2DE`
