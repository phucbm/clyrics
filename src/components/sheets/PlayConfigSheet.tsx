import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { ToggleRow } from '../ui/Toggle'
import { CaretLeft, CaretRight, Play } from '@phosphor-icons/react'

const SPEED_PRESETS = [0, 0.2, 0.5, 0.8, 1, 2, 3]

export function PlayConfigSheet() {
  const { playConfig, setPlayConfig, navigateTo, setAutoplay } = useUIStore()
  const { close } = useBottomSheet()
  const song = useActiveSong()
  const hasSecondLang = !!song?.secondLanguage || (song?.lines.some((l) => l.secondTranslation) ?? false)

  function handlePlay() {
    setAutoplay(true)
    close()
    navigateTo('play')
  }

  const speed = playConfig.scrollSpeed
  const idx = SPEED_PRESETS.indexOf(speed)
  const safeIdx = idx >= 0 ? idx : 0

  function decrease() {
    if (safeIdx > 0) setPlayConfig({ scrollSpeed: SPEED_PRESETS[safeIdx - 1] })
  }
  function increase() {
    if (safeIdx < SPEED_PRESETS.length - 1) setPlayConfig({ scrollSpeed: SPEED_PRESETS[safeIdx + 1] })
  }

  const label = speed === 0 ? 'Off' : speed % 1 === 0 ? speed.toString() : speed.toFixed(1)

  return (
    <div className="px-5 pb-8 space-y-1">
      <ToggleRow
        label="Pinyin"
        checked={playConfig.pinyin}
        onChange={(v) => setPlayConfig({ pinyin: v })}
      />
      <ToggleRow
        label={`Translation${song?.language ? ` · ${song.language}` : ''}`}
        checked={playConfig.translation}
        onChange={(v) => setPlayConfig({ translation: v })}
      />
      {hasSecondLang && (
        <ToggleRow
          label={`2nd · ${song!.secondLanguage ?? '2nd language'}`}
          checked={playConfig.secondLang}
          onChange={(v) => setPlayConfig({ secondLang: v })}
        />
      )}

      {/* Scroll speed */}
      <div className="pt-3 pb-1 flex items-center justify-between">
        <p className="text-sm font-medium text-[#0F0F0F]">Auto scroll</p>
        <div className="flex items-center gap-2">
          <button
            onClick={decrease}
            disabled={safeIdx === 0}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0F0F0F] hover:bg-[#F0F0EC] disabled:opacity-30 transition-colors"
          >
            <CaretLeft size={14} weight="bold" />
          </button>
          <span className="text-sm tabular-nums w-8 text-center font-medium">{label}</span>
          <button
            onClick={increase}
            disabled={safeIdx === SPEED_PRESETS.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0F0F0F] hover:bg-[#F0F0EC] disabled:opacity-30 transition-colors"
          >
            <CaretRight size={14} weight="bold" />
          </button>
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
