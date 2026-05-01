import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { ToggleRow } from '../ui/Toggle'
import { CaretLeft, CaretRight, Play } from '@phosphor-icons/react'

const SPEED_PRESETS = [0, 0.2, 0.5, 0.8, 1, 2, 3]

export function PlayConfigSheet() {
  const { playConfig, setPlayConfig, navigateTo, setAutoplay, primaryLang, secondaryLang, setLangs } = useUIStore()
  const { close } = useBottomSheet()
  const song = useActiveSong()

  // Available langs derived from song translations
  const availableLangs = song
    ? [...new Set(song.lines.flatMap((l) => l.translations.map((t) => t.lang)))]
    : []

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
  const selectCls = 'flex-1 px-2 py-1.5 border border-[#E0E0DC] rounded-lg bg-white text-xs text-[#0F0F0F] focus:border-[#0F0F0F] transition-colors'

  return (
    <div className="px-5 pb-8 space-y-1">
      <ToggleRow
        label="Pinyin"
        checked={playConfig.pinyin}
        onChange={(v) => setPlayConfig({ pinyin: v })}
      />

      {/* Primary lang */}
      <div className="flex items-center justify-between py-3 border-b border-[#F0F0EC]">
        <div>
          <p className="text-sm font-medium text-[#0F0F0F]">Translation</p>
          {availableLangs.length === 0 && (
            <p className="text-xs text-[#AAA] mt-0.5">No translations yet — generate first</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {availableLangs.length > 0 && (
            <select
              value={primaryLang}
              onChange={(e) => setLangs(e.target.value, secondaryLang)}
              className={selectCls}
            >
              {availableLangs.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          )}
          <div className="shrink-0">
            <ToggleRow
              label=""
              checked={playConfig.translation}
              onChange={(v) => setPlayConfig({ translation: v })}
            />
          </div>
        </div>
      </div>

      {/* Secondary lang */}
      <div className="flex items-center justify-between py-3 border-b border-[#F0F0EC]">
        <p className="text-sm font-medium text-[#0F0F0F]">2nd language</p>
        <div className="flex items-center gap-2">
          {availableLangs.length > 0 && (
            <select
              value={secondaryLang ?? ''}
              onChange={(e) => setLangs(primaryLang, e.target.value || undefined)}
              className={selectCls}
            >
              <option value="">None</option>
              {availableLangs.filter((l) => l !== primaryLang).map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          )}
          <div className="shrink-0">
            <ToggleRow
              label=""
              checked={playConfig.secondLang}
              onChange={(v) => setPlayConfig({ secondLang: v })}
            />
          </div>
        </div>
      </div>

      <ToggleRow
        label="Loop"
        checked={playConfig.loop}
        onChange={(v) => setPlayConfig({ loop: v })}
      />

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
