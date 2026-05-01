import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { ToggleRow } from '../ui/Toggle'
import { Play } from '@phosphor-icons/react'

export function PlayConfigSheet() {
  const { playConfig, setPlayConfig, navigateTo, setAutoplay } = useUIStore()
  const { close } = useBottomSheet()
  const song = useActiveSong()
  const hasSecondLang = !!song?.secondLanguage

  function handlePlay() {
    setAutoplay(true)
    close()
    navigateTo('play')
  }

  const speed = playConfig.scrollSpeed

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
          label={`2nd language (${song!.secondLanguage})`}
          checked={playConfig.secondLang}
          onChange={(v) => setPlayConfig({ secondLang: v })}
        />
      )}

      {/* Scroll speed slider */}
      <div className="pt-3 pb-1">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-[#0F0F0F]">Auto scroll</p>
          <span className="text-xs text-[#888] tabular-nums w-12 text-right">
            {speed === 0 ? 'Off' : speed <= 3 ? 'Slow' : speed <= 7 ? 'Normal' : 'Fast'}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={speed}
          onChange={(e) => setPlayConfig({ scrollSpeed: Number(e.target.value) })}
          className="w-full accent-[#0F0F0F]"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[#CCC]">Off</span>
          <span className="text-[10px] text-[#CCC]">Fast</span>
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
