import { useState } from 'react'
import { useSongStore } from '../../store/useSongStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { generateLyrics, getGroqKey } from '../../lib/groq'
import { Sparkle, Warning } from '@phosphor-icons/react'
import type { Song } from '../../types'

interface Props {
  song: Song
}

export function EditSongSheet({ song }: Props) {
  const { updateSong } = useSongStore()
  const { close } = useBottomSheet()

  const [title, setTitle] = useState(song.title)
  const [artist, setArtist] = useState(song.artist)
  const [youtubeUrl, setYoutubeUrl] = useState(song.youtubeUrl ?? '')
  const [rawLyrics, setRawLyrics] = useState(
    song.lines.map((l) => l.chinese).join('\n')
  )
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasKey = !!getGroqKey()

  function parseDraftLines() {
    return rawLyrics
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((chinese, i) => ({
        id: song.lines[i]?.id ?? `${Date.now()}-${i}`,
        chinese,
        pinyin: song.lines[i]?.pinyin ?? '',
        translation: song.lines[i]?.translation ?? '',
      }))
  }

  function handleSave() {
    updateSong(song.id, {
      title: title.trim() || 'Untitled',
      artist: artist.trim() || '',
      youtubeUrl: youtubeUrl.trim() || undefined,
      lines: parseDraftLines(),
    })
    close()
  }

  async function handleGenerate() {
    if (!rawLyrics.trim() || !hasKey) return
    setGenerating(true)
    setError(null)
    try {
      const lines = await generateLyrics(rawLyrics.trim(), song.language)
      updateSong(song.id, {
        title: title.trim() || 'Untitled',
        artist: artist.trim() || '',
        youtubeUrl: youtubeUrl.trim() || undefined,
        lines,
      })
      close()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
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
          placeholder="One Chinese line per row"
          value={rawLyrics}
          onChange={(e) => setRawLyrics(e.target.value)}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <Warning size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSave}
          className="flex-1 py-3.5 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors"
        >
          Save
        </button>
        {hasKey && (
          <button
            onClick={handleGenerate}
            disabled={generating || !rawLyrics.trim()}
            className="flex-1 py-3.5 border border-[#E0E0DC] rounded-xl text-sm font-semibold text-[#0F0F0F] disabled:opacity-40 hover:bg-[#F0F0EC] transition-colors flex items-center justify-center gap-2"
          >
            <Sparkle size={14} weight="fill" />
            {generating ? 'Generating…' : 'Generate'}
          </button>
        )}
      </div>
    </div>
  )
}
