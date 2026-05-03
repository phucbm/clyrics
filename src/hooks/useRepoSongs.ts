import { useEffect, useState } from 'react'
import type { Song } from '../types'

let cache: Song[] | null = null

export function invalidateRepoSongsCache() {
  cache = null
}

export function useRepoSongs() {
  const [songs, setSongs] = useState<Song[]>(cache ?? [])
  const [loading, setLoading] = useState(cache === null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cache) {
      setSongs(cache)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch('/songs/index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load songs index: ${r.status}`)
        return r.json() as Promise<Song[]>
      })
      .then((data) => {
        if (!cancelled) {
          cache = data
          setSongs(data)
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
