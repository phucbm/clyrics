import { useSongStore } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { FAB } from '../shell/FAB'
import { FABGroup } from '../shell/FABGroup'
import { AddSongSheet } from '../sheets/AddSongSheet'
import { SongCard } from '../cards/SongCard'
import { useRepoSongs } from '../../hooks/useRepoSongs'
import { Plus, DiscordLogo, GithubLogo } from '@phosphor-icons/react'
import type { Song } from '../../types'

export function HomeScreen() {
  const { songs: localSongs, setActiveSong } = useSongStore()
  const { songs: repoSongs, loading: repoLoading } = useRepoSongs()
  const { navigateTo, setAutoplay } = useUIStore()
  const { open } = useBottomSheet()

  function handleEdit(song: Song) {
    setActiveSong(song)
    navigateTo('edit')
  }

  function handlePlay(song: Song) {
    setActiveSong(song)
    setAutoplay(true)
    navigateTo('play')
  }

  function openAddSong() {
    open(<AddSongSheet />, 'Add Song')
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <header className="shrink-0 px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <img src="/icon.png" alt="" className="w-8 h-8 rounded-lg" />
          <h1 className="text-2xl font-bold tracking-tight text-[#0F0F0F]">C-Lyrics</h1>
        </div>
        <p className="text-xs text-[#999] mt-0.5">Chinese lyrics with pinyin &amp; translation</p>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-28 space-y-6">

        {/* My Songs */}
        <section>
          <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-2 px-1">My Songs</h2>
          {localSongs.length === 0 ? (
            <div className="py-8 flex flex-col items-center gap-3 text-center">
              <p className="text-sm text-[#888]">No songs yet.</p>
              <button
                onClick={openAddSong}
                className="text-sm text-[#0F0F0F] font-medium underline underline-offset-2"
              >
                Add your first song
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {localSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onEdit={() => handleEdit(song)}
                  onPlay={() => handlePlay(song)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Community Songs */}
        <section>
          <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-2 px-1">Community Songs</h2>
          {repoLoading ? (
            <p className="text-sm text-[#888] px-1">Loading…</p>
          ) : repoSongs.length === 0 ? (
            <p className="text-sm text-[#888] px-1">No community songs yet.</p>
          ) : (
            <div className="space-y-2">
              {repoSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onEdit={() => handlePlay(song)}
                  onPlay={() => handlePlay(song)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="pt-2 pb-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <a
              href="https://discord.gg/TRF53Jkk5Y"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] text-xs font-medium hover:bg-[#5865F2]/20 transition-colors"
            >
              <DiscordLogo size={14} weight="fill" />
              Discord
            </a>
            <a
              href="https://github.com/phucbm/clyrics"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F0F0F]/8 text-[#0F0F0F] text-xs font-medium hover:bg-[#0F0F0F]/15 transition-colors"
            >
              <GithubLogo size={14} weight="fill" />
              GitHub
            </a>
          </div>
          <p className="text-[10px] text-[#bbb]">C-Lyrics · open source &amp; free forever</p>
        </footer>

      </div>

      {/* FABs: right zone — [+] primary */}
      <FABGroup side="right" className="absolute bottom-6 right-5 z-20">
        <FAB onClick={openAddSong} label="Add song">
          <Plus size={22} />
        </FAB>
      </FABGroup>
    </div>
  )
}
