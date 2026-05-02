import { type ReactNode, useState } from 'react'
import { useBottomSheet } from '../shell/BottomSheet'
import { useUIStore } from '../../store/useUIStore'
import { LinkSimple, TextT, Translate, YoutubeLogo } from '@phosphor-icons/react'
import type { Song } from '../../types'

interface ShareSheetProps {
  song: Song
}

type CopyState = Record<string, boolean>

export function ShareSheet({ song }: ShareSheetProps) {
  const { close } = useBottomSheet()
  const { playConfig, primaryLang, secondaryLang } = useUIStore()
  const [copied, setCopied] = useState<CopyState>({})

  function markCopied(key: string) {
    setCopied((s) => ({ ...s, [key]: true }))
    setTimeout(() => setCopied((s) => ({ ...s, [key]: false })), 1800)
  }

  async function copy(key: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      markCopied(key)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      markCopied(key)
    }
  }

  function buildFullText(): string {
    return song.lines
      .map((line) => {
        const parts: string[] = []
        if (playConfig.pinyin && line.pinyin) parts.push(line.pinyin)
        parts.push(line.chinese)
        if (playConfig.translation && primaryLang) {
          const t = line.translations.find((x) => x.lang === primaryLang)?.text
          if (t) parts.push(t)
        }
        if (playConfig.secondLang && secondaryLang) {
          const t = line.translations.find((x) => x.lang === secondaryLang)?.text
          if (t) parts.push(t)
        }
        return parts.join('\n')
      })
      .join('\n\n')
  }

  function buildChineseOnly(): string {
    return song.lines.map((l) => l.chinese).join('\n')
  }

  const shareUrl = window.location.href

  const rows: { key: string; icon: ReactNode; label: string; sublabel?: string; action: () => void; disabled?: boolean }[] = [
    {
      key: 'url',
      icon: <LinkSimple size={20} />,
      label: 'Copy link',
      sublabel: shareUrl,
      action: () => copy('url', shareUrl),
      disabled: song.source !== 'repo',
    },
    {
      key: 'text',
      icon: <Translate size={20} />,
      label: 'Copy as text',
      sublabel: [
        playConfig.pinyin ? 'pinyin' : null,
        'chinese',
        playConfig.translation && primaryLang ? primaryLang : null,
        playConfig.secondLang && secondaryLang ? secondaryLang : null,
      ]
        .filter(Boolean)
        .join(' · '),
      action: () => copy('text', buildFullText()),
    },
    {
      key: 'chinese',
      icon: <TextT size={20} />,
      label: 'Copy Chinese only',
      action: () => copy('chinese', buildChineseOnly()),
    },
    {
      key: 'youtube',
      icon: <YoutubeLogo size={20} />,
      label: 'Open on YouTube',
      sublabel: song.youtubeUrl ?? undefined,
      action: () => { if (song.youtubeUrl) window.open(song.youtubeUrl, '_blank', 'noopener') },
      disabled: !song.youtubeUrl,
    },
  ]

  return (
    <div className="px-5 pb-8 space-y-2">
      {rows.map(({ key, icon, label, sublabel, action, disabled }) => (
        <button
          key={key}
          onClick={() => { if (!disabled) action() }}
          disabled={disabled}
          className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors flex items-center gap-3 ${
            disabled
              ? 'border-[#E4E2DE] opacity-40 cursor-not-allowed'
              : 'border-[#E4E2DE] hover:bg-[#F0F0EC] active:bg-[#E8E8E4]'
          }`}
        >
          <span className="flex-shrink-0 text-[#555]">{icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#0F0F0F]">{label}</p>
            {sublabel && (
              <p className="text-xs text-[#888] mt-0.5 truncate">{sublabel}</p>
            )}
          </div>
          {copied[key] && (
            <span className="text-xs font-medium text-green-600 flex-shrink-0">Copied!</span>
          )}
        </button>
      ))}
      <button onClick={close} className="w-full py-2 text-sm text-[#AAA] hover:text-[#555] transition-colors">
        Cancel
      </button>
    </div>
  )
}
