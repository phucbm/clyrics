import { Octokit } from 'octokit'
import { SignJWT, importPKCS8 } from 'jose'
import { nanoid } from 'nanoid'
import type { Song } from '../types'

const OWNER = 'phucbm'
const REPO = 'clyrics'
const PR_LIST_URL = `https://github.com/${OWNER}/${REPO}/pulls`

export function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function songBaseName(song: { artist: string; title: string; id: string }) {
  const parts = [song.artist, song.title].map((s) => s.trim()).filter(Boolean)
  return parts.length > 0 ? parts.join('-') : song.id
}

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

async function resolveNewFilePath(song: Song, octokit: Octokit): Promise<string> {
  const base = songBaseName(song)
  let names: string[] = []
  try {
    const { data } = await octokit.rest.repos.getContent({ owner: OWNER, repo: REPO, path: 'songs' })
    names = Array.isArray(data) ? (data as Array<{ name: string }>).map((f) => f.name) : []
  } catch {
    // songs dir doesn't exist yet — any name is free
  }
  if (!names.includes(`${base}.json`)) return `songs/${base}.json`
  let n = 2
  while (names.includes(`${base}-${n}.json`)) n++
  return `songs/${base}-${n}.json`
}

export function prTitle(song: Song, nickname: string, mode: 'new' | 'edit') {
  const nick = slugify(nickname)
  const prefix = mode === 'edit' ? '[edit]' : '[new]'
  return `${prefix} ${song.artist} - ${song.title} by ${nick}`
}

export function prBody(song: Song, nickname: string) {
  const langs = [...new Set(song.lines.flatMap((l) => l.translations.map((t) => t.lang)))]
  return [
    `**Title:** ${song.title}`,
    `**Artist:** ${song.artist}`,
    `**Lines:** ${song.lines.length}`,
    `**Languages:** ${langs.join(', ') || 'none'}`,
    '',
    '---',
    `Contributed by: ${nickname}`,
    `_Added via C-Lyrics app. To request removal, open an issue or comment on this PR._`,
  ].join('\n')
}

export function getPRListUrl() {
  return PR_LIST_URL
}

async function createPR(
  octokit: Octokit,
  song: Song,
  nickname: string,
  mode: 'new' | 'edit',
  filePath: string,
  fileSha?: string,
): Promise<string> {
  const baseName = [song.artist, song.title].filter(Boolean).join('-') || song.id
  const branch = `song/${baseName}-${nanoid(6)}`

  const { data: ref } = await octokit.rest.git.getRef({ owner: OWNER, repo: REPO, ref: 'heads/main' })
  const mainSha = ref.object.sha

  // Strip internal-only fields before publishing
  const { source: _source, copiedFrom: _copiedFrom, ...songData } = song
  const finalSong = { ...songData, authors: [...new Set([...song.authors, nickname])] }
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(finalSong, null, 2))))

  await octokit.rest.git.createRef({ owner: OWNER, repo: REPO, ref: `refs/heads/${branch}`, sha: mainSha })

  await octokit.rest.repos.createOrUpdateFileContents({
    owner: OWNER,
    repo: REPO,
    path: filePath,
    message: prTitle(song, nickname, mode),
    content,
    branch,
    ...(fileSha ? { sha: fileSha } : {}),
  })

  const { data: pr } = await octokit.rest.pulls.create({
    owner: OWNER,
    repo: REPO,
    title: prTitle(song, nickname, mode),
    head: branch,
    base: 'main',
    body: prBody(song, nickname),
    labels: [mode],
  })

  try {
    await octokit.rest.pulls.requestReviewers({
      owner: OWNER,
      repo: REPO,
      pull_number: pr.number,
      reviewers: [OWNER],
    })
  } catch {
    // reviewer request non-fatal
  }

  return pr.html_url
}

export async function contributeNewSong(song: Song, nickname: string, resolvedFileName?: string): Promise<string> {
  const octokit = await getOctokit()
  const filePath = resolvedFileName
    ? `songs/${resolvedFileName}`
    : await resolveNewFilePath(song, octokit)
  return createPR(octokit, song, nickname, 'new', filePath)
}

export async function contributeEditSong(song: Song, nickname: string, originalId: string): Promise<string> {
  const octokit = await getOctokit()
  const filePath = `songs/${originalId}.json`
  let fileSha: string | undefined
  try {
    const { data: file } = await octokit.rest.repos.getContent({ owner: OWNER, repo: REPO, path: filePath })
    if ('sha' in file) fileSha = file.sha
  } catch {
    // file gone — still submit, it'll create
  }
  return createPR(octokit, { ...song, id: originalId }, nickname, 'edit', filePath, fileSha)
}
