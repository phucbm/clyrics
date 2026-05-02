# Contribution Flow

## How it works

No user GitHub account or token needed. The app uses a **GitHub App** (server-side installation token) to create PRs on behalf of contributors. Users only provide a nickname.

Backend secrets: `VITE_GITHUB_APP_ID`, `VITE_GITHUB_APP_INSTALLATION_ID`, `VITE_GITHUB_APP_PRIVATE_KEY` — set as env vars, never exposed to users.

## Two modes

### New Song
Adds the song as a new file in `songs/`. File name = `{artist}-{title}.json`. If that name is taken, appends `-{nickname}` then `-2`, `-3`, etc. to avoid collisions.

### Edit (fork only)
Proposes changes to an existing community song. Only available when `song.copiedFrom` is set — meaning the user forked the song from the community library. The PR targets the original file path.

## `copiedFrom` field

Set on `Song` when user forks a community song (repo song card → local copy). Stores the original song ID (= filename without `.json`). Used to:
- Enable "Edit" mode in ContributeSheet
- Route to `contributeEditSong()` instead of `contributeNewSong()`

## Nickname

- Stored in `localStorage` under `clyrics_nickname`
- Min 2 characters
- Appears in PR title: `[new] Artist - Title by nickname`
- Also added to `song.authors[]` array before submission

## PR details

- Branch: `song/{slugified-artist}-{slugified-title}-{timestamp}`
- Title: `[new|edit] {artist} - {title} by {nickname}`
- Body: title, artist, line count, languages, contributor nickname
- Once merged, song appears in Community Songs (fetched from `songs/` via `useRepoSongs`)

## Key files

- `src/lib/github.ts` — all Octokit logic, PR creation, token via GitHub App
- `src/components/sheets/ContributeSheet.tsx` — UI, mode selection, nickname input, submit
- `src/hooks/useRepoSongs.ts` — fetches community songs from `songs/` folder (5min TTL cache)
