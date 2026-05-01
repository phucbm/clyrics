import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { ToggleRow } from '../ui/Toggle'
import { Play } from '@phosphor-icons/react'
import type { ScrollSpeed } from '../../types'

const SPEEDS: { value: ScrollSpeed; label: string }[] = [
  { value: 'off', label: 'Off' },
  { value: 'slow', label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'fast', label: 'Fast' },
]

export function PlayConfigSheet() {
  const { playConfig, setPlayConfig, navigateTo, setAutoplay } = useUIStore()
  const { close } = useBottomSheet()
  const song = useActiveSong()

  function handlePlay() {
    setAutoplay(true)
    close()
    navigateTo('play')
  }

  const hasSecondLang = !!song?.secondLanguage

  return (
    <div className="px-5 pb-8 space-y-1">
      <ToggleRow
        label="Pinyin"
        checked={playConfig.pinyin}
        onChange={(v) => setPlayConfig({ pinyin: v })}
      />
      <ToggleRow
        label="Translation"
        checked={playConfig.translation}
        onChange={(v) => setPlayConfig({ translation: v })}
      />
      {hasSecondLang && (
        <ToggleRow
          label={`2nd language (${song!.secondLanguage!.toUpperCase()})`}
          checked={playConfig.secondLang}
          onChange={(v) => setPlayConfig({ secondLang: v })}
        />
      )}

      {/* Scroll speed */}
      <div className="pt-2 pb-1">
        <p className="text-sm font-medium text-[#0F0F0F] mb-2">Auto scroll</p>
        <div className="flex gap-2">
          {SPEEDS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPlayConfig({ scrollSpeed: value })}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                playConfig.scrollSpeed === value
                  ? 'bg-[#0F0F0F] text-white border-[#0F0F0F]'
                  : 'bg-white text-[#888] border-[#E0E0DC] hover:text-[#0F0F0F]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handlePlay}
          className="w-full py-4 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
        >
          <Play size={16} weight="fill" />
          Play
        </button>
      </div>
    </div>
  )
}
