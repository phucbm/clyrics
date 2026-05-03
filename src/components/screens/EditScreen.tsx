import { nanoid } from 'nanoid'
import {
  ArrowLeft,
  GitPullRequest,
  Lightning,
  PencilSimple,
  Play,
  Warning,
} from '@phosphor-icons/react'
import { useActiveSong, useSongStore } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { FABBar } from '../shell/FABBar'
import { ToolBar } from '../shell/ToolBar'
import { USE_TOOLBAR, type ControlButton } from '../shell/controls'
import { GenerateConfigSheet } from '../sheets/GenerateConfigSheet'
import { PlayConfigSheet } from '../sheets/PlayConfigSheet'
import { EditSongSheet } from '../sheets/EditSongSheet'
import { ContributeSheet } from '../sheets/ContributeSheet'
import { LineEditSheet } from '../sheets/LineEditSheet'
import type { LyricLine, PlayConfig } from '../../types'

interface LineViewProps {
  line: LyricLine
  onEdit: () => void
  playConfig: PlayConfig
  primaryLang: string
  secondaryLang: string | undefined
}

function LineView({ line, onEdit, playConfig, primaryLang, secondaryLang }: LineViewProps) {
  const primaryText = line.translations.find((t) => t.lang === primaryLang)?.text ?? ''
  const secondaryText = secondaryLang
    ? (line.translations.find((t) => t.lang === secondaryLang)?.text ?? '')
    : ''

  return (
    <button
      onClick={onEdit}
      className="w-full text-left py-4 border-b border-[#E8E8E4] last:border-b-0 hover:bg-[#F0F0EC] px-1 rounded-lg transition-colors"
    >
      {playConfig.pinyin && line.pinyin && (
        <p className="text-xs text-[#888] mb-0.5 font-mono tracking-wide">{line.pinyin}</p>
      )}
      <p className="text-xl font-medium text-[#0F0F0F] leading-snug tracking-tight">
        {line.chinese || <span className="text-[#CCC]">Chinese</span>}
      </p>
      {playConfig.translation && primaryText && (
        <p className="text-sm italic text-[#666] mt-1">{primaryText}</p>
      )}
      {playConfig.secondLang && secondaryText && (
        <p className="text-sm text-[#777] mt-0.5">{secondaryText}</p>
      )}
    </button>
  )
}

