import { useState, useRef, useEffect } from 'react'
import { Play, GitPullRequest } from '@phosphor-icons/react'
import { useBottomSheet } from '../shell/BottomSheet'
import { ContributeSheet } from '../sheets/ContributeSheet'
import type { Song } from '../../types'

interface Props {
  song: Song
  onEdit: () => void
  onPlay: () => void
}

export function SongCard({ song, onEdit, onPlay }: Props) {
  const { open } = useBottomSheet()
  const [showPopup, setShowPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    if (!showPopup) return
    function handleClick(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showPopup])

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
              <button
                onClick={(e) => { e.stopPropagation(); setShowPopup((v) => !v) }}
                className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-[#FFF3E0] text-[#B06000] font-medium uppercase hover:bg-[#FFE0B2] transition-colors"
              >
                personal
              </button>
            ) : (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-[#E8F5E9] text-[#2E7D32] font-medium uppercase">
                community
              </span>
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

      {showPopup && (
        <div
          ref={popupRef}
          className="absolute left-0 top-full mt-1.5 z-30 w-72 bg-white border border-[#E0E0DC] rounded-xl shadow-lg px-4 py-3.5 space-y-3"
        >
          <p className="text-xs text-[#555] leading-relaxed">
            Create a Pull Request to save your lyrics. Once reviewed and merged, you can find it in the Community section.
          </p>
          <button
            onClick={() => { setShowPopup(false); open(<ContributeSheet song={song} />, 'Contribute') }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F0F0F] text-white text-xs font-semibold rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <GitPullRequest size={12} weight="fill" />
            Contribute
          </button>
        </div>
      )}
    </div>
  )
}
