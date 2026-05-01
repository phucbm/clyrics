import { useEffect, useRef, useState } from 'react'

declare global {
  interface Window {
    YT: any
    onYouTubeIframeAPIReady: (() => void) | undefined
  }
}

export function useYouTubePlayer(videoId: string | null) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!videoId) return
    let destroyed = false

    function initPlayer() {
      if (destroyed || !containerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { rel: 0, modestbranding: 1 },
        events: {
          onReady: (e: any) => {
            if (!destroyed) {
              setDuration(e.target.getDuration())
              setIsReady(true)
            }
          },
          onStateChange: (e: any) => {
            if (!destroyed) setIsPlaying(e.data === window.YT.PlayerState.PLAYING)
          },
        },
      })
    }

    if (window.YT?.Player) {
      initPlayer()
    } else {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        initPlayer()
      }
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(script)
      }
    }

    return () => {
      destroyed = true
      setIsReady(false)
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [videoId])

  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      const t = playerRef.current?.getCurrentTime?.()
      if (t != null) setCurrentTime(t)
      const d = playerRef.current?.getDuration?.()
      if (d != null && d !== duration) setDuration(d)
    }, 500)
    return () => clearInterval(interval)
  }, [isPlaying, duration])

  function play() { playerRef.current?.playVideo() }
  function pause() { playerRef.current?.pauseVideo() }
  function togglePlay() {
    if (isPlaying) pause()
    else play()
  }

  return { containerRef, currentTime, duration, isPlaying, isReady, play, pause, togglePlay }
}
