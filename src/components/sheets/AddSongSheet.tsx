import { useState } from 'react'
import { nanoid } from 'nanoid'
import { useSongStore } from '../../store/useSongStore'
import { useUIStore } from '../../store/useUIStore'
import { useBottomSheet } from '../shell/BottomSheet'
import { generateLyrics, getGroqKey } from '../../lib/groq'
import { Sparkle, Warning } from '@phosphor-icons/react'
import type { Lang, Song } from '../../types'

export function AddSongSheet() {
  const { addSong, setActiveSong } = useSongStore()
  const { navigateTo } = useUIStore()
  const { close } = useBottomSheet()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [rawLyrics, setRawLyrics] = useState('')
  const [lang, setLang] = useState<Lang>('vi')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasKey = !!getGroqKey()

  function buildSong(lines: { id: string; chinese: string; pinyin: string; translation: string }[]): Song {
    return {
      id: nanoid(),
      title: title.trim() || 'Untitled',
      artist: artist.trim() || 'Unknown',
      youtubeUrl: youtubeUrl.trim() || undefined,
      language: lang,
      lines,
      createdAt: Date.now(),
      source: 'local',
    }
  }

  function parseDraftLines() {
    return rawLyrics
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((chinese, i) => ({ id: `${Date.now()}-${i}`, chinese, pinyin: '', translation: '' }))
  }

  function handleSaveDraft() {
    const song = buildSong(parseDraftLines())
    addSong(song)
    setActiveSong(song.id)
    close()
    navigateTo('edit')
  }

  async function handleGenerate() {
    if (!rawLyrics.trim() || !hasKey) return
    setGenerating(true)
    setError(null)
    try {
      const lines = await generateLyrics(rawLyrics.trim(), lang)
      const song = buildSong(lines)
      addSong(song)
      setActiveSong(song.id)
      close()
      navigateTo('edit')
    } catch (e) {
      setError(e instanceof Error && e.message === 'NO_KEY'
        ? 'No Groq API key. Add it in Settings.'
        : (e instanceof Error ? e.message : 'Generation failed'))
    } finally {
      setGenerating(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-[#E0E0DC] rounded-xl bg-white text-sm text-[#0F0F0F] placeholder-[#AAA] focus:border-[#0F0F0F] transition-colors'

  return (
    <div className="px-5 pb-8 space-y-3">
      {/* Title + Artist */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#888]">Title</label>
          <input className={inputCls} placeholder="Song title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#888]">Artist</label>
          <input className={inputCls} placeholder="Artist name" value={artist} onChange={(e) => setArtist(e.target.value)} />
        </div>
      </div>

      {/* YouTube URL + Language */}
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-[#888]">YouTube URL</label>
          <input className={inputCls} placeholder="https://youtube.com/..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#888]">Lang</label>
          <div className="flex border border-[#E0E0DC] rounded-xl overflow-hidden">
            {(['vi', 'en', 'jp'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-2.5 text-xs font-medium transition-colors ${
                  lang === l ? 'bg-[#0F0F0F] text-white' : 'bg-white text-[#888] hover:text-[#0F0F0F]'
                }`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lyrics textarea */}
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

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <Warning size={12} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          onClick={handleSaveDraft}
          disabled={!rawLyrics.trim()}
          className="flex-1 py-3.5 border border-[#E0E0DC] rounded-xl text-sm font-semibold text-[#0F0F0F] disabled:opacity-30 hover:bg-[#F0F0EC] transition-colors"
        >
          Save Draft
        </button>
        {hasKey && (
          <button
            onClick={handleGenerate}
            disabled={generating || !rawLyrics.trim()}
            className="flex-1 py-3.5 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white disabled:opacity-40 hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
          >
            <Sparkle size={14} weight="fill" />
            {generating ? 'Generating…' : 'Generate'}
          </button>
        )}
      </div>
    </div>
  )
}
