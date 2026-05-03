# C-Lyrics

## Commands
- Dev: `pnpm dev`
- Build: `pnpm build`
- Preview: `pnpm preview`

## Rules
- No test or lint scripts exist — don't suggest running them
- README describes an old Cloudflare worker + monorepo architecture that no longer exists; current repo is a single Vite app with Groq called directly from the browser
- Mobile-first, max-width 600px container; all new UI must respect this constraint
- State lives in Zustand stores (`useSongStore`, `useUIStore`) — do not introduce local state for things that need persistence
- Songs persisted to localStorage under key `clyrics_songs` via Zustand persist middleware
- Groq API key stored in localStorage (`clyrics_groq_key`) or `VITE_GROQ_API_KEY` env — never hardcode or log it
- Screen transitions use framer-motion `AnimatePresence`; new screens must follow the `SCREENS` map pattern in `App.tsx`
- Song `id` field IS the filename without `.json` (e.g. `林三七-野草与栀子花`) — CJK chars kept raw, never slugified for filenames
- `songs/` folder in repo is source of truth for community songs; `scripts/build-songs-index.mjs` generates `public/songs/index.json` at build time (runs via `predev`/`prebuild` hooks) — `public/songs/` is gitignored
- `useRepoSongs` fetches `/songs/index.json` (relative URL, served by Vite/Cloudflare) — no GitHub API calls; in-memory cache, no TTL needed (index is per-deploy)
- `Song.copiedFrom` tracks fork origin — set when user forks a community song; used to determine contribute mode (edit vs new)
- Nickname for contributions stored in localStorage under `clyrics_nickname`
- Repo song card click → play screen; local song card click → edit screen

@.claude/docs/architecture.md
@.claude/docs/agents.md
