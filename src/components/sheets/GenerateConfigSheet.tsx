import { useState } from 'react'
import { useActiveSong, useSongStore } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { ToggleRow } from '../ui/Toggle'
import { generateLyrics, getGroqKey } from '../../lib/groq'
import { Lightning, Warning, Key } from '@phosphor-icons/react'
import type { Lang } from '../../types'

const LANG_LABELS: Record<Lang, string> = { vi: 'Vietnamese', en: 'English', jp: 'Japanese' }

export function GenerateConfigSheet() {
  const song = useActiveSong()
  const { updateSong } = useSongStore()
  const { generateConfig, setGenerateConfig } = useUIStore()
  const { close } = useBottomSheet()
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasKey = !!getGroqKey()
  const hasPinyin = song?.lines.some((l) => l.pinyin) ?? false
  const lineCount = song?.lines.length ?? 0
  // Rough token estimates: ~8 chars/line input, ~30 tokens/line output
  const inputTok = Math.round(lineCount * 10 + 60)
  const outputTok = Math.round(lineCount * 30)

  const selectCls =
    'w-full mt-1 px-3 py-2.5 border border-[#E0E0DC] rounded-xl bg-white text-sm text-[#0F0F0F] focus:border-[#0F0F0F] transition-colors'

  async function handleGenerate() {
    if (!song || !hasKey) return
    setGenerating(true)
    setError(null)
    try {
      const chinese = song.lines.map((l) => l.chinese).join('\n')
      const lines = await generateLyrics(chinese, generateConfig.translateLang)
      updateSong(song.id, { lines, language: generateConfig.translateLang })
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
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
    <div className="px-5 pb-8 space-y-4">
      {/* Translate language */}
      <div>
        <label className="text-xs font-medium text-[#888]">Translate to</label>
        <select
          value={generateConfig.translateLang}
          onChange={(e) => setGenerateConfig({ translateLang: e.target.value as Lang })}
          className={selectCls}
        >
          {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* 2nd language */}
      <div>
        <label className="text-xs font-medium text-[#888]">Bilingual 2nd language</label>
        <select
          value={generateConfig.secondLang ?? ''}
          onChange={(e) =>
            setGenerateConfig({ secondLang: (e.target.value as Lang) || undefined })
          }
          className={selectCls}
        >
          <option value="">None</option>
          {(Object.entries(LANG_LABELS) as [Lang, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Override pinyin */}
      <ToggleRow
        label="Override pinyin"
        sublabel={hasPinyin ? 'Pinyin detected in lyrics' : undefined}
        checked={generateConfig.overridePinyin}
        onChange={(v) => setGenerateConfig({ overridePinyin: v })}
      />

      {/* Token estimate */}
      <div className="border-t border-[#E0E0DC] pt-3">
        <p className="text-xs text-[#999]">
          Est. input ~{inputTok} tok / Est. output ~{outputTok} tok
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <Warning size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating || !song}
        className="w-full py-4 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white disabled:opacity-40 hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
      >
        <Lightning size={16} weight="fill" />
        {generating ? 'Generating…' : 'Generate'}
      </button>
    </div>
  )
}
