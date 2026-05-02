import { useActiveSong } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { ToggleRow } from '../ui/Toggle'
import { Play } from '@phosphor-icons/react'
// import { CaretLeft, CaretRight, Play } from '@phosphor-icons/react'  // kept for old arrow speed UI

// New simplified speed presets
const SPEED_PRESETS = [
  { value: 0,   label: 'Off'    },
  { value: 0.1, label: 'Slow'   },
  { value: 0.2, label: 'Normal' },
  { value: 0.4, label: 'Fast'   },
]

// Old presets — kept for reference if arrow UI is re-enabled
// const SPEED_PRESETS_OLD = [0, 0.2, 0.5, 0.8, 1, 2, 3]

interface PlayConfigSheetProps {
  isPlaying?: boolean
}

export function PlayConfigSheet({ isPlaying = false }: PlayConfigSheetProps) {
  const { playConfig, setPlayConfig, navigateTo, setAutoplay, primaryLang, secondaryLang, setLangs } = useUIStore()
  const { close } = useBottomSheet()
  const song = useActiveSong()

  const availableLangs = song
    ? [...new Set(song.lines.flatMap((l) => l.translations.map((t) => t.lang)))]
    : []

  function handlePlay() {
    if (!isPlaying) setAutoplay(true)
    close()
    navigateTo('play')
  }

  const activeCount = (playConfig.translation ? 1 : 0) + (playConfig.secondLang ? 1 : 0)

  function isLangActive(lang: string) {
    return (lang === primaryLang && playConfig.translation) || (lang === secondaryLang && playConfig.secondLang)
  }

  function toggleLang(lang: string, on: boolean) {
    if (on) {
      if (!playConfig.translation) {
        setLangs(lang, secondaryLang)
        setPlayConfig({ translation: true })
      } else if (!playConfig.secondLang) {
        setLangs(primaryLang, lang)
        setPlayConfig({ secondLang: true })
      }
    } else {
      if (lang === primaryLang) {
        if (secondaryLang && playConfig.secondLang) {
          setLangs(secondaryLang, undefined)
          setPlayConfig({ translation: true, secondLang: false })
        } else {
          setPlayConfig({ translation: false })
        }
      } else if (lang === secondaryLang) {
        setPlayConfig({ secondLang: false })
      }
    }
  }

  return (
    <div className="px-5 pb-8 space-y-1">
      <ToggleRow
        label="Pinyin"
        checked={playConfig.pinyin}
        onChange={(v) => setPlayConfig({ pinyin: v })}
      />

      {availableLangs.length === 0 && (
        <p className="text-xs text-[#AAA] py-3">No translations yet — generate first</p>
      )}

      {availableLangs.map((lang) => {
        const active = isLangActive(lang)
        const disabled = !active && activeCount >= 2
        return (
          <ToggleRow
            key={lang}
            label={lang}
            checked={active}
            onChange={(v) => toggleLang(lang, v)}
            disabled={disabled}
          />
        )
      })}

      <ToggleRow
        label="Loop"
        checked={playConfig.loop}
        onChange={(v) => setPlayConfig({ loop: v })}
      />

      {/* Auto scroll — segmented button group */}
      <div className="pt-3 pb-1">
        <p className="text-sm font-medium text-[#0F0F0F] mb-3">Auto scroll</p>
        <div className="flex rounded-xl overflow-hidden border border-[#E4E2DE]">
          {SPEED_PRESETS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPlayConfig({ scrollSpeed: value })}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                playConfig.scrollSpeed === value
                  ? 'bg-[#0F0F0F] text-white'
                  : 'text-[#555] hover:bg-[#F0F0EC]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Old arrow-based speed UI — kept for reference, not active
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
            disabled={safeIdx === SPEED_PRESETS_OLD.length - 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#0F0F0F] hover:bg-[#F0F0EC] disabled:opacity-30 transition-colors"
          >
            <CaretRight size={14} weight="bold" />
          </button>
        </div>
      </div>
      */}

      <div className="pt-4">
        <button
          onClick={handlePlay}
          className="w-full py-4 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
        >
          {!isPlaying && <Play size={16} weight="fill" />}
          {isPlaying ? 'Apply' : 'Apply and Play'}
        </button>
      </div>
    </div>
  )
}
