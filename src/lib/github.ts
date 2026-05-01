import { Octokit } from 'octokit'
import type { Song, GitHubSettings } from '../types'

const UPSTREAM_OWNER = 'phucbm'
const UPSTREAM_REPO = 'clyrics'

export async function contributeSong(song: Song, settings: GitHubSettings): Promise<string> {
  const octokit = new Octokit({ auth: settings.token })

  // Get latest SHA from upstream main
  const { data: ref } = await octokit.rest.git.getRef({
    owner: UPSTREAM_OWNER,
    repo: UPSTREAM_REPO,
    ref: 'heads/main',
  })
  const sha = ref.object.sha

  const filePath = `songs/${song.id}.json`
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(song, null, 2))))
  const branch = `song/${song.id}`

  // Get fork's default branch SHA to create new branch from
  const { data: forkRef } = await octokit.rest.git.getRef({
    owner: settings.username,
    repo: UPSTREAM_REPO,
    ref: 'heads/main',
  })

  // Create branch in fork
  await octokit.rest.git.createRef({
    owner: settings.username,
    repo: UPSTREAM_REPO,
    ref: `refs/heads/${branch}`,
    sha: forkRef.object.sha,
  })

  // Create file in fork
  await octokit.rest.repos.createOrUpdateFileContents({
    owner: settings.username,
    repo: UPSTREAM_REPO,
    path: filePath,
    message: `feat: add song "${song.title}" by ${song.artist}`,
    content,
    branch,
  })

  // Open PR to upstream
  const { data: pr } = await octokit.rest.pulls.create({
    owner: UPSTREAM_OWNER,
    repo: UPSTREAM_REPO,
    title: `feat: add song "${song.title}" by ${song.artist}`,
    head: `${settings.username}:${branch}`,
    base: 'main',
    body: `Adding song contribution via C-Lyrics app.\n\n**Title:** ${song.title}\n**Artist:** ${song.artist}\n**Lines:** ${song.lines.length}`,
  })

  void sha // referenced for upstream SHA context
  return pr.html_url
}
