import { useState, useRef, useEffect } from 'react'
import { nanoid } from 'nanoid'
import { ArrowCounterClockwise, CopySimple, ArrowsClockwise } from '@phosphor-icons/react'
import { useSongStore } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { LyricsEditorSheet } from './LyricsEditorSheet'
import { generateTitlePinyin, getGroqKey } from '../../lib/groq'
import type { Song } from '../../types'

const RAW_BASE = 'https://raw.githubusercontent.com/phucbm/clyrics/main'

interface Props {
  song: Song
}

export function EditSongSheet({ song }: Props) {
  const { updateSong, deleteSong, addSong, setActiveSong } = useSongStore()
  const { navigateTo } = useUIStore()
  const { open, closeAll, setFooter } = useBottomSheet()

  const [title, setTitle] = useState(song.title)
  const [titlePinyin, setTitlePinyin] = useState(song.titlePinyin ?? '')
  const [generatingPinyin, setGeneratingPinyin] = useState(false)
  const [pinyinError, setPinyinError] = useState<string | null>(null)
  const [artist, setArtist] = useState(song.artist)
  const [youtubeUrl, setYoutubeUrl] = useState(song.youtubeUrl ?? '')
  const [rawLyrics, setRawLyrics] = useState(
    song.lines.map((l) => l.chinese).join('\n')
  )
  const [resetting, setResetting] = useState(false)

  function stripToChineseOnly(text: string): string {
    return text
      .split('\n')
      .map((line) => line.replace(/[^一-鿿㐀-䶿豈-﫿]/g, ''))
      .join('\n')
  }

  function parseDraftLines() {
    const byText = new Map(song.lines.map((l) => [l.chinese, l]))
    return stripToChineseOnly(rawLyrics)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((chinese, i) => {
        const existing = byText.get(chinese)
        return {
          id: existing?.id ?? `${Date.now()}-${i}`,
          chinese,
          pinyin: existing?.pinyin ?? '',
          translations: existing?.translations ?? [],
        }
      })
  }

  function handleSave() {
    updateSong(song.id, {
      title: title.trim() || 'Untitled',
      titlePinyin: titlePinyin.trim() || undefined,
      artist: artist.trim() || '',
      youtubeUrl: youtubeUrl.trim() || undefined,
      lines: parseDraftLines(),
    })
    closeAll()
  }

  async function handleRegenPinyin() {
    const key = getGroqKey()
    if (!key) return
    setGeneratingPinyin(true)
    setPinyinError(null)
    try {
      const result = await generateTitlePinyin(title.trim() || song.title)
      setTitlePinyin(result)
    } catch (e) {
      setPinyinError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setGeneratingPinyin(false)
    }
  }

  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  useEffect(() => {
    setFooter(
      <button
        onClick={() => handleSaveRef.current()}
        className="w-full py-3.5 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors"
      >
        Save
      </button>
    )
  }, [])

  async function handleReset() {
    if (!window.confirm('Reset to the original version from GitHub? All your local edits will be lost.')) return
    setResetting(true)
    try {
      const res = await fetch(`${RAW_BASE}/songs/${song.id}.json`)
      if (!res.ok) throw new Error('Not found')
      const original: Song = await res.json()
      updateSong(song.id, original)
      closeAll()
    } catch {
      window.alert('Could not fetch the original file from GitHub.')
    } finally {
      setResetting(false)
    }
  }

  function handleDuplicate() {
    const copy: Song = {
      ...song,
      id: nanoid(),
      title: `${song.title} (copy)`,
      source: 'local',
      createdAt: Date.now(),
      authors: [],
      lines: song.lines.map((l) => ({ ...l, id: nanoid() })),
    }
    addSong(copy)
    closeAll()
  }

  function handleDelete() {
    if (!window.confirm('Delete this song? This removes it from your local device only.')) return
    deleteSong(song.id)
    setActiveSong(null)
    closeAll()
    navigateTo('home')
  }

  const inputCls =
    'w-full px-3 py-2.5 border border-[#E0E0DC] rounded-xl bg-white text-[#0F0F0F] placeholder-[#AAA] focus:border-[#0F0F0F] transition-colors'

  return (
    <div className="px-5 pb-4 space-y-3">
      {/* Top actions */}
      <div className="flex justify-between items-center -mb-1">
        {song.source === 'repo' ? (
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#0F0F0F] disabled:opacity-40 transition-colors"
          >
            <ArrowCounterClockwise size={13} />
            {resetting ? 'Resetting…' : 'Reset to original'}
          </button>
        ) : <span />}
        <button
          onClick={handleDuplicate}
          className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#0F0F0F] transition-colors"
        >
          <CopySimple size={13} />
          Duplicate song
        </button>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[#888]">Title</label>
        <input className={inputCls} placeholder="Song title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex items-center gap-2">
          <input
            className={`${inputCls} flex-1 text-xs`}
            placeholder="Title pinyin"
            value={titlePinyin}
            onChange={(e) => setTitlePinyin(e.target.value)}
          />
          {getGroqKey() && (
            <button
              onClick={handleRegenPinyin}
              disabled={generatingPinyin}
              className="shrink-0 p-2 rounded-xl border border-[#E0E0DC] text-[#888] hover:text-[#0F0F0F] disabled:opacity-40 transition-colors"
              title="Regenerate pinyin"
            >
              <ArrowsClockwise size={14} className={generatingPinyin ? 'animate-spin' : ''} />
            </button>
          )}
        </div>
        {pinyinError && <p className="text-xs text-red-500">{pinyinError}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[#888]">Artist</label>
        <input className={inputCls} placeholder="Artist name" value={artist} onChange={(e) => setArtist(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[#888]">YouTube URL</label>
        <input className={inputCls} placeholder="https://youtube.com/..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-[#888]">Lyrics (Chinese only — translations preserved)</label>
        <textarea
          className={`${inputCls} resize-none leading-relaxed cursor-pointer`}
          style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", minHeight: '100px' }}
          placeholder="Tap to edit lyrics…"
          value={rawLyrics}
          readOnly
          onClick={() => open(<LyricsEditorSheet initialValue={rawLyrics} onChange={setRawLyrics} />, 'Lyrics')}
        />
      </div>

      <p className="text-xs text-[#AAA] text-center">
        Only Chinese characters are saved — all other text is stripped automatically.
      </p>

      <div className="flex justify-center pt-1 pb-2">
        <button
          onClick={handleDelete}
          className="text-xs text-[#BBB] hover:text-red-500 underline underline-offset-2 transition-colors"
        >
          Delete this song
        </button>
      </div>
    </div>
  )
}
