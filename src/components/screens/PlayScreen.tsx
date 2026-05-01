import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { FAB } from '../shell/FAB'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { extractVideoId } from '../../hooks/useYouTube'
import { ArrowLeft, Pause, Play } from '@phosphor-icons/react'

// px/sec = speed² * 0.3  →  0→0, 5→7.5, 10→30
function toPxPerSec(v: number) { return v * v * 0.3 }

function useMediaQuery(query: string) {
  const [m, setM] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const h = (e: MediaQueryListEvent) => setM(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [query])
  return m
}

interface PiPProps {
  containerRef: (el: HTMLDivElement | null) => void
}

function DraggablePiP({ containerRef }: PiPProps) {
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
      className="fixed z-[9999] rounded-2xl overflow-hidden shadow-2xl border border-black/20 cursor-grab active:cursor-grabbing select-none"
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
  const { playConfig, screen, navigateTo, autoplay, setAutoplay } = useUIStore()
  const [focusMode, setFocusMode] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')

  const videoId = song?.youtubeUrl ? extractVideoId(song.youtubeUrl) : null
  const { containerRef, isPlaying, isReady, play, togglePlay } = useYouTubePlayer(videoId)

  // Trigger autoplay once player is ready
  useEffect(() => {
    if (autoplay && isReady) {
      play()
      setAutoplay(false)
    }
  }, [autoplay, isReady, play, setAutoplay])

  // Focus mode: enter when playing, exit when paused
  useEffect(() => {
    if (isPlaying) setFocusMode(true)
    else setFocusMode(false)
  }, [isPlaying])

  // --- Smooth steady auto-scroll ---
  const rafRef = useRef<number | undefined>(undefined)
  const lastTickRef = useRef<number | undefined>(undefined)
  const scrollPosRef = useRef(0)
  const isManualScrolling = useRef(false)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleManualScroll = useCallback(() => {
    if (bodyRef.current) scrollPosRef.current = bodyRef.current.scrollTop
    isManualScrolling.current = true
    clearTimeout(resumeTimerRef.current)
    resumeTimerRef.current = setTimeout(() => {
      isManualScrolling.current = false
      lastTickRef.current = undefined
    }, 200)
  }, [])

  useEffect(() => {
    const speed = toPxPerSec(playConfig.scrollSpeed)

    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)

    if (speed === 0) return

    function tick(ts: number) {
      if (lastTickRef.current !== undefined && !isManualScrolling.current && bodyRef.current) {
        const dt = (ts - lastTickRef.current) / 1000
        const el = bodyRef.current
        const maxScroll = el.scrollHeight - el.clientHeight
        scrollPosRef.current = Math.min(scrollPosRef.current + speed * dt, maxScroll)
        el.scrollTop = scrollPosRef.current
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
        <button onClick={() => navigateTo('edit')} className="text-sm font-medium text-[#0F0F0F] underline underline-offset-2">
          Back to Edit
        </button>
      </div>
    )
  }

  const showArtist = song.artist && song.artist !== 'Unknown' && song.artist !== ''

  return (
    <div className="h-full flex flex-col relative">
      {/* Body */}
      <div ref={bodyRef} onScroll={handleManualScroll} className="flex-1 overflow-y-auto">

        {/* YouTube inline — mobile only, sticky at top */}
        {videoId && !isDesktop && (
          <div className="sticky top-0 z-10 w-full bg-black" style={{ aspectRatio: '16/9' }}>
            <div ref={containerRef} className="w-full h-full" />
          </div>
        )}

        {/* Spacer: push title to approx mid-screen */}
        <div style={{ height: videoId && !isDesktop ? '20vh' : '42vh' }} />

        {/* Title + Artist */}
        <div className="px-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#0F0F0F] leading-tight">{song.title}</h2>
          {showArtist && <p className="text-sm text-[#888] mt-1.5">{song.artist}</p>}
        </div>

        {/* Gap before lyrics */}
        <div className="h-12" />

        {/* Lyrics */}
        <div className="px-6 pb-40 space-y-8">
          {song.lines.map((line) => (
            <div key={line.id}>
              {playConfig.pinyin && line.pinyin && (
                <p className="text-xs text-[#888] mb-1 leading-relaxed tracking-wide font-mono">
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

      {/* Desktop PiP — portaled to body so it escapes the slider's transform */}
      {videoId && isDesktop && screen === 'play' && createPortal(
        <DraggablePiP containerRef={containerRef} />,
        document.body
      )}

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
