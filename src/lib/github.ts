import { Octokit } from 'octokit'
import type { Song } from '../types'

const OWNER = 'phucbm'
const REPO = 'clyrics'
const PR_LIST_URL = `https://github.com/${OWNER}/${REPO}/pulls`

function getOctokit() {
  const token = import.meta.env.VITE_GITHUB_TOKEN as string | undefined
  if (!token) throw new Error('NO_GITHUB_TOKEN')
  return new Octokit({ auth: token })
}

export function prTitle(song: Song) {
  return song.source === 'repo'
    ? `fix: update song "${song.title}" by ${song.artist}`
    : `feat: add song "${song.title}" by ${song.artist}`
}

export function prBody(song: Song, contributor: string) {
  const langs = [...new Set(song.lines.flatMap((l) => l.translations.map((t) => t.lang)))]
  return [
    `**Title:** ${song.title}`,
    `**Artist:** ${song.artist}`,
    `**Lines:** ${song.lines.length}`,
    `**Languages:** ${langs.join(', ') || 'none'}`,
    '',
    '---',
    `Contributed by: ${contributor}`,
    `_Added via C-Lyrics app. To request removal, open an issue or comment on this PR._`,
  ].join('\n')
}

export function getPRListUrl() {
  return PR_LIST_URL
}

export async function contributeSong(song: Song, contributor: string): Promise<string> {
  const octokit = getOctokit()
  const username = (import.meta.env.VITE_GITHUB_USERNAME as string | undefined) ?? OWNER
  const filePath = `songs/${song.id}.json`
  const branch = `song/${song.id}-${Date.now()}`

  // Get main SHA
  const { data: ref } = await octokit.rest.git.getRef({
    owner: OWNER, repo: REPO, ref: 'heads/main',
  })
  const mainSha = ref.object.sha

  // For repo songs: fetch existing file to get SHA + merge authors
  let fileSha: string | undefined
  let finalSong = { ...song }

  if (song.source === 'repo') {
    try {
      const { data: file } = await octokit.rest.repos.getContent({
        owner: OWNER, repo: REPO, path: filePath,
      })
      if ('sha' in file && 'content' in file) {
        fileSha = file.sha
        const existing = JSON.parse(atob(file.content.replace(/\n/g, ''))) as Song
        const mergedAuthors = [...new Set([...(existing.authors ?? []), contributor])]
        finalSong = { ...song, authors: mergedAuthors }
      }
    } catch {
      // File not found — treat as new
    }
  } else {
    finalSong = { ...song, authors: [...new Set([...song.authors, contributor])] }
  }

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(finalSong, null, 2))))

  // Create branch on upstream
  await octokit.rest.git.createRef({
    owner: OWNER, repo: REPO,
    ref: `refs/heads/${branch}`,
    sha: mainSha,
  })

  // Create/update file on that branch
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO,
    path: filePath,
    message: prTitle(song),
    content,
    branch,
    ...(fileSha ? { sha: fileSha } : {}),
    committer: { name: username, email: `${username}@users.noreply.github.com` },
  })

  // Open PR
  const { data: pr } = await octokit.rest.pulls.create({
    owner: OWNER, repo: REPO,
    title: prTitle(song),
    head: branch,
    base: 'main',
    body: prBody(song, contributor),
  })

  return pr.html_url
}
