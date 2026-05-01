# C-Lyrics

Mobile-first PWA for learning Chinese from song lyrics. Paste Chinese lyrics, get pinyin + translation powered by Groq AI, study alongside YouTube video.

## Features
- AI-generated pinyin + Vietnamese/English translation
- YouTube video sync with lyric scroll
- Fullscreen single-line mode for screen recording
- Offline support (PWA)
- Contribute songs via GitHub PR

## Setup

### Prerequisites
- Node.js 20+
- pnpm 9+
- Cloudflare account
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Install
```bash
pnpm install
```

### Development
```bash
# Run both web + worker
pnpm dev

# Web only
pnpm web

# Worker only
pnpm worker
```

## Get a Groq API Key
1. Sign up at [console.groq.com](https://console.groq.com)
2. Create an API key
3. Set it as a Worker secret: `wrangler secret put GROQ_API_KEY`

## Deploy Worker to Cloudflare
```bash
cd apps/worker

# Create KV namespace
wrangler kv:namespace create RATE_LIMIT_KV

# Copy the IDs into wrangler.toml
# Set your API key
wrangler secret put GROQ_API_KEY

# Deploy
pnpm deploy
```

## Deploy Web to Cloudflare Pages
1. Connect `phucbm/clyrics` repo to Cloudflare Pages
2. Build command: `pnpm --filter web build`
3. Output dir: `apps/web/dist`

## Contribute Songs
1. Fork [phucbm/clyrics](https://github.com/phucbm/clyrics)
2. Open C-Lyrics → Settings → enter your GitHub username + personal access token (needs `repo` scope)
3. Load or create a song, then click the PR button
4. Review and submit the auto-created pull request
