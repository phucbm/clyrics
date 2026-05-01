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

@.claude/docs/architecture.md
@.claude/docs/agents.md
