import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { FAB } from '../shell/FAB'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { extractVideoId } from '../../hooks/useYouTube'
import { ArrowLeft, Pause, Play } from '@phosphor-icons/react'

// ── Tune this to change scroll speed feel ────────────────────────────────────
const SCROLL_SPEED_MULT = 0.6 // px/s = v² × SCROLL_SPEED_MULT  (v: 0–10)
// ─────────────────────────────────────────────────────────────────────────────
function toPxPerSec(v: number) { return v * v * SCROLL_SPEED_MULT }

const PIP_LS_KEY = 'clyrics_pip'
const PIP_MIN_W = 200
const PIP_DEFAULT = { x: 0, y: 80, w: 320 } // x recalculated on load

function loadPiP() {
  try {
    const s = localStorage.getItem(PIP_LS_KEY)
    if (s) return JSON.parse(s) as { x: number; y: number; w: number }
  } catch {}
  return { ...PIP_DEFAULT, x: Math.max(0, window.innerWidth - 340) }
}

function savePiP(state: { x: number; y: number; w: number }) {
  try { localStorage.setItem(PIP_LS_KEY, JSON.stringify(state)) } catch {}
}

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
  const [pip, setPip] = useState(loadPiP)
  const pipRef = useRef(pip)

  function update(patch: Partial<typeof pip>) {
    const next = { ...pipRef.current, ...patch }
    pipRef.current = next
    setPip(next)
    savePiP(next)
  }

  const h = Math.round(pip.w * 9 / 16)

  function startDrag(e: React.PointerEvent<HTMLDivElement>) {
    const ox = e.clientX - pipRef.current.x
    const oy = e.clientY - pipRef.current.y
    function onMove(ev: PointerEvent) {
      const { w } = pipRef.current
      const ch = Math.round(w * 9 / 16)
      update({
        x: Math.max(0, Math.min(window.innerWidth - w, ev.clientX - ox)),
        y: Math.max(0, Math.min(window.innerHeight - ch, ev.clientY - oy)),
      })
    }
    function onUp() {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    e.preventDefault()
  }

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    const startX = e.clientX
    const startW = pipRef.current.w
    function onMove(ev: PointerEvent) {
      const newW = Math.max(PIP_MIN_W, Math.min(window.innerWidth - pipRef.current.x, startW + ev.clientX - startX))
      const newH = Math.round(newW * 9 / 16)
      update({
        w: newW,
        y: Math.min(pipRef.current.y, window.innerHeight - newH),
      })
    }
    function onUp() {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    e.stopPropagation()
    e.preventDefault()
  }

  return (
    <div
      className="fixed z-[9999] rounded-2xl overflow-hidden shadow-2xl border border-black/20 select-none cursor-grab active:cursor-grabbing"
      style={{ left: pip.x, top: pip.y, width: pip.w, height: h }}
      onPointerDown={startDrag}
    >
      <div ref={containerRef} className="w-full h-full bg-black" style={{ pointerEvents: 'none' }} />

      {/* Resize grip — bottom-right corner */}
      <div
        className="absolute bottom-0 right-0 w-7 h-7 z-10 cursor-se-resize flex items-end justify-end p-1.5"
        onPointerDown={startResize}
        style={{ cursor: 'se-resize' }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M2 9L9 2M5.5 9L9 5.5M9 9H9" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  )
}

export function PlayScreen() {
  const song = useActiveSong()
  const { playConfig, screen, navigateTo, autoplay, setAutoplay } = useUIStore()
  const [focusMode, setFocusMode] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const bodyRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const videoId = song?.youtubeUrl ? extractVideoId(song.youtubeUrl) : null
  const { containerRef, isPlaying, isReady, play, togglePlay } = useYouTubePlayer(videoId)

  // Auto-hide controls logic
  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3000)
  }, [])

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    scheduleHide()
  }, [scheduleHide])

  // Autoplay once player is ready
  useEffect(() => {
    if (autoplay && isReady) {
      play()
      setAutoplay(false)
    }
  }, [autoplay, isReady, play, setAutoplay])

  // Focus mode + auto-hide tied to playing state
  useEffect(() => {
    setFocusMode(isPlaying)
    if (isPlaying) {
      revealControls()
    } else {
      setControlsVisible(true)
      clearTimeout(hideTimerRef.current)
    }
    return () => clearTimeout(hideTimerRef.current)
  }, [isPlaying, revealControls])

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
    const hasVideo = !!videoId
    if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current)
    if (speed === 0 || (hasVideo && !isPlaying)) return

    function tick(ts: number) {
      if (lastTickRef.current !== undefined && !isManualScrolling.current && bodyRef.current) {
        const dt = (ts - lastTickRef.current) / 1000
        const el = bodyRef.current
        scrollPosRef.current = Math.min(scrollPosRef.current + speed * dt, el.scrollHeight - el.clientHeight)
        el.scrollTop = scrollPosRef.current
      }
      lastTickRef.current = ts
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current) }
  }, [playConfig.scrollSpeed, videoId, isPlaying])

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
  const fabVisible = !focusMode || controlsVisible

  return (
    <div className="h-full flex flex-col relative">
      <div ref={bodyRef} onScroll={handleManualScroll} className="flex-1 overflow-y-auto">

        {videoId && !isDesktop && (
          <div className="sticky top-0 z-10 w-full bg-black" style={{ aspectRatio: '16/9' }}>
            <div ref={containerRef} className="w-full h-full" style={{ pointerEvents: 'none' }} />
          </div>
        )}

        <div style={{ height: videoId && !isDesktop ? '20vh' : '42vh' }} />

        <div className="px-6">
          <h2 className="text-3xl font-bold tracking-tight text-[#0F0F0F] leading-tight">{song.title}</h2>
          {showArtist && <p className="text-sm text-[#888] mt-1.5">{song.artist}</p>}
        </div>

        <div className="h-12" />

        <div className="px-6 pb-40 space-y-8">
          {song.lines.map((line) => (
            <div key={line.id}>
              {playConfig.pinyin && line.pinyin && (
                <p className="text-xs text-[#888] mb-1 leading-relaxed tracking-wide font-mono">{line.pinyin}</p>
              )}
              <p className="text-2xl font-semibold text-[#0F0F0F] leading-tight tracking-tight">{line.chinese}</p>
              {playConfig.translation && line.translation && (
                <p className="text-sm italic text-[#555] mt-1.5 leading-relaxed">{line.translation}</p>
              )}
              {playConfig.secondLang && line.secondTranslation && (
                <p className="text-sm text-[#777] mt-1 leading-relaxed">{line.secondTranslation}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {videoId && isDesktop && screen === 'play' && createPortal(
        <DraggablePiP containerRef={containerRef} />,
        document.body
      )}

      {/* Bottom touch zone — focus mode only, reveals controls */}
      {focusMode && (
        <div
          className="absolute bottom-0 inset-x-0 h-1/4 z-10"
          onPointerDown={revealControls}
        />
      )}

      {/* Back FAB — idle mode only */}
      {!focusMode && (
        <div className="absolute bottom-6 left-5 z-20">
          <FAB onClick={() => navigateTo('edit')} variant="secondary" label="Back to Edit">
            <ArrowLeft size={20} />
          </FAB>
        </div>
      )}

      {/* Play/Pause FAB — both modes, auto-hides in focus */}
      <div
        className={`absolute bottom-6 right-5 z-20 transition-opacity duration-500 ${
          fabVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <FAB onClick={togglePlay} label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
        </FAB>
      </div>
    </div>
  )
}
