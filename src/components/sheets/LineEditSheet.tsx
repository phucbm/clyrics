import { useState } from 'react'
import { nanoid } from 'nanoid'
import { CopySimple } from '@phosphor-icons/react'
import { useBottomSheet } from '../shell/BottomSheet'
import type { LyricLine } from '../../types'

interface Props {
  line: LyricLine
  primaryLang: string
  secondaryLang: string | undefined
  onSave: (updated: LyricLine) => void
  onDelete: () => void
  onDuplicate: (copy: LyricLine) => void
}

const cls = 'w-full px-3 py-2.5 border border-[#E0E0DC] rounded-xl bg-white text-sm text-[#0F0F0F] placeholder-[#AAA] focus:border-[#0F0F0F] transition-colors outline-none resize-none leading-relaxed'

export function LineEditSheet({ line, primaryLang, secondaryLang, onSave, onDelete, onDuplicate }: Props) {
  const { close } = useBottomSheet()

  const [chinese, setChinese] = useState(line.chinese)
  const [pinyin, setPinyin] = useState(line.pinyin)
  const [primaryText, setPrimaryText] = useState(
    line.translations.find((t) => t.lang === primaryLang)?.text ?? ''
  )
  const [secondaryText, setSecondaryText] = useState(
    secondaryLang ? (line.translations.find((t) => t.lang === secondaryLang)?.text ?? '') : ''
  )

  function buildUpdated(): LyricLine {
    const other = line.translations.filter((t) => t.lang !== primaryLang && t.lang !== secondaryLang)
    return {
      ...line,
      chinese,
      pinyin,
      translations: [
        ...other,
        ...(primaryText.trim() ? [{ lang: primaryLang, text: primaryText }] : []),
        ...(secondaryLang && secondaryText.trim() ? [{ lang: secondaryLang, text: secondaryText }] : []),
      ],
    }
  }

  function handleSave() {
    onSave(buildUpdated())
    close()
  }

  function handleDuplicate() {
    const updated = buildUpdated()
    onSave(updated)
    onDuplicate({ ...updated, id: nanoid() })
    close()
  }

  function handleDelete() {
    if (!window.confirm('Delete this line? This removes it from your local device only.')) return
    onDelete()
    close()
  }

  return (
    <div className="px-5 pb-8 space-y-3">
      {/* Duplicate button — top right */}
      <div className="flex justify-end -mb-1">
        <button
          onClick={handleDuplicate}
          className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#0F0F0F] transition-colors"
        >
          <CopySimple size={13} />
          Duplicate
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[#888]">Pinyin</label>
        <textarea
          className={`${cls} font-mono text-xs`}
          style={{ minHeight: '52px' }}
          placeholder="pīnyīn"
          value={pinyin}
          onChange={(e) => setPinyin(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[#888]">Chinese</label>
        <textarea
          className={cls}
          style={{ minHeight: '72px' }}
          placeholder="Chinese text"
          value={chinese}
          onChange={(e) => setChinese(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[#888]">{primaryLang}</label>
        <textarea
          className={cls}
          style={{ minHeight: '72px' }}
          placeholder={`${primaryLang} translation`}
          value={primaryText}
          onChange={(e) => setPrimaryText(e.target.value)}
        />
      </div>

      {secondaryLang && (
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#888]">{secondaryLang}</label>
          <textarea
            className={cls}
            style={{ minHeight: '72px' }}
            placeholder={`${secondaryLang} translation`}
            value={secondaryText}
            onChange={(e) => setSecondaryText(e.target.value)}
          />
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full py-3.5 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors"
      >
        Save
      </button>

      <div className="flex justify-center pt-1">
        <button
          onClick={handleDelete}
          className="text-xs text-[#BBB] hover:text-red-500 underline underline-offset-2 transition-colors"
        >
          Delete this line
        </button>
      </div>
    </div>
  )
}
