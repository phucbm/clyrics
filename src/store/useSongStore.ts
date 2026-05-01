import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song, LyricLine } from '../types'

interface SongStore {
  songs: Song[]
  activeSongId: string | null

  addSong: (song: Song) => void
  updateSong: (id: string, updates: Partial<Song>) => void
  deleteSong: (id: string) => void
  setActiveSong: (id: string | null) => void
}

// Migrate lines from old shape { translation, secondTranslation } to new { translations[], order }
function migrateLine(line: Record<string, unknown>, index: number): LyricLine {
  const translations = Array.isArray(line.translations)
    ? (line.translations as LyricLine['translations'])
    : []

  if (translations.length === 0) {
    if (typeof line.translation === 'string' && line.translation) {
      translations.push({ lang: 'Vietnamese', text: line.translation })
    }
    if (typeof line.secondTranslation === 'string' && line.secondTranslation) {
      translations.push({ lang: 'English', text: line.secondTranslation })
    }
  }

  return {
    id: (line.id as string) ?? `migrated-${index}`,
    chinese: (line.chinese as string) ?? '',
    pinyin: (line.pinyin as string) ?? '',
    translations,
  }
}

function migrateSong(song: Record<string, unknown>): Song {
  const rawLines = Array.isArray(song.lines) ? song.lines : []
  return {
    id: song.id as string,
    title: (song.title as string) ?? 'Untitled',
    artist: (song.artist as string) ?? '',
    youtubeUrl: song.youtubeUrl as string | undefined,
    youtubeDuration: song.youtubeDuration as number | undefined,
    authors: Array.isArray(song.authors) ? (song.authors as string[]) : [],
    lines: rawLines.map((l, i) => migrateLine(l as Record<string, unknown>, i)),
    createdAt: (song.createdAt as number) ?? Date.now(),
    source: (song.source as 'local' | 'repo') ?? 'local',
  }
}

export const useSongStore = create<SongStore>()(
  persist(
    (set) => ({
      songs: [],
      activeSongId: null,

      addSong: (song) => set((s) => ({ songs: [song, ...s.songs] })),
      updateSong: (id, updates) =>
        set((s) => ({
          songs: s.songs.map((song) => (song.id === id ? { ...song, ...updates } : song)),
        })),
      deleteSong: (id) =>
        set((s) => ({
          songs: s.songs.filter((song) => song.id !== id),
          activeSongId: s.activeSongId === id ? null : s.activeSongId,
        })),
      setActiveSong: (id) => set({ activeSongId: id }),
    }),
    {
      name: 'clyrics_songs',
      partialize: (s) => ({ songs: s.songs }),
      merge: (persisted, current) => {
        const p = persisted as { songs?: unknown[] }
        const migratedSongs = (p.songs ?? []).map((s) =>
          migrateSong(s as Record<string, unknown>)
        )
        return { ...current, songs: migratedSongs }
      },
    }
  )
)

export const useActiveSong = () => {
  const { songs, activeSongId } = useSongStore()
  return songs.find((s) => s.id === activeSongId) ?? null
}
