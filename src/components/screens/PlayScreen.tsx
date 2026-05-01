import { useCallback, useEffect, useRef, useState } from 'react'
import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { FAB } from '../shell/FAB'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { extractVideoId } from '../../hooks/useYouTube'
import { ArrowLeft, Pause, Play } from '@phosphor-icons/react'
import type { ScrollSpeed } from '../../types'

const SCROLL_PX_PER_SEC: Record<ScrollSpeed, number> = {
  off: 0,
  slow: 18,
  normal: 45,
  fast: 110,
}

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

function DraggablePiP({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const [pos, setPos] = useState(() => ({
    x: Math.max(0, window.innerWidth - 340),
    y: 80,
  }))
  const dragging = useRef(false)
  const offset = useRef({ x: 0, y: 0 })

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    dragging.current = true
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - offset.current.x)),
      y: Math.max(0, Math.min(window.innerHeight - 180, e.clientY - offset.current.y)),
    })
  }

  function onPointerUp() { dragging.current = false }

  return (
    <div
      className="fixed z-50 rounded-xl overflow-hidden shadow-2xl border border-white/10 cursor-grab active:cursor-grabbing select-none"
      style={{ left: pos.x, top: pos.y, width: 320, height: 180 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div ref={containerRef} className="w-full h-full bg-black" />
    </div>
  )
}

export function PlayScreen() {
  const song = useActiveSong()
  const { playConfig, navigateTo, autoplay, setAutoplay } = useUIStore()
  const [focusMode, setFocusMode] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const videoId = song?.youtubeUrl ? extractVideoId(song.youtubeUrl) : null
  const { containerRef, isPlaying, isReady, play, togglePlay } = useYouTubePlayer(videoId)

  // Autoplay signal from PlayConfigSheet
  useEffect(() => {
    if (autoplay && isReady) {
      play()
      setAutoplay(false)
    }
  }, [autoplay, isReady, play, setAutoplay])

  // Focus mode follows playing state
  useEffect(() => {
    if (isPlaying) setFocusMode(true)
  }, [isPlaying])

  // Steady auto-scroll with manual scroll pause/resume
  const rafRef = useRef<number | undefined>(undefined)
  const lastTickRef = useRef<number | undefined>(undefined)
  const isManualScrolling = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleManualScroll = useCallback(() => {
    isManualScrolling.current = true
    clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      isManualScrolling.current = false
      lastTickRef.current = undefined
    }, 200)
  }, [])

  useEffect(() => {
    const speed = SCROLL_PX_PER_SEC[playConfig.scrollSpeed]

    if (speed === 0) {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
      return
    }

    function tick(ts: number) {
      if (!isManualScrolling.current && bodyRef.current) {
        const dt = lastTickRef.current !== undefined ? (ts - lastTickRef.current) / 1000 : 0
        const el = bodyRef.current
        const maxScroll = el.scrollHeight - el.clientHeight
        if (el.scrollTop < maxScroll) {
          el.scrollTop += speed * dt
        }
      }
      lastTickRef.current = ts
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    }
  }, [playConfig.scrollSpeed])

  if (!song) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-[#888]">No song selected.</p>
        <button
          onClick={() => navigateTo('edit')}
          className="text-sm font-medium text-[#0F0F0F] underline underline-offset-2"
        >
          Back to Edit
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Header — hidden in focus mode */}
      {!focusMode && (
        <header className="shrink-0 px-5 pt-4 pb-3 border-b border-[#E0E0DC] bg-[#F8F7F5]">
          <h2 className="text-base font-semibold text-[#0F0F0F] truncate">{song.title}</h2>
          {song.artist && song.artist !== 'Unknown' && (
            <p className="text-xs text-[#888] mt-0.5">{song.artist}</p>
          )}
        </header>
      )}

      {/* Body */}
      <div ref={bodyRef} onScroll={handleManualScroll} className="flex-1 overflow-y-auto">
        {/* YouTube inline — mobile only, sticky below header */}
        {videoId && !isDesktop && (
          <div className="sticky top-0 z-10 w-full bg-black" style={{ aspectRatio: '16/9' }}>
            <div ref={containerRef} className="w-full h-full" />
          </div>
        )}

        {/* Lyrics */}
        <div className="px-5 pt-6 pb-32 space-y-8">
          {song.lines.map((line) => (
            <div key={line.id}>
              {playConfig.pinyin && line.pinyin && (
                <p
                  className="text-xs text-[#888] mb-1 leading-relaxed tracking-wide"
                  style={{ fontFamily: "ui-monospace, 'SF Mono', monospace" }}
                >
                  {line.pinyin}
                </p>
              )}
              <p className="text-2xl font-semibold text-[#0F0F0F] leading-tight tracking-tight">
                {line.chinese}
              </p>
              {playConfig.translation && line.translation && (
                <p className="text-sm italic text-[#555] mt-1.5 leading-relaxed">
                  {line.translation}
                </p>
              )}
              {playConfig.secondLang && line.secondTranslation && (
                <p className="text-sm text-[#777] mt-1 leading-relaxed">
                  {line.secondTranslation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* YouTube PiP — desktop only, draggable */}
      {videoId && isDesktop && <DraggablePiP containerRef={containerRef} />}

      {/* FABs — idle */}
      {!focusMode && (
        <>
          <div className="absolute bottom-6 left-5 z-20">
            <FAB onClick={() => navigateTo('edit')} variant="secondary" label="Back to Edit">
              <ArrowLeft size={20} />
            </FAB>
          </div>
          <div className="absolute bottom-6 right-5 z-20">
            <FAB onClick={togglePlay} label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
            </FAB>
          </div>
        </>
      )}

      {/* FABs — focus mode */}
      {focusMode && (
        <div className="absolute bottom-6 right-5 z-20">
          <FAB onClick={togglePlay} label={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
          </FAB>
        </div>
      )}
    </div>
  )
}
