import { useEffect, useState } from 'react'
import { useSongStore } from '../store/useSongStore'
import { useUIStore } from '../store/useUIStore'
import type { Song } from '../types'

const REPO_RAW = 'https://raw.githubusercontent.com/phucbm/clyrics/main/songs'

async function fetchRepoSong(id: string): Promise<Song | null> {
  try {
    const res = await fetch(`${REPO_RAW}/${encodeURIComponent(id)}.json`)
    if (!res.ok) return null
    const song = await res.json()
    return { ...song, source: 'repo' as const }
  } catch {
    return null
  }
}

function updateUrl(screen: string, songId: string | undefined) {
  const params = new URLSearchParams()
  if (songId && screen !== 'home') {
    params.set('song', songId)
    if (screen === 'edit') params.set('screen', 'edit')
  }
  const search = params.toString()
  window.history.replaceState(null, '', search ? `?${search}` : location.pathname)
}

// true when no ?song param — nothing async to resolve
const hasSongParam = !!new URLSearchParams(window.location.search).get('song')

export function useUrlSync() {
  const [ready, setReady] = useState(!hasSongParam)

  // On mount: read URL → restore state
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const songId = params.get('song')
    if (!songId) return

    const targetScreen = params.get('screen') === 'edit' ? 'edit' : 'play'
    const { songs, setActiveSong } = useSongStore.getState()
    const { navigateTo } = useUIStore.getState()

    const local = songs.find((s) => s.id === songId)
    if (local) {
      setActiveSong(local)
      navigateTo(targetScreen)
      setReady(true)
      return
    }

    fetchRepoSong(songId).then((song) => {
      if (song) {
        useSongStore.getState().setActiveSong(song)
        useUIStore.getState().navigateTo(targetScreen)
      } else {
        window.history.replaceState(null, '', location.pathname)
      }
      setReady(true)
    })
  }, [])

  // On store changes: keep URL in sync
  useEffect(() => {
    const unsub1 = useSongStore.subscribe((state) => {
      updateUrl(useUIStore.getState().screen, state.activeSong?.id)
    })
    const unsub2 = useUIStore.subscribe((state) => {
      updateUrl(state.screen, useSongStore.getState().activeSong?.id)
    })
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  return { ready }
}
