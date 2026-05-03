import { useCallback, useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

function loadYTApi(onReady: () => void) {
  if (window.YT?.Player) {
    onReady()
    return
  }
  const prev = window.onYouTubeIframeAPIReady
  window.onYouTubeIframeAPIReady = () => {
    prev?.()
    onReady()
  }
  if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const script = document.createElement('script')
    script.src = 'https://www.youtube.com/iframe_api'
    document.head.appendChild(script)
  }
}

export function useYouTubePlayer(videoId: string | null, loop = false, onEnded?: () => void) {
  // Callback ref — tracks when the container div mounts/unmounts
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const containerRef = useCallback((el: HTMLDivElement | null) => setContainerEl(el), [])

  const playerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const loopRef = useRef(loop)
  const onEndedRef = useRef(onEnded)

  useEffect(() => { loopRef.current = loop }, [loop])
  useEffect(() => { onEndedRef.current = onEnded }, [onEnded])

  useEffect(() => {
    if (!videoId || !containerEl) return
    let destroyed = false

    function initPlayer() {
      if (destroyed || !containerEl) return
      playerRef.current = new window.YT.Player(containerEl, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1, controls: 0, disablekb: 1 },
        events: {
          onReady: () => { if (!destroyed) setIsReady(true) },
          onStateChange: (e: any) => {
            if (destroyed) return
            const state = e.data
            setIsPlaying(state === window.YT.PlayerState.PLAYING)
            if (state === window.YT.PlayerState.ENDED) {
              onEndedRef.current?.()
              if (loopRef.current) {
                playerRef.current?.seekTo(0, true)
                playerRef.current?.playVideo()
              }
            }
          },
        },
      })
    }

    loadYTApi(initPlayer)

    return () => {
      destroyed = true
      setIsReady(false)
      setIsPlaying(false)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId, containerEl])

  function play() { playerRef.current?.playVideo() }
  function pause() { playerRef.current?.pauseVideo() }
  function togglePlay() { isPlaying ? pause() : play() }

  function seekTo(fraction: number) {
    const p = playerRef.current
    if (!p) return
    try {
      const duration = p.getDuration()
      if (duration) p.seekTo(fraction * duration, true)
    } catch {}
  }

  function seekBySeconds(delta: number) {
    const p = playerRef.current
    if (!p) return
    try {
      const duration = p.getDuration()
      const current = p.getCurrentTime()
      if (duration) p.seekTo(Math.max(0, Math.min(duration, current + delta)), true)
    } catch {}
  }

  function getProgress(): number {
    const p = playerRef.current
    if (!p) return 0
    try {
      const duration = p.getDuration()
      if (!duration) return 0
      return p.getCurrentTime() / duration
    } catch { return 0 }
  }

  function getTimeInfo(): { currentTime: number; duration: number } {
    const p = playerRef.current
    if (!p) return { currentTime: 0, duration: 0 }
    try { return { currentTime: p.getCurrentTime(), duration: p.getDuration() } } catch { return { currentTime: 0, duration: 0 } }
  }

  return { containerRef, isPlaying, isReady, play, pause, togglePlay, seekTo, seekBySeconds, getProgress, getTimeInfo }
}
