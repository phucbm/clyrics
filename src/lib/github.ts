import { Octokit } from 'octokit'
import { SignJWT, importPKCS8 } from 'jose'
import type { Song } from '../types'

const OWNER = 'phucbm'
const REPO = 'clyrics'
const PR_LIST_URL = `https://github.com/${OWNER}/${REPO}/pulls`

async function getInstallationToken(): Promise<string> {
  const appId = import.meta.env.VITE_GITHUB_APP_ID as string
  const installationId = import.meta.env.VITE_GITHUB_APP_INSTALLATION_ID as string
  const rawKey = import.meta.env.VITE_GITHUB_APP_PRIVATE_KEY as string

  if (!appId || !installationId || !rawKey) throw new Error('NO_GITHUB_APP_CONFIG')

  const pem = rawKey.replace(/\\n/g, '\n')
  const key = await importPKCS8(pem, 'RS256')

  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256' })
    .setIssuedAt()
    .setIssuer(appId)
    .setExpirationTime('10m')
    .sign(key)

  const res = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    }
  )

  if (!res.ok) throw new Error(`GitHub App token error: ${res.status}`)
  const data = await res.json()
  return data.token
}

async function getOctokit(): Promise<Octokit> {
  const token = await getInstallationToken()
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
  const octokit = await getOctokit()
  const filePath = `songs/${song.id}.json`
  const branch = `song/${song.id}-${Date.now()}`

  const { data: ref } = await octokit.rest.git.getRef({
    owner: OWNER, repo: REPO, ref: 'heads/main',
  })
  const mainSha = ref.object.sha

  let fileSha: string | undefined
  let resolvedPath = filePath
  let finalSong = { ...song, authors: [...new Set([...song.authors, contributor])] }

  // Always check if file exists — update if same song, suffix path if slug collision
  try {
    const { data: file } = await octokit.rest.repos.getContent({
      owner: OWNER, repo: REPO, path: filePath,
    })
    if ('sha' in file && 'content' in file) {
      const existing = JSON.parse(atob(file.content.replace(/\n/g, ''))) as Song
      if (existing.id === song.id) {
        fileSha = file.sha
        const mergedAuthors = [...new Set([...(existing.authors ?? []), contributor])]
        finalSong = { ...song, authors: mergedAuthors }
      } else {
        resolvedPath = `songs/${song.id}-2.json`
      }
    }
  } catch {
    // File not found — create new
  }

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(finalSong, null, 2))))

  await octokit.rest.git.createRef({
    owner: OWNER, repo: REPO,
    ref: `refs/heads/${branch}`,
    sha: mainSha,
  })

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: OWNER, repo: REPO,
    path: resolvedPath,
    message: prTitle(song),
    content,
    branch,
    ...(fileSha ? { sha: fileSha } : {}),
  })

  const { data: pr } = await octokit.rest.pulls.create({
    owner: OWNER, repo: REPO,
    title: prTitle(song),
    head: branch,
    base: 'main',
    body: prBody(song, contributor),
  })

  return pr.html_url
}
