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

export function makeSongId(title: string, artist: string): string {
  const parts = [slugify(artist), slugify(title)].filter(Boolean)
  if (parts.length === 0) return `song-${Date.now()}`
  return parts.join('-')
}
