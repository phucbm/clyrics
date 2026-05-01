import { useState, useRef } from 'react'
import { nanoid } from 'nanoid'
import { useSongStore, useActiveSong } from '../store/useSongStore'
import { useYouTube } from '../hooks/useYouTube'
import { generateLyrics, getGroqKey } from '../lib/groq'
import type { Song, LyricLine } from '../types'
import {
  Plus, Trash, ArrowRight, GitPullRequest, Sparkle, ArrowLeft, Key, Warning,
} from '@phosphor-icons/react'

interface Props {
  onOpenSettings: () => void
}

export function InputView({ onOpenSettings }: Props) {
  const { songs, addSong, updateSong, deleteSong, setActiveSong, activeSongId, githubSettings, setActiveTab } =
    useSongStore()
  const activeSong = useActiveSong()
  const { fetchInfo } = useYouTube()

  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [rawLyrics, setRawLyrics] = useState('')
  const [language, setLanguage] = useState<'vi' | 'en'>('vi')

  const [generating, setGenerating] = useState(false)
  const [generatingSong, setGeneratingSong] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contributing, setContributing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const hasKey = !!getGroqKey()
  const usingEnvKey = !!import.meta.env.VITE_GROQ_API_KEY
  const isEditing = !!activeSong

  function resetCreate() {
    setTitle('')
    setArtist('')
    setYoutubeUrl('')
    setRawLyrics('')
    setError(null)
  }

  function handleCreate() {
    const lines = rawLyrics
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((chinese, i) => ({ id: `${Date.now()}-${i}`, chinese, pinyin: '', translation: '' }))

    const song: Song = {
      id: nanoid(),
      title: title || 'Untitled',
      artist: artist || 'Unknown',
      youtubeUrl: youtubeUrl || undefined,
      language,
      lines,
      createdAt: Date.now(),
    }
    addSong(song)
    setActiveSong(song.id)
    resetCreate()
  }

  async function handleGenerate() {
    if (!rawLyrics.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const lines = await generateLyrics(rawLyrics.trim(), language)

      let ytDuration: number | undefined
      if (youtubeUrl) {
        const info = await fetchInfo(youtubeUrl)
        ytDuration = info?.duration
      }

      const song: Song = {
        id: nanoid(),
        title: title || 'Untitled',
        artist: artist || 'Unknown',
        youtubeUrl: youtubeUrl || undefined,
        youtubeDuration: ytDuration,
        language,
        lines,
        createdAt: Date.now(),
      }
      addSong(song)
      setActiveSong(song.id)
      resetCreate()
    } catch (e) {
      if (e instanceof Error && e.message === 'NO_KEY') {
        setError('No API key. Add your Groq key in Settings.')
      } else {
        setError(e instanceof Error ? e.message : 'Generation failed')
      }
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateSong() {
    if (!activeSong || !hasKey) return
    setGeneratingSong(true)
    setError(null)
    try {
      const chinese = activeSong.lines.map((l) => l.chinese).join('\n')
      const lines = await generateLyrics(chinese, activeSong.language)
      updateSong(activeSong.id, { lines })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGeneratingSong(false)
    }
  }

  async function handleContribute() {
    if (!activeSong || !githubSettings) return
    setContributing(true)
    try {
      const { contributeSong } = await import('../lib/github')
      const prUrl = await contributeSong(activeSong, githubSettings)
      window.open(prUrl, '_blank')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Contribute failed')
    } finally {
      setContributing(false)
    }
  }

  function updateLine(lineId: string, field: keyof LyricLine, value: string) {
    if (!activeSong) return
    updateSong(activeSong.id, {
      lines: activeSong.lines.map((l) => (l.id === lineId ? { ...l, [field]: value } : l)),
    })
  }

  function updateSongMeta(field: 'title' | 'artist' | 'youtubeUrl', value: string) {
    if (!activeSong) return
    updateSong(activeSong.id, { [field]: value || undefined })
  }

  function addLine() {
    if (!activeSong) return
    const newLine: LyricLine = { id: nanoid(), chinese: '', pinyin: '', translation: '' }
    updateSong(activeSong.id, { lines: [...activeSong.lines, newLine] })
  }

  function deleteLine(lineId: string) {
    if (!activeSong) return
    updateSong(activeSong.id, { lines: activeSong.lines.filter((l) => l.id !== lineId) })
  }

  // ── Edit mode ─────────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <div className="min-h-[100dvh] flex flex-col pb-16 max-w-2xl mx-auto w-full">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[#F8F7F5]/95 backdrop-blur-sm border-b border-[#E0E0DC]">
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={() => setActiveSong(null)}
              className="flex items-center gap-1.5 text-sm text-[#555] hover:text-[#0F0F0F] transition-colors shrink-0 font-medium"
            >
              <ArrowLeft size={14} />
              <span>Songs</span>
            </button>

            <div className="flex-1 min-w-0">
              <input
                className="w-full text-base font-semibold text-[#0F0F0F] bg-transparent tracking-tight leading-tight truncate placeholder-[#999]"
                value={activeSong.title}
                onChange={(e) => updateSongMeta('title', e.target.value)}
                placeholder="Untitled"
              />
              <input
                className="w-full text-xs text-[#666] bg-transparent leading-tight placeholder-[#999]"
                value={activeSong.artist}
                onChange={(e) => updateSongMeta('artist', e.target.value)}
                placeholder="Artist"
              />
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {hasKey && (
                <button
                  onClick={handleGenerateSong}
                  disabled={generatingSong}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#555] hover:text-[#0F0F0F] hover:bg-[#E8E8E4] rounded-md transition-all disabled:opacity-40 font-medium"
                >
                  <Sparkle size={13} weight="fill" />
                  <span>{generatingSong ? '…' : 'Gen'}</span>
                </button>
              )}
              <button
                onClick={() => setActiveTab('lyrics')}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#555] hover:text-[#0F0F0F] hover:bg-[#E8E8E4] rounded-md transition-all font-medium"
              >
                <span>Read</span>
                <ArrowRight size={13} />
              </button>
              {githubSettings && (
                <button
                  onClick={handleContribute}
                  disabled={contributing}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#555] hover:text-[#0F0F0F] hover:bg-[#E8E8E4] rounded-md transition-all disabled:opacity-40"
                >
                  <GitPullRequest size={13} />
                </button>
              )}
              <button
                onClick={() => { deleteSong(activeSong.id); setActiveSong(null) }}
                className="flex items-center px-2 py-1.5 text-xs text-[#999] hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
              >
                <Trash size={13} />
              </button>
            </div>
          </div>

          {/* YouTube + language */}
          <div className="px-4 pb-2.5 flex items-center gap-2 border-t border-[#E0E0DC]">
            <input
              className="flex-1 text-xs text-[#666] bg-transparent placeholder-[#AAA] py-1.5"
              placeholder="YouTube URL (optional)"
              value={activeSong.youtubeUrl ?? ''}
              onChange={(e) => updateSongMeta('youtubeUrl', e.target.value)}
            />
            <div className="flex gap-1 shrink-0">
              {(['vi', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => updateSong(activeSong.id, { language: l })}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    activeSong.language === l
                      ? 'bg-[#0F0F0F] text-white'
                      : 'text-[#888] hover:text-[#0F0F0F] hover:bg-[#E8E8E4]'
                  }`}
                >
                  {l === 'vi' ? 'VI' : 'EN'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Error */}
        {error && (
          <div className="mx-4 mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <Warning size={12} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Lyric editor */}
        <main className="flex-1 px-4 pt-1">
          {activeSong.lines.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[#999]">No lines yet.</p>
              <button
                onClick={addLine}
                className="mt-3 text-sm text-[#555] hover:text-[#0F0F0F] transition-colors underline underline-offset-2"
              >
                Add first line
              </button>
            </div>
          ) : (
            <div>
              {activeSong.lines.map((line) => (
                <div
                  key={line.id}
                  className="group py-3.5 border-b border-[#E8E8E4] last:border-b-0 relative pr-7"
                >
                  <input
                    className="w-full text-xs text-[#888] bg-transparent placeholder-[#BBB] leading-relaxed"
                    style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", letterSpacing: '0.04em' }}
                    placeholder="pinyin"
                    value={line.pinyin}
                    onChange={(e) => updateLine(line.id, 'pinyin', e.target.value)}
                  />
                  <input
                    className="w-full text-xl font-medium text-[#0F0F0F] bg-transparent placeholder-[#BBB] leading-snug tracking-tight"
                    placeholder="Chinese"
                    value={line.chinese}
                    onChange={(e) => updateLine(line.id, 'chinese', e.target.value)}
                  />
                  <input
                    className="w-full text-sm text-[#666] bg-transparent placeholder-[#BBB] italic leading-relaxed"
                    placeholder="translation"
                    value={line.translation}
                    onChange={(e) => updateLine(line.id, 'translation', e.target.value)}
                  />

                  <button
                    onClick={() => deleteLine(line.id)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 text-[#BBB] hover:text-red-500 transition-all"
                  >
                    <Trash size={12} />
                  </button>
                </div>
              ))}

              <button
                onClick={addLine}
                className="flex items-center gap-2 mt-4 mb-8 text-sm text-[#888] hover:text-[#0F0F0F] transition-colors"
              >
                <Plus size={14} />
                Add line
              </button>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── Create / List mode ────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] flex flex-col pb-16 max-w-2xl mx-auto w-full">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 pt-5 pb-4">
        <h1 className="text-xl font-semibold tracking-tight text-[#0F0F0F]">C-Lyrics</h1>
        <button
          onClick={onOpenSettings}
          className="text-sm text-[#555] hover:text-[#0F0F0F] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#E8E8E4] font-medium"
        >
          Settings
        </button>
      </header>

      {/* Key warning */}
      {!hasKey && (
        <div className="mx-4 mb-4 flex items-start gap-2.5 p-3 border border-amber-300 bg-amber-50 rounded-xl">
          <Key size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-900">Author's key unavailable</p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              Add your free key from{' '}
              <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="underline font-medium">
                console.groq.com
              </a>{' '}
              in Settings.
            </p>
          </div>
          <button
            onClick={onOpenSettings}
            className="text-xs text-amber-800 font-semibold border border-amber-300 rounded-lg px-2.5 py-1 hover:bg-amber-100 transition-colors shrink-0"
          >
            Open
          </button>
        </div>
      )}

      {hasKey && usingEnvKey && (
        <p className="px-4 mb-2 text-xs text-[#888]">
          Author's key · shared limit · may be removed anytime
        </p>
      )}

      {/* Create form */}
      <div className="px-4 mb-6">
        <div className="bg-white border border-[#E0E0DC] rounded-xl overflow-hidden shadow-sm">
          <div className="flex border-b border-[#E0E0DC]">
            <input
              className="flex-1 px-4 py-3 text-sm font-semibold text-[#0F0F0F] placeholder-[#AAA] bg-transparent border-r border-[#E0E0DC]"
              placeholder="Song title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="flex-1 px-4 py-3 text-sm text-[#444] placeholder-[#AAA] bg-transparent"
              placeholder="Artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
            />
          </div>

          <div className="flex items-center border-b border-[#E0E0DC]">
            <input
              className="flex-1 px-4 py-2.5 text-xs text-[#555] placeholder-[#AAA] bg-transparent"
              placeholder="YouTube URL (optional)"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
            />
            <div className="flex gap-1 px-3 shrink-0">
              {(['vi', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                    language === l ? 'bg-[#0F0F0F] text-white' : 'text-[#888] hover:text-[#0F0F0F] hover:bg-[#F0F0EC]'
                  }`}
                >
                  {l === 'vi' ? 'VI' : 'EN'}
                </button>
              ))}
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="w-full px-4 py-3 text-sm text-[#0F0F0F] placeholder-[#AAA] bg-transparent resize-none leading-relaxed"
            style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", minHeight: '140px' }}
            placeholder="Paste Chinese lyrics here, one line per row"
            value={rawLyrics}
            onChange={(e) => setRawLyrics(e.target.value)}
          />

          {error && (
            <div className="mx-3 mb-2 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <Warning size={11} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex border-t border-[#E0E0DC]">
            <button
              onClick={handleCreate}
              disabled={!rawLyrics.trim()}
              className="flex-1 py-3 text-sm text-[#555] font-medium hover:text-[#0F0F0F] hover:bg-[#F8F7F5] disabled:opacity-30 disabled:cursor-not-allowed transition-all border-r border-[#E0E0DC]"
            >
              Create draft
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating || !rawLyrics.trim() || !hasKey}
              className="flex-1 py-3 text-sm font-semibold text-[#0F0F0F] hover:bg-[#F0F0EC] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              <Sparkle size={13} weight="fill" className="text-[#666]" />
              {generating ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Song list */}
      {songs.length > 0 && (
        <div className="px-4">
          <p className="text-xs font-semibold text-[#999] uppercase tracking-widest mb-3">Saved</p>
          <div className="space-y-1.5">
            {songs.map((song) => (
              <button
                key={song.id}
                onClick={() => setActiveSong(song.id)}
                className="w-full text-left px-4 py-3 bg-white border border-[#E0E0DC] rounded-xl hover:border-[#0F0F0F] transition-all flex items-center gap-3 group shadow-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#0F0F0F] truncate">{song.title}</p>
                  <p className="text-xs text-[#888] mt-0.5">{song.artist} · {song.lines.length} lines</p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-[#BBB] group-hover:text-[#555] transition-colors shrink-0"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
