import { useEffect, useState } from 'react'
import type { Song } from '../types'

const SONGS_API = 'https://api.github.com/repos/phucbm/clyrics/contents/songs'
const CACHE_TTL = 5 * 60 * 1000

let cache: Song[] | null = null
let cacheTime = 0

export function useRepoSongs() {
  const [songs, setSongs] = useState<Song[]>(cache ?? [])
  const [loading, setLoading] = useState(cache === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache && Date.now() - cacheTime < CACHE_TTL) {
      setSongs(cache)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(SONGS_API)
      .then((r) => {
        if (!r.ok) throw new Error(`GitHub API ${r.status}`)
        return r.json()
      })
      .then(async (files: Array<{ download_url: string; name: string }>) => {
        const jsonFiles = files.filter((f) => f.name.endsWith('.json'))
        const results = await Promise.allSettled(
          jsonFiles.map((f) => fetch(f.download_url).then((r) => r.json()))
        )
        const fetched: Song[] = results
          .filter((r): r is PromiseFulfilledResult<Song> => r.status === 'fulfilled')
          .map((r) => ({ ...r.value, source: 'repo' as const }))

        if (!cancelled) {
          cache = fetched
          cacheTime = Date.now()
          setSongs(fetched)
          setLoading(false)
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { songs, loading, error }
}
