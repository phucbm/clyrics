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

export function useYouTubePlayer(videoId: string | null, loop = false) {
  // Callback ref — tracks when the container div mounts/unmounts
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null)
  const containerRef = useCallback((el: HTMLDivElement | null) => setContainerEl(el), [])

  const playerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!videoId || !containerEl) return
    let destroyed = false

    function initPlayer() {
      if (destroyed || !containerEl) return
      playerRef.current = new window.YT.Player(containerEl, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: () => { if (!destroyed) setIsReady(true) },
          onStateChange: (e: any) => {
            if (!destroyed) setIsPlaying(e.data === window.YT.PlayerState.PLAYING)
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

  useEffect(() => {
    if (isReady) playerRef.current?.setLoop(loop)
  }, [loop, isReady])

  function play() { playerRef.current?.playVideo() }
  function pause() { playerRef.current?.pauseVideo() }
  function togglePlay() { isPlaying ? pause() : play() }

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

  return { containerRef, isPlaying, isReady, play, pause, togglePlay, getProgress, getTimeInfo }
}
