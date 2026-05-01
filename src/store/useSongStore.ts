import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Song, GitHubSettings, AppTab } from '../types'

interface SongStore {
  songs: Song[]
  activeSongId: string | null
  activeTab: AppTab
  activeLineIndex: number
  githubSettings: GitHubSettings | null

  addSong: (song: Song) => void
  updateSong: (id: string, updates: Partial<Song>) => void
  deleteSong: (id: string) => void
  setActiveSong: (id: string | null) => void
  setActiveTab: (tab: AppTab) => void
  setActiveLineIndex: (index: number) => void
  setGithubSettings: (settings: GitHubSettings | null) => void
}

export const useSongStore = create<SongStore>()(
  persist(
    (set) => ({
      songs: [],
      activeSongId: null,
      activeTab: 'input',
      activeLineIndex: 0,
      githubSettings: null,

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
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveLineIndex: (index) => set({ activeLineIndex: index }),
      setGithubSettings: (settings) => set({ githubSettings: settings }),
    }),
    {
      name: 'clyrics_songs',
      partialize: (s) => ({
        songs: s.songs,
        githubSettings: s.githubSettings,
      }),
    }
  )
)

export const useActiveSong = () => {
  const { songs, activeSongId } = useSongStore()
  return songs.find((s) => s.id === activeSongId) ?? null
}