export function EditScreen() {
  const song = useActiveSong()
  const { updateSong, setActiveSong } = useSongStore()
  const { navigateTo, playConfig, primaryLang, secondaryLang } = useUIStore()
  const { open } = useBottomSheet()

  function goBack() {
    setActiveSong(null)
    navigateTo('home')
  }

  function saveLine(updated: LyricLine) {
    if (!song) return
    updateSong(song.id, {
      lines: song.lines.map((l) => (l.id === updated.id ? updated : l)),
    })
  }

  function deleteLine(lineId: string) {
    if (!song) return
    updateSong(song.id, { lines: song.lines.filter((l) => l.id !== lineId) })
  }

  function duplicateLine(copy: LyricLine) {
    if (!song) return
    const idx = song.lines.findIndex((l) => l.id === copy.id)
    const insertAfter = idx >= 0 ? idx : song.lines.length - 1
    const newLines = [
      ...song.lines.slice(0, insertAfter + 1),
      { ...copy, id: nanoid() },
      ...song.lines.slice(insertAfter + 1),
    ]
    updateSong(song.id, { lines: newLines })
  }

  function openLineSheet(line: LyricLine) {
    open(
      <LineEditSheet
        line={line}
        primaryLang={primaryLang}
        secondaryLang={secondaryLang}
        onSave={saveLine}
        onDelete={() => deleteLine(line.id)}
        onDuplicate={duplicateLine}
      />,
      'Edit Line'
    )
  }

  function addLine() {
    if (!song) return
    const newLine: LyricLine = {
      id: nanoid(),
      chinese: '',
      pinyin: '',
      translations: [],
    }
    updateSong(song.id, { lines: [...song.lines, newLine] })
    openLineSheet(newLine)
  }

  if (!song) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <Warning size={20} className="text-[#CCC]" />
        <p className="text-sm text-[#888]">No song selected.</p>
        <button
          onClick={() => navigateTo('home')}
          className="text-sm font-medium text-[#0F0F0F] underline underline-offset-2"
        >
          Back to Home
        </button>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col relative">
      <header className="shrink-0 px-5 pt-4 pb-3 border-b border-[#E0E0DC] bg-[#F8F7F5]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-[#0F0F0F] truncate">{song.title}</p>
            {song.artist && song.artist !== 'Unknown' && (
              <p className="text-xs text-[#888] mt-0.5">{song.artist}</p>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {song.lines.length > 0
          && !song.lines.some((l) => l.translations.length > 0) && (
          <div className="flex items-center gap-3 mt-3 mb-1 px-4 py-3 bg-[#F0F0EC] border border-[#E0E0DC] rounded-xl">
            <p className="flex-1 text-xs text-[#666] leading-snug">
              No translations yet. Generate them automatically.
            </p>
            <button
              onClick={() => open(<GenerateConfigSheet />, 'Generate')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F0F0F] text-white text-xs font-semibold rounded-lg shrink-0 hover:bg-[#2a2a2a] transition-colors"
            >
              <Lightning size={11} weight="fill" />
              Generate
            </button>
          </div>
        )}

        {song.lines.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-[#888] mb-3">No lines yet.</p>
            <button
              onClick={addLine}
              className="text-sm font-medium text-[#0F0F0F] underline underline-offset-2"
            >
              Add first line
            </button>
          </div>
        ) : (
          <div>
            {song.lines.map((line) => (
              <LineView
                key={line.id}
                line={line}
                onEdit={() => openLineSheet(line)}
                playConfig={playConfig}
                primaryLang={primaryLang}
                secondaryLang={secondaryLang}
              />
            ))}

            {(() => {
              const langs = [...new Set(song.lines.flatMap((l) => l.translations.map((t) => t.lang)))]
              const updatedAt = song.updatedAt ?? song.createdAt
              const dateStr = new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
              return (
                <div className="mt-6 mb-2 pt-4 border-t border-[#E8E8E4] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-[#AAA]">
                    <span>{song.lines.length} {song.lines.length === 1 ? 'line' : 'lines'}</span>
                    <span>Updated {dateStr}</span>
                  </div>
                  {langs.length > 0 && (
                    <p className="text-xs text-[#AAA]">Languages: {langs.join(', ')}</p>
                  )}
                  {song.authors.length > 0 && (
                    <p className="text-xs text-[#AAA]">Contributors: {song.authors.join(', ')}</p>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {(() => {
        const buttons: ControlButton[] = [
          { icon: <ArrowLeft size={20} />, label: 'Back', position: 'left', onClick: goBack, variant: 'secondary' },
          { icon: <PencilSimple size={20} weight="fill" />, label: 'Edit', position: 'right', onClick: () => open(<EditSongSheet song={song} />, 'Edit Song'), variant: 'secondary' },
          { icon: <Lightning size={20} weight="fill" />, label: 'Generate', position: 'right', onClick: () => open(<GenerateConfigSheet />, 'Generate'), variant: 'secondary' },
          ...(song.source === 'local' ? [{ icon: <GitPullRequest size={20} weight="fill" />, label: 'Contribute', position: 'right' as const, onClick: () => open(<ContributeSheet song={song} />, 'Contribute'), variant: 'secondary' as const }] : []),
          { icon: <Play size={20} weight="fill" />, label: 'Play', position: 'right', onClick: () => open(<PlayConfigSheet />, 'Play'), variant: 'primary' },
        ]
        return USE_TOOLBAR
          ? <ToolBar buttons={buttons} />
          : <FABBar buttons={buttons} />
      })()}
    </div>
  )
}
