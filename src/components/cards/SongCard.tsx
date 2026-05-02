import { Play, Globe, Lock } from '@phosphor-icons/react'
import type { Song } from '../../types'

export function SongCardSkeleton() {
  return (
    <div className="relative animate-pulse">
      <div className="w-full px-4 py-3.5 bg-white border border-[#E0E0DC] rounded-xl flex items-center gap-3 shadow-sm">
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="h-3.5 bg-[#E8E8E4] rounded w-2/5" />
            <div className="h-2.5 w-2.5 bg-[#E8E8E4] rounded-full shrink-0" />
          </div>
          <div className="h-3 bg-[#E8E8E4] rounded w-3/5" />
        </div>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[#F0F0EC]" />
      </div>
    </div>
  )
}

interface Props {
  song: Song
  onEdit: () => void
  onPlay: () => void
}

export function SongCard({ song, onEdit, onPlay }: Props) {
  const langs = [...new Set(song.lines.flatMap((l) => l.translations.map((t) => t.lang)))]
  const langText = langs.join(', ')
  const isLocal = song.source === 'local'

  function relativeTime(ts: number) {
    const diff = Date.now() - ts
    const m = Math.floor(diff / 60000)
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    const d = Math.floor(h / 24)
    if (d < 30) return `${d}d ago`
    return new Date(ts).toLocaleDateString()
  }

  return (
    <div className="relative">
      <button
        onClick={onEdit}
        className="w-full text-left px-4 py-3.5 bg-white border border-[#E0E0DC] rounded-xl hover:border-[#0F0F0F] transition-all flex items-center gap-3 shadow-sm active:scale-[0.98]"
      >
        <div className="flex-1 min-w-0 pr-8">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-[#0F0F0F] truncate">{song.title}</p>
            {isLocal ? (
              <span className="shrink-0 text-[#B06000]"><Lock size={11} weight="fill" /></span>
            ) : (
              <span className="shrink-0 text-[#2E7D32]"><Globe size={11} weight="fill" /></span>
            )}
          </div>
          <p className="text-xs text-[#888] mt-0.5">
            {[
              song.artist,
              `${song.lines.length} lines`,
              langText,
              !isLocal && song.updatedAt ? relativeTime(song.updatedAt) : null,
            ]
              .filter((v) => v && v !== 'Unknown')
              .join(' · ')}
          </p>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onPlay() }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F0F0EC] text-[#888] hover:text-[#0F0F0F] transition-colors"
        >
          <Play size={15} weight="fill" />
        </button>
      </button>
    </div>
  )
}
