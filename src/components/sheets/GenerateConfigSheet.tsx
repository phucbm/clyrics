import { useState, useRef, useEffect } from 'react'
import { useActiveSong, useSongStore } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { generateLyrics, getGroqKey } from '../../lib/groq'
import { Translate, Warning, Key, CaretDown } from '@phosphor-icons/react'
import { LoadingNotes, SuccessFall } from './MusicAnimations'

const LANGUAGES = [
  'Vietnamese', 'English', 'Japanese', 'Korean',
  'Chinese (Simplified)', 'Chinese (Traditional)',
  'French', 'German', 'Spanish', 'Portuguese', 'Italian',
  'Russian', 'Ukrainian', 'Polish', 'Czech', 'Romanian', 'Hungarian',
  'Arabic', 'Hebrew', 'Persian', 'Turkish',
  'Hindi', 'Bengali', 'Urdu',
  'Thai', 'Indonesian', 'Malay',
  'Dutch', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek',
  'Swahili', 'Catalan',
]

export function GenerateConfigSheet() {
  const song = useActiveSong()
  const { updateSong } = useSongStore()
  const { generateConfig, setGenerateConfig, setPlayConfig, setLangs } = useUIStore()
  const { close, setFooter } = useBottomSheet()
  const [generating, setGenerating] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  function previewAnim() {
    setGenerating(true)
    setTimeout(() => { setGenerating(false); setDone(true) }, 2500)
    setTimeout(() => setDone(false), 5500)
  }

  const hasKey = !!getGroqKey()
  const lineCount = song?.lines.length ?? 0
  const inputTok = Math.round(lineCount * 10 + 60)
  const outputTok = Math.round(lineCount * 30)

  const selectCls =
    'w-full mt-1 px-3 py-2.5 border border-[#E0E0DC] rounded-xl bg-white text-sm text-[#0F0F0F] focus:border-[#0F0F0F] transition-colors'

  const takenBy2nd = new Set([generateConfig.translateLang, generateConfig.thirdLang].filter(Boolean) as string[])
  const takenBy3rd = new Set([generateConfig.translateLang, generateConfig.secondLang].filter(Boolean) as string[])

  async function handleGenerate() {
    if (!song || !hasKey) return
    setGenerating(true)
    setError(null)
    try {
      const chinese = song.lines.map((l) => l.chinese).join('\n')
      const lines = await generateLyrics(
        chinese,
        generateConfig.translateLang,
        generateConfig.secondLang || undefined,
        song.lines,
        true,
        generateConfig.thirdLang || undefined,
        generateConfig.temperature,
        generateConfig.customPrompt || undefined
      )
      updateSong(song.id, { lines })
      setLangs(generateConfig.translateLang, generateConfig.secondLang || undefined)
      setPlayConfig({ translation: true, secondLang: !!generateConfig.secondLang })
      setGenerating(false)
      setDone(true)
      setTimeout(close, 2500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
      setGenerating(false)
    }
  }

  const handleGenerateRef = useRef(handleGenerate)
  handleGenerateRef.current = handleGenerate

  useEffect(() => {
    if (!hasKey || generating || done) {
      setFooter(null)
      return
    }
    setFooter(
      <button
        onClick={() => handleGenerateRef.current()}
        disabled={!song}
        className="w-full py-4 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white disabled:opacity-40 hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
      >
        <Translate size={16} weight="bold" />
        Generate
      </button>
    )
  }, [generating, done, hasKey, song])

  if (generating) {
    return (
      <div className="px-5 pb-4">
        <LoadingNotes label="Generating lyrics…" sublabel="Asking Groq to translate your song" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="px-5 pb-4">
        <SuccessFall title="Lyrics generated!" subtitle="Translations are ready. Closing…" />
      </div>
    )
  }

  if (!hasKey) {
    return (
      <div className="px-5 pb-8">
        <div className="flex items-start gap-3 p-4 border border-amber-200 bg-amber-50 rounded-xl">
          <Key size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">No Groq API key</p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Add your free key at{' '}
              <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="underline">
                console.groq.com
              </a>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pb-4 space-y-4">
      <div>
        <label className="text-xs font-medium text-[#888]">Primary language</label>
        <select
          value={generateConfig.translateLang}
          onChange={(e) => setGenerateConfig({ translateLang: e.target.value })}
          className={selectCls}
        >
          {LANGUAGES.map((lang) => {
            const taken = lang === generateConfig.secondLang || lang === generateConfig.thirdLang
            return <option key={lang} value={lang} disabled={taken} style={taken ? { color: '#bbb' } : undefined}>{lang}</option>
          })}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-[#888]">2nd language (optional)</label>
        <select
          value={generateConfig.secondLang ?? ''}
          onChange={(e) => setGenerateConfig({ secondLang: e.target.value || undefined, thirdLang: e.target.value ? generateConfig.thirdLang : undefined })}
          className={selectCls}
        >
          <option value="">None</option>
          {LANGUAGES.map((lang) => {
            const taken = takenBy2nd.has(lang)
            return <option key={lang} value={lang} disabled={taken} style={taken ? { color: '#bbb' } : undefined}>{lang}</option>
          })}
        </select>
      </div>

      {generateConfig.secondLang && (
        <div>
          <label className="text-xs font-medium text-[#888]">3rd language (optional)</label>
          <select
            value={generateConfig.thirdLang ?? ''}
            onChange={(e) => setGenerateConfig({ thirdLang: e.target.value || undefined })}
            className={selectCls}
          >
            <option value="">None</option>
            {LANGUAGES.map((lang) => {
              const taken = takenBy3rd.has(lang)
              return <option key={lang} value={lang} disabled={taken} style={taken ? { color: '#bbb' } : undefined}>{lang}</option>
            })}
          </select>
        </div>
      )}

      <div className="border-t border-[#E0E0DC] pt-3 space-y-3">
        <div>
          <p className="text-sm font-medium text-[#0F0F0F] mb-3">Translation style</p>
          <div className="flex rounded-xl overflow-hidden border border-[#E4E2DE]">
            {([
              { label: 'Precise', value: 0.3 },
              { label: 'Balanced', value: 0.5 },
              { label: 'Poetic', value: 0.7 },
            ] as const).map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setGenerateConfig({ temperature: value })}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  generateConfig.temperature === value
                    ? 'bg-[#0F0F0F] text-white'
                    : 'text-[#555] hover:bg-[#F0F0EC]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1 text-xs text-[#999] hover:text-[#555] transition-colors"
        >
          <CaretDown
            size={12}
            className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
          />
          Custom instructions
        </button>

        {showAdvanced && (
          <textarea
            value={generateConfig.customPrompt ?? ''}
            onChange={(e) => setGenerateConfig({ customPrompt: e.target.value || undefined })}
            placeholder={'e.g. 栀子花 → "hoa dành dành". Use southern Vietnamese dialect. Keep rhymes where possible.'}
            rows={3}
            className="w-full px-3 py-2.5 border border-[#E0E0DC] rounded-xl bg-white text-sm text-[#0F0F0F] placeholder-[#CCC] focus:border-[#0F0F0F] transition-colors resize-none focus:outline-none"
          />
        )}

        <p className="text-xs text-[#999]">
          Est. input ~{inputTok} tok / Est. output ~{outputTok} tok
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <Warning size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {import.meta.env.DEV && (
        <button
          onClick={previewAnim}
          className="w-full py-2 text-[11px] text-[#CCC] hover:text-[#888] transition-colors border border-dashed border-[#E0E0DC] rounded-xl"
        >
          preview animation
        </button>
      )}
    </div>
  )
}
