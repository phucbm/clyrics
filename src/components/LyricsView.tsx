import { useState, useRef, useEffect, useCallback } from 'react'
import { useActiveSong, useSongStore } from '../store/useSongStore'
import { extractVideoId } from '../hooks/useYouTube'
import { YoutubeLogo, CaretDown, PencilSimple } from '@phosphor-icons/react'

export function LyricsView() {
  const song = useActiveSong()
  const { setActiveLineIndex, activeLineIndex, setActiveTab } = useSongStore()
  const [videoExpanded, setVideoExpanded] = useState(false)
  const [currentTime] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const videoId = song?.youtubeUrl ? extractVideoId(song.youtubeUrl) : null
  const duration = song?.youtubeDuration ?? 0

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !song) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const progress = scrollTop / (scrollHeight - clientHeight)
    const lineIndex = Math.floor(progress * song.lines.length)
    setActiveLineIndex(Math.min(lineIndex, song.lines.length - 1))
  }, [song, setActiveLineIndex])

  useEffect(() => {
    if (!duration || !containerRef.current) return
    const progress = currentTime / duration
    const { scrollHeight, clientHeight } = containerRef.current
    containerRef.current.scrollTo({ top: progress * (scrollHeight - clientHeight), behavior: 'smooth' })
  }, [currentTime, duration])

  if (!song) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-3 bg-[#F8F7F5]">
        <p className="text-sm text-[#888]">No song selected.</p>
        <button
          onClick={() => setActiveTab('input')}
          className="text-sm text-[#0F0F0F] font-medium underline underline-offset-2"
        >
          Go to Edit
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#F8F7F5]">
      {/* Song header */}
      <header className="px-5 pt-5 pb-4 flex items-start justify-between max-w-2xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#0F0F0F] leading-tight">
            {song.title}
          </h1>
          <p className="text-sm text-[#666] mt-1">{song.artist}</p>
        </div>
        <button
          onClick={() => setActiveTab('input')}
          className="p-2 text-[#888] hover:text-[#0F0F0F] transition-colors mt-1 hover:bg-[#E8E8E4] rounded-lg"
          title="Edit"
        >
          <PencilSimple size={16} />
        </button>
      </header>

      {/* YouTube */}
      {videoId && (
        <div className="border-t border-b border-[#E0E0DC] bg-white max-w-2xl mx-auto w-full">
          <button
            onClick={() => setVideoExpanded((v) => !v)}
            className="w-full flex items-center justify-between px-5 h-11"
          >
            <div className="flex items-center gap-2 text-xs text-[#555] font-medium">
              <YoutubeLogo size={14} weight="fill" className="text-red-500" />
              <span>Watch alongside</span>
            </div>
            <CaretDown
              size={13}
              className={`text-[#888] transition-transform ${videoExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          {videoExpanded && (
            <div className="aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title={song.title}
              />
            </div>
          )}
          {duration > 0 && (
            <div className="h-0.5 bg-[#E0E0DC]">
              <div
                className="h-full bg-[#0F0F0F] transition-all duration-1000"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Lyric lines */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        onScroll={handleScroll}
      >
        <div className="px-5 pt-5 pb-24 space-y-8 max-w-2xl mx-auto w-full">
          {song.lines.map((line, i) => (
            <div
              key={line.id}
              className={`transition-all duration-200 ${
                i === activeLineIndex ? 'opacity-100' : 'opacity-30'
              }`}
            >
              {line.pinyin && (
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
              {line.translation && (
                <p className="text-sm italic text-[#555] mt-1.5 leading-relaxed">
                  {line.translation}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
