import { useEffect, useRef, useState } from 'react'
import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { FAB } from '../shell/FAB'
import { PlayConfigSheet } from '../sheets/PlayConfigSheet'
import { useYouTubePlayer } from '../../hooks/useYouTubePlayer'
import { extractVideoId } from '../../hooks/useYouTube'
import { ArrowLeft, Pause, Play } from '@phosphor-icons/react'

export function PlayScreen() {
  const song = useActiveSong()
  const { playConfig, navigateTo } = useUIStore()
  const { open } = useBottomSheet()
  const [focusMode, setFocusMode] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const videoId = song?.youtubeUrl ? extractVideoId(song.youtubeUrl) : null
  const { containerRef, currentTime, duration, isPlaying } = useYouTubePlayer(videoId)

  // Auto-scroll proportional to video progress
  useEffect(() => {
    if (!playConfig.autoScroll || !bodyRef.current || !duration || !isPlaying) return
    const progress = currentTime / duration
    const el = bodyRef.current
    const maxScroll = el.scrollHeight - el.clientHeight
    el.scrollTo({ top: progress * maxScroll, behavior: 'smooth' })
  }, [currentTime, duration, playConfig.autoScroll, isPlaying])

  // Enter focus mode when playing
  useEffect(() => {
    if (isPlaying) setFocusMode(true)
  }, [isPlaying])

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
          <p className="text-xs text-[#888] mt-0.5">{song.artist}</p>
        </header>
      )}

      {/* Body */}
      <div ref={bodyRef} className="flex-1 overflow-y-auto">
        {/* YouTube player — sticky below header */}
        {videoId && (
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

      {/* FABs — idle mode */}
      {!focusMode && (
        <>
          <div className="absolute bottom-6 left-5 z-20">
            <FAB onClick={() => navigateTo('edit')} variant="secondary" label="Back to Edit">
              <ArrowLeft size={20} />
            </FAB>
          </div>
          <div className="absolute bottom-6 right-5 z-20">
            <FAB onClick={() => open(<PlayConfigSheet />, 'Play')} label="Play config">
              <Play size={22} weight="fill" />
            </FAB>
          </div>
        </>
      )}

      {/* FABs — focus mode: only pause */}
      {focusMode && (
        <div className="absolute bottom-6 right-5 z-20">
          <FAB onClick={() => setFocusMode(false)} label="Exit focus mode">
            <Pause size={22} weight="fill" />
          </FAB>
        </div>
      )}
    </div>
  )
}
