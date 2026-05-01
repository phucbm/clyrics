import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { ToggleRow } from '../ui/Toggle'
import { Play } from '@phosphor-icons/react'

export function PlayConfigSheet() {
  const { playConfig, setPlayConfig, navigateTo } = useUIStore()
  const { close } = useBottomSheet()
  const song = useActiveSong()

  function handlePlay() {
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
      <ToggleRow
        label="Auto scroll"
        sublabel="Syncs scroll to video duration"
        checked={playConfig.autoScroll}
        onChange={(v) => setPlayConfig({ autoScroll: v })}
      />

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
