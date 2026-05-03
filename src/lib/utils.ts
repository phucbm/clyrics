export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿㐀-䶿\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
}

export function songChangeSummary(
  local: import('../types').Song,
  repo: import('../types').Song
): { changedLines: number; metaChanged: boolean } {
  const metaChanged = local.title !== repo.title || local.artist !== repo.artist
  const overlap = Math.min(local.lines.length, repo.lines.length)
  let changedLines = Math.abs(local.lines.length - repo.lines.length)
  for (let i = 0; i < overlap; i++) {
    const l = local.lines[i]
    const r = repo.lines[i]
    if (
      l.chinese !== r.chinese ||
      l.pinyin !== r.pinyin ||
      JSON.stringify(l.translations) !== JSON.stringify(r.translations)
    ) changedLines++
  }
  return { changedLines, metaChanged }
}

export function songHasChanges(local: import('../types').Song, repo: import('../types').Song): boolean {
  if (local.title !== repo.title || local.artist !== repo.artist) return true
  if (local.lines.length !== repo.lines.length) return true
  return local.lines.some((line, i) => {
    const r = repo.lines[i]
    if (line.chinese !== r.chinese || line.pinyin !== r.pinyin) return true
    if (JSON.stringify(line.translations) !== JSON.stringify(r.translations)) return true
    return false
  })
}

export function makeSongId(title: string, artist: string): string {
  const parts = [slugify(artist), slugify(title)].filter(Boolean)
  if (parts.length === 0) return `song-${Date.now()}`
  return parts.join('-')
}
