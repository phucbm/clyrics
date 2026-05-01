import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useSongStore } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { Warning } from '@phosphor-icons/react'
import type { Song } from '../../types'

export function AddSongSheet() {
  const { addSong, setActiveSong } = useSongStore()
  const { navigateTo } = useUIStore()
  const { close } = useBottomSheet()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [rawLyrics, setRawLyrics] = useState('')
  const [error, setError] = useState<string | null>(null)

  function stripToChineseOnly(text: string): string {
    return text
      .split('\n')
      .map((line) => line.replace(/[^一-鿿㐀-䶿豈-﫿]/g, ''))
      .join('\n')
  }

  function handleSave() {
    if (!rawLyrics.trim()) { setError('Add some lyrics first.'); return }
    const lines = stripToChineseOnly(rawLyrics)
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((chinese, i) => ({ id: `${Date.now()}-${i}`, order: i, chinese, pinyin: '', translations: [] }))

    const song: Song = {
      id: nanoid(),
      title: title.trim() || 'Untitled',
      artist: artist.trim() || '',
      youtubeUrl: youtubeUrl.trim() || undefined,
      authors: [],
      lines,
      createdAt: Date.now(),
      source: 'local',
    }
    addSong(song)
    setActiveSong(song.id)
    close()
    navigateTo('edit')
  }

  const inputCls =
    'w-full px-3 py-2.5 border border-[#E0E0DC] rounded-xl bg-white text-sm text-[#0F0F0F] placeholder-[#AAA] focus:border-[#0F0F0F] transition-colors'

  return (
    <div className="px-5 pb-8 space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-[#888]">Title</label>
        <input className={inputCls} placeholder="Song title" value={title} onChange={(e) => setTitle(e.target.value)} />
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
        <label className="text-xs font-medium text-[#888]">Lyrics</label>
        <textarea
          className={`${inputCls} resize-none leading-relaxed`}
          style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", minHeight: '160px' }}
          placeholder="Paste Chinese lyrics here, one line per row"
          value={rawLyrics}
          onChange={(e) => setRawLyrics(e.target.value)}
        />
      </div>

      <p className="text-xs text-[#AAA] text-center">
        Only Chinese characters are saved — all other text is stripped automatically.
      </p>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <Warning size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full py-3.5 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors"
      >
        Save
      </button>
    </div>
  )
}
