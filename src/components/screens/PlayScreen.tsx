import {createPortal} from 'react-dom'
import {useCallback, useEffect, useRef, useState, type RefObject} from 'react'
import {useActiveSong} from '../../store/useSongStore'
import {useUIStore} from '../../store/useUIStore'
import {FAB} from '../shell/FAB'
import {useYouTubePlayer} from '../../hooks/useYouTubePlayer'
import {extractVideoId} from '../../hooks/useYouTube'
import {ArrowLeft, Pause, Play} from '@phosphor-icons/react'

const AVG_LINE_PX = 80   // estimated px per lyric group
const SPEED_PRESETS = [0, 0.2, 0.4, 0.6, 0.8, 1, 2, 3]

function toPxPerSec(linesPerSec: number) {
    return linesPerSec * AVG_LINE_PX
}

const PIP_LS_KEY = 'clyrics_pip'
const HINT_LS_KEY = 'clyrics_focus_hint'
const PIP_MIN_W = 200
const PIP_DEFAULT = {x: 0, y: 80, w: 320}

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
  progressBarRef: RefObject<HTMLDivElement | null>
}

function DraggablePiP({ containerRef, progressBarRef }: PiPProps) {
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

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div ref={progressBarRef} className="h-full bg-white/80" style={{ width: '0%' }} />
      </div>

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
    const {playConfig, setPlayConfig, screen, navigateTo, autoplay, setAutoplay} = useUIStore()
  const [focusMode, setFocusMode] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hintShownRef = useRef(localStorage.getItem(HINT_LS_KEY) === '1')

  const videoId = song?.youtubeUrl ? extractVideoId(song.youtubeUrl) : null
  const [loopCountdown, setLoopCountdown] = useState<number | null>(null)

  const handleEnded = useCallback(() => {
    setLoopCountdown(null)
    if (playConfig.loop) {
      // hook already seeks to 0 + plays; sync scroll after it settles
      setTimeout(() => syncToVideo(), 200)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playConfig.loop])

  const { containerRef, isPlaying, isReady, play, togglePlay, seekTo, getProgress, getTimeInfo } = useYouTubePlayer(videoId, playConfig.loop, handleEnded)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const [scrubPct, setScrubPct] = useState(0)
  const [showScrubber, setShowScrubber] = useState(false)
  const [scrubValue, setScrubValue] = useState(0)

    // Refs so wheel/touch handlers always see current values without re-registering
    const speedRef = useRef(0)
    const isPlayingRef = useRef(false)
    const videoIdRef = useRef<string | null>(null)
    const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
    const touchStartYRef = useRef(0)
    const touchScrollPosRef = useRef(0)

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

  // Poll video progress for the % button + loop countdown
  useEffect(() => {
    if (!videoId) { setScrubPct(0); return }
    const id = setInterval(() => {
      setScrubPct(Math.round(getProgress() * 100))
      if (playConfig.loop && isPlaying) {
        const { currentTime, duration } = getTimeInfo()
        const remaining = duration - currentTime
        if (duration && remaining > 0 && remaining <= 5) {
          setLoopCountdown(Math.ceil(remaining))
        } else {
          setLoopCountdown(null)
        }
      } else {
        setLoopCountdown(null)
      }
    }, 250)
    return () => clearInterval(id)
  }, [videoId, playConfig.loop, isPlaying])

  // Focus mode + auto-hide + first-play hint
  useEffect(() => {
    setFocusMode(isPlaying)
    if (isPlaying) {
      revealControls()
      if (!hintShownRef.current) {
        hintShownRef.current = true
        localStorage.setItem(HINT_LS_KEY, '1')
        setShowHint(true)
        hintTimerRef.current = setTimeout(() => setShowHint(false), 4000)
      }
    } else {
      setControlsVisible(true)
      clearTimeout(hideTimerRef.current)
      setShowHint(false)
      clearTimeout(hintTimerRef.current)
    }
    return () => {
      clearTimeout(hideTimerRef.current)
      clearTimeout(hintTimerRef.current)
    }
  }, [isPlaying, revealControls])

    // CSS-transition progress bar — mirrors scroll animation approach
    function startProgressAnimation() {
        const el = progressBarRef.current
        if (!el) return
        const { currentTime, duration } = getTimeInfo()
        if (!duration) return
        const pct = (currentTime / duration) * 100
        const remaining = duration - currentTime
        el.style.transition = 'none'
        el.style.width = `${pct}%`
        void el.offsetWidth
        el.style.transition = `width ${remaining}s linear`
        el.style.width = '100%'
    }

    function pauseProgressAnimation() {
        const el = progressBarRef.current
        if (!el) return
        const computed = getComputedStyle(el).width
        const parent = el.parentElement
        const pct = parent ? (parseFloat(computed) / parent.clientWidth) * 100 : 0
        el.style.transition = 'none'
        el.style.width = `${pct}%`
    }

    // ── Transform-based auto-scroll ───────────────────────────────────────────

    function getScrollPos(): number {
        if (!contentRef.current) return 0
        const t = getComputedStyle(contentRef.current).transform
        if (t === 'none') return 0
        return -new DOMMatrix(t).m42
    }

    function getMaxScroll(): number {
        if (!contentRef.current || !bodyRef.current) return 0
        return Math.max(0, contentRef.current.scrollHeight - bodyRef.current.clientHeight)
    }

    function setScrollImmediate(px: number) {
        const el = contentRef.current
        if (!el) return
        el.style.transition = 'none'
        el.style.transform = `translateY(${-px}px)`
    }

    function startScrollAnimation(fromPx: number) {
        const el = contentRef.current
        if (!el) return
        const speed = speedRef.current
        if (speed === 0) return
        const max = getMaxScroll()
        const clamped = Math.min(fromPx, max)
        if (clamped >= max) return
        const duration = (max - clamped) / speed

        el.style.transition = 'none'
        el.style.transform = `translateY(${-clamped}px)`
        void el.offsetHeight // force reflow so browser registers the no-transition position
        el.style.transition = `transform ${duration}s linear`
        el.style.transform = `translateY(${-max}px)`
    }

    function pauseAnimation(): number {
        const pos = getScrollPos()
        setScrollImmediate(pos)
        return pos
    }

    function resumeIfActive() {
        if (speedRef.current > 0 && (!videoIdRef.current || isPlayingRef.current)) {
            startScrollAnimation(getScrollPos())
        }
    }

    // Wheel — intercept on the overflow:hidden container
    useEffect(() => {
        const el = bodyRef.current
        if (!el) return

        function onWheel(e: WheelEvent) {
            e.preventDefault()
            const current = pauseAnimation()
            const max = getMaxScroll()
            const next = Math.max(0, Math.min(max, current + e.deltaY))
            setScrollImmediate(next)
            clearTimeout(resumeTimerRef.current)
            resumeTimerRef.current = setTimeout(resumeIfActive, 500)
        }

        el.addEventListener('wheel', onWheel, {passive: false})
        return () => el.removeEventListener('wheel', onWheel)
  }, [])

    // Touch — intercept on the overflow:hidden container
  useEffect(() => {
      const el = bodyRef.current
      if (!el) return

      function onTouchStart(e: TouchEvent) {
          touchStartYRef.current = e.touches[0].clientY
          touchScrollPosRef.current = pauseAnimation()
          clearTimeout(resumeTimerRef.current)
      }

      function onTouchMove(e: TouchEvent) {
          e.preventDefault()
          const dy = touchStartYRef.current - e.touches[0].clientY
          const max = getMaxScroll()
          const next = Math.max(0, Math.min(max, touchScrollPosRef.current + dy))
          setScrollImmediate(next)
      }

      function onTouchEnd() {
          resumeTimerRef.current = setTimeout(resumeIfActive, 500)
      }

      el.addEventListener('touchstart', onTouchStart, {passive: true})
      el.addEventListener('touchmove', onTouchMove, {passive: false})
      el.addEventListener('touchend', onTouchEnd, {passive: true})
      return () => {
          el.removeEventListener('touchstart', onTouchStart)
          el.removeEventListener('touchmove', onTouchMove)
          el.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

    // Start/stop animation on play state or speed change
    useEffect(() => {
        speedRef.current = toPxPerSec(playConfig.scrollSpeed)
        isPlayingRef.current = isPlaying
        videoIdRef.current = videoId

        if (videoId && isPlaying) {
            syncToVideo()
        } else if (speedRef.current > 0 && !videoId) {
            startScrollAnimation(getScrollPos())
        } else {
            pauseAnimation()
            if (videoId) pauseProgressAnimation()
        }
  }, [playConfig.scrollSpeed, videoId, isPlaying])

    function syncToVideo() {
        const progress = getProgress()
        const max = getMaxScroll()
        const targetPx = progress * max
        pauseAnimation()
        setScrollImmediate(targetPx)
        pauseProgressAnimation()
        setTimeout(() => {
            if (speedRef.current > 0 && (!videoIdRef.current || isPlayingRef.current)) {
                startScrollAnimation(targetPx)
            }
            if (isPlayingRef.current) startProgressAnimation()
        }, 50)
    }

    // ─────────────────────────────────────────────────────────────────────────

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

        {/* Mobile video — outside scroll container so sticky isn't needed */}
        {videoId && !isDesktop && (
            <div className="relative w-full bg-black flex-shrink-0" style={{aspectRatio: '16/9'}}>
                <div ref={containerRef} className="w-full h-full" style={{pointerEvents: 'none'}}/>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div ref={progressBarRef} className="h-full bg-white/80" style={{ width: '0%' }} />
                </div>
            </div>
        )}

        {/* Scroll area — overflow:hidden, content moves via translateY */}
        <div ref={bodyRef} className="flex-1 overflow-hidden">
            <div ref={contentRef} style={{willChange: 'transform'}}>

                <div style={{height: videoId && !isDesktop ? '20vh' : '42vh'}}/>

                <div className="px-6">
                    <h2 className="text-3xl font-bold tracking-tight text-[#0F0F0F] leading-tight">{song.title}</h2>
                    {showArtist && <p className="text-sm text-[#888] mt-1.5">{song.artist}</p>}
                </div>

                <div className="h-12"/>

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
      </div>

      {videoId && isDesktop && screen === 'play' && createPortal(
        <DraggablePiP containerRef={containerRef} progressBarRef={progressBarRef} />,
        document.body
      )}

      {/* Bottom touch/hover zone — focus mode only, reveals controls */}
      {focusMode && (
        <div
          className="absolute bottom-0 inset-x-0 h-1/4 z-10"
          onPointerDown={isDesktop ? undefined : revealControls}
          onMouseEnter={isDesktop ? revealControls : undefined}
        >
          {/* First-play hint */}
          <div
            className={`absolute bottom-24 inset-x-0 flex justify-center transition-opacity duration-500 ${
              showHint ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <span className="px-4 py-2 bg-black/60 text-white/90 text-xs rounded-full backdrop-blur-sm">
              {isDesktop ? 'Hover here to show pause button' : 'Tap here to show pause button'}
            </span>
          </div>
        </div>
      )}

      {/* Back FAB — idle mode only */}
      {!focusMode && (
        <div className="absolute bottom-6 left-5 z-20">
          <FAB onClick={() => navigateTo('edit')} variant="secondary" label="Back to Edit">
            <ArrowLeft size={20} />
          </FAB>
        </div>
      )}

        {/* Speed + Play/Pause FABs — both modes, auto-hide in focus */}
      <div
          className={`absolute bottom-6 right-5 z-20 flex flex-col items-center gap-3 transition-opacity duration-500 ${
          fabVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
          {videoId && (
              <FAB onClick={() => { setScrubValue(scrubPct); setShowScrubber(v => !v) }} variant="secondary" label="Video progress">
                  <span className="text-xs font-bold tabular-nums leading-none">{scrubPct}%</span>
              </FAB>
          )}
          {videoId && (
              <FAB onClick={syncToVideo} variant="secondary" label="Sync to video">
                  <span className="text-xs font-bold">sync</span>
              </FAB>
          )}
          {videoId && <FAB
              onClick={() => {
                  const idx = SPEED_PRESETS.indexOf(playConfig.scrollSpeed)
                  const next = idx >= 0 ? (idx + 1) % SPEED_PRESETS.length : 0
                  setPlayConfig({scrollSpeed: SPEED_PRESETS[next]})
              }}
              variant="secondary"
              label="Scroll speed"
          >
          <span className="text-xs font-bold tabular-nums leading-none">
            {playConfig.scrollSpeed === 0 ? 'off' : playConfig.scrollSpeed % 1 === 0
                ? playConfig.scrollSpeed.toString()
                : playConfig.scrollSpeed.toFixed(1)}
          </span>
          </FAB>}
          {videoId && (
            <FAB onClick={togglePlay} label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />}
            </FAB>
          )}
      </div>

      {/* Loop countdown toast */}
      {loopCountdown !== null && videoId && (
        <div className="absolute bottom-24 inset-x-0 flex justify-center z-30 pointer-events-none">
          <div className="px-4 py-2 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm tabular-nums">
            Loop in {loopCountdown}s
          </div>
        </div>
      )}

      {/* Video scrubber popup */}
      {showScrubber && videoId && (
        <div className="absolute bottom-6 right-[4.5rem] z-30 bg-white rounded-2xl shadow-xl border border-black/10 p-4 w-56">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-semibold text-[#333]">{scrubValue}%</span>
            <button
              onClick={() => setShowScrubber(false)}
              className="text-[#999] hover:text-[#333] text-xs leading-none"
            >✕</button>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={scrubValue}
            onChange={e => {
              const v = Number(e.target.value)
              setScrubValue(v)
              seekTo(v / 100)
            }}
            onPointerUp={() => setTimeout(syncToVideo, 150)}
            className="w-full accent-[#0F0F0F]"
          />
        </div>
      )}
    </div>
  )
}
