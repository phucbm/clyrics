import { useSongStore } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { FAB } from '../shell/FAB'
import { AddSongSheet } from '../sheets/AddSongSheet'
import { Plus, ArrowRight } from '@phosphor-icons/react'
import type { Song } from '../../types'

function SongCard({ song, onClick }: { song: Song; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-3.5 bg-white border border-[#E0E0DC] rounded-xl hover:border-[#0F0F0F] transition-all flex items-center gap-3 group shadow-sm active:scale-[0.98]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#0F0F0F] truncate">{song.title}</p>
          <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-[#F0F0EC] text-[#999] font-medium uppercase">
            {song.source}
          </span>
        </div>
        <p className="text-xs text-[#888] mt-0.5">
          {[song.artist, `${song.lines.length} lines`].filter((v) => v && v !== 'Unknown').join(' · ')}
        </p>
      </div>
      <ArrowRight size={14} className="text-[#CCC] group-hover:text-[#555] transition-colors shrink-0" />
    </button>
  )
}

export function HomeScreen() {
  const { songs, setActiveSong } = useSongStore()
  const { navigateTo } = useUIStore()
  const { open } = useBottomSheet()

  function handleSelect(id: string) {
    setActiveSong(id)
    navigateTo('edit')
  }

  function openAddSong() {
    open(<AddSongSheet />, 'Add Song')
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <header className="shrink-0 px-5 pt-6 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F0F0F]">C-Lyrics</h1>
        <p className="text-xs text-[#999] mt-0.5">Chinese lyrics with pinyin &amp; translation</p>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {songs.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
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
            {songs.map((song) => (
              <SongCard key={song.id} song={song} onClick={() => handleSelect(song.id)} />
            ))}
          </div>
        )}
      </div>

      {/* FABs: right zone — [+] primary */}
      <div className="absolute bottom-6 right-5 z-20">
        <FAB onClick={openAddSong} label="Add song">
          <Plus size={22} />
        </FAB>
      </div>
    </div>
  )
}
