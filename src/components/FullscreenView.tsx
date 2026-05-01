import { useCallback } from 'react'
import { useActiveSong, useSongStore } from '../store/useSongStore'
import { ArrowLeft, ArrowRight, X } from '@phosphor-icons/react'

export function FullscreenView() {
  const song = useActiveSong()
  const { activeLineIndex, setActiveLineIndex, setActiveTab } = useSongStore()

  const prev = useCallback(() => {
    setActiveLineIndex(Math.max(0, activeLineIndex - 1))
  }, [activeLineIndex, setActiveLineIndex])

  const next = useCallback(() => {
    if (!song) return
    setActiveLineIndex(Math.min(song.lines.length - 1, activeLineIndex + 1))
  }, [activeLineIndex, song, setActiveLineIndex])

  if (!song || song.lines.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#555]">No song selected.</p>
        <button
          onClick={() => setActiveTab('input')}
          className="text-sm text-[#888] border border-[#333] px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
        >
          Go to Edit
        </button>
      </div>
    )
  }

  const prev_line = activeLineIndex > 0 ? song.lines[activeLineIndex - 1] : null
  const current = song.lines[activeLineIndex]
  const next_line = activeLineIndex < song.lines.length - 1 ? song.lines[activeLineIndex + 1] : null

  return (
    <div
      className="min-h-[100dvh] bg-[#0a0a0a] flex flex-col items-center justify-center px-8 select-none relative"
      onTouchStart={(e) => {
        const startX = e.touches[0].clientX
        const onEnd = (ev: TouchEvent) => {
          const dx = ev.changedTouches[0].clientX - startX
          if (dx > 50) prev()
          if (dx < -50) next()
          document.removeEventListener('touchend', onEnd)
        }
        document.addEventListener('touchend', onEnd)
      }}
    >
      {/* Back button — always visible */}
      <button
        onClick={() => setActiveTab('lyrics')}
        className="absolute top-5 left-5 flex items-center gap-1.5 text-xs text-[#555] hover:text-[#999] transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
      >
        <X size={14} />
        <span>Exit</span>
      </button>

      {/* Line counter */}
      <span className="absolute top-5 right-5 text-xs text-[#444] tabular-nums">
        {activeLineIndex + 1} / {song.lines.length}
      </span>

      {/* Prev line */}
      {prev_line && (
        <div className="mb-10 text-center opacity-25 max-w-sm">
          <p
            className="text-xs text-[#666] mb-1"
            style={{ fontFamily: "ui-monospace, 'SF Mono', monospace" }}
          >
            {prev_line.pinyin}
          </p>
          <p className="text-lg text-white/60">{prev_line.chinese}</p>
        </div>
      )}

      {/* Current line */}
      <div className="text-center max-w-md">
        {current.pinyin && (
          <p
            className="text-sm text-[#E1F3FE] mb-3 tracking-wide"
            style={{ fontFamily: "ui-monospace, 'SF Mono', monospace" }}
          >
            {current.pinyin}
          </p>
        )}
        <p className="text-4xl font-semibold text-white leading-tight tracking-tight">
          {current.chinese}
        </p>
        {current.translation && (
          <p className="text-base italic text-[#666] mt-4 leading-relaxed">
            {current.translation}
          </p>
        )}
      </div>

      {/* Next line */}
      {next_line && (
        <div className="mt-10 text-center opacity-25 max-w-sm">
          <p
            className="text-xs text-[#666] mb-1"
            style={{ fontFamily: "ui-monospace, 'SF Mono', monospace" }}
          >
            {next_line.pinyin}
          </p>
          <p className="text-lg text-white/60">{next_line.chinese}</p>
        </div>
      )}

      {/* Nav */}
      <div className="absolute bottom-10 flex items-center gap-6">
        <button
          onClick={prev}
          disabled={activeLineIndex === 0}
          className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white/60 disabled:opacity-20 hover:border-white/30 hover:text-white/90 transition-all active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={next}
          disabled={activeLineIndex === song.lines.length - 1}
          className="w-11 h-11 rounded-full border border-white/10 flex items-center justify-center text-white/60 disabled:opacity-20 hover:border-white/30 hover:text-white/90 transition-all active:scale-95"
        >
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  )
}
