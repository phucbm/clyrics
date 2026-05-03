import {createPortal} from 'react-dom'
import {nanoid} from 'nanoid'
import {useCallback, useEffect, useRef, useState, type RefObject} from 'react'
import {useActiveSong, useSongStore} from '../../store/useSongStore'
import {useUIStore} from '../../store/useUIStore'
import {useYouTubePlayer} from '../../hooks/useYouTubePlayer'
import {extractVideoId} from '../../hooks/useYouTube'
import {ArrowLeft, MusicNote, Pause, Play, PencilSimple} from '@phosphor-icons/react'
import {FABBar} from '../shell/FABBar'
import {ToolBar} from '../shell/ToolBar'
import {USE_TOOLBAR, type ControlButton} from '../shell/controls'
import {useBottomSheet} from '../shell/BottomSheet'
import {PlayConfigSheet} from '../sheets/PlayConfigSheet'
import {ShareSheet} from '../sheets/ShareSheet'
import {FloatingNotes, type FloatingNotesHandle} from '../sheets/MusicAnimations'
import type {Song} from '../../types'

const AVG_LINE_PX = 80   // estimated px per lyric group

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
  onReveal?: () => void
  onProgressDrag: (e: React.PointerEvent<HTMLDivElement>) => void
}

function DraggablePiP({ containerRef, progressBarRef, onReveal, onProgressDrag }: PiPProps) {
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
      onClick={onReveal}
    >
      <div ref={containerRef} className="w-full h-full bg-black" style={{ pointerEvents: 'none' }} />

      {/* Progress bar — taller touch target for drag-to-seek */}
      <div
        className="absolute bottom-0 left-0 right-0 h-6 flex items-end cursor-pointer"
        onPointerDown={onProgressDrag}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full h-1 bg-white/20 pointer-events-none">
          <div ref={progressBarRef} className="h-full bg-white/80" style={{ width: '0%' }} />
        </div>
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

interface ForkConfirmProps {
  existingCopy: Song | null
  onEditCopy: (copy: Song) => void
  onNewCopy: () => void
}

function ForkConfirmSheet({ existingCopy, onEditCopy, onNewCopy }: ForkConfirmProps) {
  const { close, setFooter } = useBottomSheet()

  useEffect(() => {
    if (existingCopy) {
      setFooter(
        <button
          onClick={() => { close(); onEditCopy(existingCopy) }}
          className="w-full py-3.5 rounded-xl bg-[#0F0F0F] text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors"
        >
          Edit this copy
        </button>
      )
    } else {
      setFooter(
        <button
          onClick={() => { close(); onNewCopy() }}
          className="w-full py-3.5 rounded-xl bg-[#0F0F0F] text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors"
        >
          Make a copy
        </button>
      )
    }
  }, [])

  if (existingCopy) {
    return (
      <div className="px-5 pb-4 space-y-3">
        <p className="text-sm text-[#444] leading-relaxed">
          You already have a copy of this song in My Songs.
        </p>
        <button
          onClick={() => { close(); onNewCopy() }}
          className="w-full py-3.5 rounded-xl border border-[#E4E2DE] text-sm font-medium text-[#555] hover:bg-[#F0F0EC] transition-colors"
        >
          Make a new copy
        </button>
        <button onClick={close} className="w-full py-2 text-sm text-[#AAA] hover:text-[#555] transition-colors">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="px-5 pb-4 space-y-4">
      <p className="text-sm text-[#444] leading-relaxed">
        A personal copy of this song will be saved to your device. Edit freely, then share back as a new song or as improvements to the original.
      </p>
      <button onClick={close} className="w-full py-2 text-sm text-[#AAA] hover:text-[#555] transition-colors">
        Cancel
      </button>
    </div>
  )
}

export function PlayScreen() {
  const song = useActiveSong()
  const {songs, addSong, setActiveSong} = useSongStore()
  const {playConfig, screen, prevScreen, navigateTo, autoplay, setAutoplay, primaryLang, secondaryLang} = useUIStore()
  const {open: openSheet} = useBottomSheet()

  function forkSong(): Song {
    const forked: Song = {
      ...song!,
      id: nanoid(),
      source: 'local',
      copiedFrom: song!.id,
      createdAt: Date.now(),
    }
    addSong(forked)
    return forked
  }

  function confirmForkAndEdit() {
    if (!song) return
    const existingCopy = songs.find((s) => s.copiedFrom === song.id) ?? null
    openSheet(
      <ForkConfirmSheet
        existingCopy={existingCopy}
        onEditCopy={(copy) => { setActiveSong(copy); navigateTo('edit') }}
        onNewCopy={() => { const f = forkSong(); setActiveSong(f); navigateTo('edit') }}
      />,
      'Edit this song'
    )
  }
  const [focusMode, setFocusMode] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const floatingNotesRef = useRef<FloatingNotesHandle>(null)
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
      setTimeout(() => syncToVideo(), 200)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playConfig.loop])

  const { containerRef, isPlaying, isReady, play, togglePlay, seekTo, getProgress, getTimeInfo } = useYouTubePlayer(videoId, playConfig.loop, handleEnded)
  const progressBarRef = useRef<HTMLDivElement>(null)

  // Refs so wheel/touch handlers always see current values without re-registering
  const speedRef = useRef(0)
  const isPlayingRef = useRef(false)
  const videoIdRef = useRef<string | null>(null)
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const touchStartYRef = useRef(0)
  const touchScrollPosRef = useRef(0)

  // Auto-hide controls — 2s after last action
  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current)
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 2000)
  }, [])

  const revealControls = useCallback(() => {
    setControlsVisible(true)
    scheduleHide()
  }, [scheduleHide])

  const toggleControls = useCallback(() => {
    if (controlsVisible) {
      clearTimeout(hideTimerRef.current)
      setControlsVisible(false)
    } else {
      revealControls()
    }
  }, [controlsVisible, revealControls])

  // Autoplay once player is ready
  useEffect(() => {
    if (autoplay && isReady) {
      play()
      setAutoplay(false)
    }
  }, [autoplay, isReady, play, setAutoplay])

  // Poll video progress for loop countdown
  useEffect(() => {
    if (!videoId) return
    const id = setInterval(() => {
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
  // When video is hidden, YouTube player isn't mounted so isPlaying stays false.
  // Treat hideVideo + scrollSpeed > 0 as "active" so FABs still auto-hide.
  useEffect(() => {
    const shouldFocus = isPlaying || (!!videoId && playConfig.hideVideo && playConfig.scrollSpeed > 0)
    setFocusMode(shouldFocus)
    if (shouldFocus) {
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
  }, [isPlaying, videoId, playConfig.hideVideo, playConfig.scrollSpeed, revealControls])

  // CSS-transition progress bar
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
    void el.offsetHeight
    el.style.transition = `transform ${duration}s linear`
    el.style.transform = `translateY(${-max}px)`
  }

  function pauseAnimation(): number {
    const pos = getScrollPos()
    setScrollImmediate(pos)
    return pos
  }

  function resumeIfActive() {
    if (speedRef.current > 0 && (!videoIdRef.current || isPlayingRef.current || playConfig.hideVideo)) {
      startScrollAnimation(getScrollPos())
    }
  }

  // Wheel — intercept on the overflow:hidden container
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return

    function onWheel(e: WheelEvent) {
      e.preventDefault()
      if (e.deltaY < 0) floatingNotesRef.current?.push(Math.abs(e.deltaY) * 0.5)
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
      if (dy < 0) floatingNotesRef.current?.push(Math.abs(dy) * 0.4)
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

    const treatAsNoVideo = !videoId || playConfig.hideVideo
    if (videoId && !playConfig.hideVideo && isPlaying) {
      syncToVideo()
    } else if (speedRef.current > 0 && treatAsNoVideo) {
      startScrollAnimation(getScrollPos())
    } else {
      pauseAnimation()
      if (videoId && !playConfig.hideVideo) pauseProgressAnimation()
    }
  }, [playConfig.scrollSpeed, playConfig.hideVideo, videoId, isPlaying])

  function syncToVideo() {
    const progress = getProgress()
    const max = getMaxScroll()
    const targetPx = progress * max
    pauseAnimation()
    setScrollImmediate(targetPx)
    pauseProgressAnimation()
    setTimeout(() => {
      if (speedRef.current > 0 && (!videoIdRef.current || isPlayingRef.current || playConfig.hideVideo)) {
        startScrollAnimation(targetPx)
      }
      if (isPlayingRef.current) startProgressAnimation()
    }, 50)
  }

  // Drag-to-seek on progress bar (mobile inline + PiP)
  function handleProgressDrag(e: React.PointerEvent<HTMLDivElement>) {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()

    function seek(clientX: number) {
      const f = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      seekTo(f)
      const bar = progressBarRef.current
      if (bar) {
        bar.style.transition = 'none'
        bar.style.width = `${f * 100}%`
      }
    }

    seek(e.clientX)

    function onMove(ev: PointerEvent) { seek(ev.clientX) }
    function onUp() {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (!song) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-[#888]">No song selected.</p>
        <button onClick={() => navigateTo(prevScreen === 'home' ? 'home' : 'edit')} className="text-sm font-medium text-[#0F0F0F] underline underline-offset-2">
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
      {videoId && !isDesktop && !playConfig.hideVideo && (
        <div className="relative w-full bg-black flex-shrink-0" style={{aspectRatio: '16/9'}} onClick={toggleControls}>
          <div ref={containerRef} className="w-full h-full" style={{pointerEvents: 'none'}}/>
          <img src="/icon.png" alt="" className="absolute bottom-3 right-3 w-7 h-7 rounded-md opacity-60 pointer-events-none" />

          {/* Progress bar — taller touch target for drag-to-seek */}
          <div
            className="absolute bottom-0 left-0 right-0 h-6 flex items-end cursor-pointer"
            onPointerDown={handleProgressDrag}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-full h-1 bg-white/20 pointer-events-none">
              <div ref={progressBarRef} className="h-full bg-white/80" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
      )}

      {/* Scroll area — overflow:hidden, content moves via translateY */}
      <div ref={bodyRef} className="flex-1 overflow-hidden relative">
        {/* Top fade */}
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none" />
        <FloatingNotes ref={floatingNotesRef} />
        <div ref={contentRef} style={{willChange: 'transform'}}>

          <div style={{height: videoId && !isDesktop && !playConfig.hideVideo ? '20vh' : '42vh'}}/>

          <div className="px-6">
            <h2 className="text-3xl font-bold tracking-tight text-[#0F0F0F] leading-tight">{song.title}</h2>
            {showArtist && <p className="text-sm text-[#888] mt-1.5">{song.artist}</p>}
          </div>

          <div className="h-12"/>

          <div className="px-6 pb-40 space-y-8">
            {song.lines.map((line) => {
              const primaryText = line.translations.find((t) => t.lang === primaryLang)?.text
              const secondaryText = secondaryLang
                ? line.translations.find((t) => t.lang === secondaryLang)?.text
                : undefined
              return (
                <div key={line.id}>
                  {playConfig.pinyin && line.pinyin && (
                    <p className="text-xs text-[#888] mb-1 leading-relaxed tracking-wide font-mono">{line.pinyin}</p>
                  )}
                  <p className="text-2xl font-semibold text-[#0F0F0F] leading-tight tracking-tight">{line.chinese}</p>
                  {playConfig.translation && primaryText && (
                    <p className="text-sm italic text-[#555] mt-1.5 leading-relaxed">{primaryText}</p>
                  )}
                  {playConfig.secondLang && secondaryText && (
                    <p className="text-sm text-[#777] mt-1 leading-relaxed">{secondaryText}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {videoId && isDesktop && !playConfig.hideVideo && screen === 'play' && createPortal(
        <DraggablePiP
          containerRef={containerRef}
          progressBarRef={progressBarRef}
          onReveal={revealControls}
          onProgressDrag={handleProgressDrag}
        />,
        document.body
      )}

      {/* Bottom touch/hover zone — focus mode only, reveals controls */}
      {/* Desktop: always show for hover-to-reveal. Mobile: only when no video (youtube tap handles it otherwise) */}
      {focusMode && (isDesktop || !videoId || playConfig.hideVideo) && (
        <div
          className="absolute bottom-0 inset-x-0 h-[100px] z-10"
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
              {isDesktop
                ? 'Hover here to show pause button'
                : videoId && !playConfig.hideVideo
                  ? 'Tap on youtube to show pause button'
                  : 'Tap here to show pause button'}
            </span>
          </div>
        </div>
      )}

      {(() => {
        const shareIcon = (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
        )
        const buttons: ControlButton[] = [
          { icon: <ArrowLeft size={20} />, label: 'Back', position: 'left', onClick: () => navigateTo(prevScreen === 'home' ? 'home' : 'edit'), variant: 'secondary' },
          { icon: shareIcon, label: 'Share', position: 'right', onClick: () => openSheet(<ShareSheet song={song} />, 'Share'), variant: 'secondary' },
          { icon: <PencilSimple size={20} />, label: song?.source === 'repo' ? 'Save' : 'Edit', position: 'right', onClick: song?.source === 'repo' ? confirmForkAndEdit : () => navigateTo('edit'), variant: 'secondary' },
          ...(videoId ? [{ icon: <MusicNote size={20} />, label: 'Config', position: 'right' as const, onClick: () => openSheet(<PlayConfigSheet isPlaying={isPlaying} />, 'Play Config'), variant: 'secondary' as const }] : []),
          ...(videoId && !playConfig.hideVideo ? [{ icon: isPlaying ? <Pause size={22} weight="fill" /> : <Play size={22} weight="fill" />, label: isPlaying ? 'Pause' : 'Play', position: 'right' as const, onClick: togglePlay, variant: 'primary' as const }] : []),
        ]
        return USE_TOOLBAR
          ? <ToolBar buttons={buttons} visible={fabVisible} />
          : <FABBar buttons={buttons} visible={fabVisible} />
      })()}

      {/* Loop countdown toast */}
      {loopCountdown !== null && videoId && (
        <div className="absolute bottom-24 inset-x-0 flex justify-center z-30 pointer-events-none">
          <div className="px-4 py-2 bg-black/70 text-white text-xs rounded-full backdrop-blur-sm tabular-nums">
            Loop in {loopCountdown}s
          </div>
        </div>
      )}
    </div>
  )
}
