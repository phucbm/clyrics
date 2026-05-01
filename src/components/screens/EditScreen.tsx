import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useActiveSong, useSongStore } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { FAB } from '../shell/FAB'
import { GenerateConfigSheet } from '../sheets/GenerateConfigSheet'
import { PlayConfigSheet } from '../sheets/PlayConfigSheet'
import { EditSongSheet } from '../sheets/EditSongSheet'
import { ArrowLeft, Lightning, Note, Play, Plus, Trash, Warning } from '@phosphor-icons/react'
import type { LyricLine } from '../../types'

interface LineViewProps {
  line: LyricLine
  isEditing: boolean
  onEdit: () => void
  onUpdate: (field: keyof LyricLine, value: string) => void
  onDelete: () => void
}

function LineView({ line, isEditing, onEdit, onUpdate, onDelete }: LineViewProps) {
  if (isEditing) {
    return (
      <div className="py-4 border-b border-[#E8E8E4] space-y-2 last:border-b-0">
        <input
          className="w-full text-xs text-[#888] bg-[#F0F0EC] rounded-lg px-3 py-2 placeholder-[#BBB] font-mono"
          placeholder="pinyin"
          value={line.pinyin}
          onChange={(e) => onUpdate('pinyin', e.target.value)}
          autoFocus
        />
        <input
          className="w-full text-xl font-medium text-[#0F0F0F] bg-[#F0F0EC] rounded-lg px-3 py-2 placeholder-[#CCC] tracking-tight"
          placeholder="Chinese"
          value={line.chinese}
          onChange={(e) => onUpdate('chinese', e.target.value)}
        />
        <input
          className="w-full text-sm text-[#555] bg-[#F0F0EC] rounded-lg px-3 py-2 placeholder-[#BBB] italic"
          placeholder="translation"
          value={line.translation}
          onChange={(e) => onUpdate('translation', e.target.value)}
        />
        <div className="flex justify-end">
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-xs text-[#999] hover:text-red-500 transition-colors px-2 py-1 rounded-md hover:bg-red-50"
          >
            <Trash size={11} />
            Delete line
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onEdit}
      className="w-full text-left py-4 border-b border-[#E8E8E4] last:border-b-0 hover:bg-[#F0F0EC] -mx-1 px-1 rounded-lg transition-colors"
    >
      {line.pinyin && (
        <p className="text-xs text-[#888] mb-0.5 font-mono tracking-wide">{line.pinyin}</p>
      )}
      <p className="text-xl font-medium text-[#0F0F0F] leading-snug tracking-tight">
        {line.chinese || <span className="text-[#CCC]">Chinese</span>}
      </p>
      {line.translation && (
        <p className="text-sm italic text-[#666] mt-1">{line.translation}</p>
      )}
    </button>
  )
}

export function EditScreen() {
  const song = useActiveSong()
  const { updateSong, deleteSong, setActiveSong } = useSongStore()
  const { navigateTo } = useUIStore()
  const { open } = useBottomSheet()
  const [editingLineId, setEditingLineId] = useState<string | null>(null)

  function goBack() {
    setActiveSong(null)
    navigateTo('home')
  }

  function updateLine(lineId: string, field: keyof LyricLine, value: string) {
    if (!song) return
    updateSong(song.id, {
      lines: song.lines.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)),
    })
  }

  function deleteLine(lineId: string) {
    if (!song) return
    updateSong(song.id, { lines: song.lines.filter((l) => l.id !== lineId) })
    if (editingLineId === lineId) setEditingLineId(null)
  }

  function addLine() {
    if (!song) return
    const newLine: LyricLine = { id: nanoid(), chinese: '', pinyin: '', translation: '' }
    updateSong(song.id, { lines: [...song.lines, newLine] })
    setEditingLineId(newLine.id)
  }

  function handleDelete() {
    if (!song) return
    deleteSong(song.id)
    setActiveSong(null)
    navigateTo('home')
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
      {/* Header — song title + artist (display only) */}
      <header className="shrink-0 px-5 pt-4 pb-3 border-b border-[#E0E0DC] bg-[#F8F7F5]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-[#0F0F0F] truncate">{song.title}</p>
            {song.artist && song.artist !== 'Unknown' && (
              <p className="text-xs text-[#888] mt-0.5">{song.artist}</p>
            )}
          </div>
          <button
            onClick={handleDelete}
            className="p-1.5 text-[#CCC] hover:text-red-500 transition-colors rounded-lg hover:bg-red-50 mt-0.5 shrink-0"
            aria-label="Delete song"
          >
            <Trash size={14} />
          </button>
        </div>
      </header>

      {/* Body */}
      <div
        className="flex-1 overflow-y-auto px-5 pb-32"
        onClick={(e) => {
          if (e.target === e.currentTarget) setEditingLineId(null)
        }}
      >
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
                isEditing={editingLineId === line.id}
                onEdit={() => setEditingLineId(line.id)}
                onUpdate={(field, value) => updateLine(line.id, field, value)}
                onDelete={() => deleteLine(line.id)}
              />
            ))}
            <button
              onClick={addLine}
              className="flex items-center gap-2 mt-4 mb-6 text-sm text-[#888] hover:text-[#0F0F0F] transition-colors"
            >
              <Plus size={14} />
              Add line
            </button>
          </div>
        )}
      </div>

      {/* FABs — left: back | right (bottom→top): Edit (primary), Generate, Play */}
      <div className="absolute bottom-6 left-5 z-20">
        <FAB onClick={goBack} variant="secondary" label="Back to Home">
          <ArrowLeft size={20} />
        </FAB>
      </div>
      <div className="absolute bottom-6 right-5 z-20 flex flex-col-reverse gap-3">
        {/* Primary (bottom): Edit */}
        <FAB onClick={() => open(<EditSongSheet song={song} />, 'Edit Song')} label="Edit song">
          <Note size={20} weight="fill" />
        </FAB>
        {/* Generate */}
        <FAB onClick={() => open(<GenerateConfigSheet />, 'Generate')} variant="secondary" label="Generate lyrics">
          <Lightning size={20} weight="fill" />
        </FAB>
        {/* Play (top) */}
        <FAB onClick={() => open(<PlayConfigSheet />, 'Play')} variant="secondary" label="Play">
          <Play size={20} weight="fill" />
        </FAB>
      </div>
    </div>
  )
}
