import { useState, useRef, useEffect } from 'react'
import { useBottomSheet } from '../shell/BottomSheet'
import { contributeNewSong, contributeEditSong, getPRListUrl, prTitle, songBaseName, slugify } from '../../lib/github'
import { songChangeSummary } from '../../lib/utils'
import { useRepoSongs } from '../../hooks/useRepoSongs'
import { ArrowSquareOut, CheckCircle, GitPullRequest, Warning } from '@phosphor-icons/react'
import type { Song } from '../../types'

function resolveNewFileName(song: Song, repoSongs: Song[], nickname: string): string {
  const base = songBaseName(song)
  const ids = new Set(repoSongs.map((s) => s.id))
  if (!ids.has(base)) return `${base}.json`

  const nick = slugify(nickname)
  const withNick = nick ? `${base}-${nick}` : null
  if (withNick && !ids.has(withNick)) return `${withNick}.json`

  const suffixBase = withNick ?? base
  let n = 2
  while (ids.has(`${suffixBase}-${n}`)) n++
  return `${suffixBase}-${n}.json`
}

interface Props {
  song: Song
}

const inputCls =
  'w-full px-3 py-2.5 border border-[#E0E0DC] rounded-xl bg-white text-[#0F0F0F] placeholder-[#AAA] focus:border-[#0F0F0F] transition-colors outline-none'

const NICKNAME_KEY = 'clyrics_nickname'
const MIN_LENGTH = 2

export function ContributeSheet({ song }: Props) {
  const { close, setFooter } = useBottomSheet()
  const { songs: repoSongs } = useRepoSongs()
  const isCopy = !!song.copiedFrom
  const repoOriginal = song.copiedFrom ? repoSongs.find((s) => s.id === song.copiedFrom) : null
  const diff = repoOriginal ? songChangeSummary(song, repoOriginal) : null
  const isIdentical = isCopy && diff !== null && diff.changedLines === 0 && !diff.metaChanged
  const [mode, setMode] = useState<'new' | 'edit'>('new')
  const [nickname, setNickname] = useState(() => {
    try { return localStorage.getItem(NICKNAME_KEY) ?? '' } catch { return '' }
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const trimmed = nickname.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_LENGTH
  const canSubmit = trimmed.length >= MIN_LENGTH && status !== 'loading' && !isIdentical

  function handleNicknameChange(v: string) {
    setNickname(v)
    try { localStorage.setItem(NICKNAME_KEY, v) } catch {}
  }

  async function submit() {
    if (!canSubmit) return
    setStatus('loading')
    setError(null)
    try {
      const url =
        mode === 'edit' && song.copiedFrom
          ? await contributeEditSong(song, trimmed, song.copiedFrom)
          : await contributeNewSong(song, trimmed, resolveNewFileName(song, repoSongs, trimmed))
      setPrUrl(url)
      setStatus('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PR creation failed')
      setStatus('error')
    }
  }

  const submitRef = useRef(submit)
  submitRef.current = submit

  useEffect(() => {
    if (status === 'success' && prUrl) {
      setFooter(
        <div className="space-y-2">
          <a
            href={prUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3.5 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
          >
            <ArrowSquareOut size={14} />
            View PR on GitHub
          </a>
          <button onClick={close} className="w-full py-2 text-sm text-[#AAA] hover:text-[#555] transition-colors">
            Done
          </button>
        </div>
      )
    } else {
      setFooter(
        <button
          onClick={() => submitRef.current()}
          disabled={!canSubmit}
          className="w-full py-3.5 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white disabled:opacity-40 hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
        >
          <GitPullRequest size={15} weight="fill" />
          {status === 'loading' ? 'Creating PR…' : 'Send contribution'}
        </button>
      )
    }
  }, [status, prUrl, canSubmit])

  if (status === 'success') {
    return (
      <div className="px-5 pb-4 space-y-4">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle size={32} weight="fill" className="text-green-500" />
          <p className="text-sm font-semibold text-[#0F0F0F]">PR created!</p>
          <p className="text-xs text-[#888]">Your song is under review. Thank you for contributing.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-5 pb-4 space-y-4">
      <p className="text-xs text-[#888] leading-relaxed">
        Create a Pull Request to add your lyrics. Once reviewed and merged, it appears in Community Songs.
      </p>

      {isCopy && diff !== null && (
        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs ${
          diff.changedLines > 0 || diff.metaChanged
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-[#F0F0EC] border border-[#E0E0DC] text-[#888]'
        }`}>
          <span className={`w-2 h-2 rounded-full shrink-0 ${diff.changedLines > 0 || diff.metaChanged ? 'bg-green-500' : 'bg-[#CCC]'}`} />
          {diff.changedLines === 0 && !diff.metaChanged
            ? 'Identical to community version — no changes to contribute.'
            : [
                diff.metaChanged && 'Title/artist changed.',
                diff.changedLines > 0 && `${diff.changedLines} ${diff.changedLines === 1 ? 'line' : 'lines'} changed.`,
              ].filter(Boolean).join(' ')}
        </div>
      )}

      {/* Mode selector */}
      <div className={`space-y-1.5 ${isIdentical ? 'pointer-events-none opacity-40' : ''}`}>
        <p className="text-xs font-medium text-[#888]">Contribute as</p>
        <div className="space-y-2">
          <label className={`flex items-start gap-3 px-3 py-3 rounded-xl border transition-colors ${
            isIdentical ? 'cursor-not-allowed border-[#E0E0DC] bg-white' : `cursor-pointer ${mode === 'new' ? 'border-[#0F0F0F] bg-[#F8F7F5]' : 'border-[#E0E0DC] bg-white'}`
          }`}>
            <input
              type="radio"
              name="contribute-mode"
              value="new"
              checked={mode === 'new'}
              onChange={() => setMode('new')}
              disabled={isIdentical}
              className="mt-0.5 accent-[#0F0F0F]"
            />
            <div>
              <p className="text-sm font-medium text-[#0F0F0F]">New Song</p>
              <p className="text-[11px] text-[#888] mt-0.5">Add as a separate entry in the community library.</p>
            </div>
          </label>

          {isCopy && (
            <label className={`flex items-start gap-3 px-3 py-3 rounded-xl border transition-colors ${
              isIdentical ? 'cursor-not-allowed border-[#E0E0DC] bg-white' : `cursor-pointer ${mode === 'edit' ? 'border-[#0F0F0F] bg-[#F8F7F5]' : 'border-[#E0E0DC] bg-white'}`
            }`}>
              <input
                type="radio"
                name="contribute-mode"
                value="edit"
                checked={mode === 'edit'}
                onChange={() => setMode('edit')}
                disabled={isIdentical}
                className="mt-0.5 accent-[#0F0F0F]"
              />
              <div>
                <p className="text-sm font-medium text-[#0F0F0F]">Edits</p>
                <p className="text-[11px] text-[#888] mt-0.5">Propose changes to the original community song.</p>
              </div>
            </label>
          )}
        </div>
      </div>

      {/* File + PR title preview */}
      <div className="space-y-2">
        <div className="space-y-1">
          <span className="text-xs font-medium text-[#888]">Affected file</span>
          <p className="text-xs text-[#0F0F0F] bg-[#F0F0EC] rounded-xl px-3 py-2.5 font-mono leading-snug">
            {mode === 'edit' && song.copiedFrom
              ? `${song.copiedFrom}.json`
              : resolveNewFileName(song, repoSongs, trimmed)}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-[#888]">PR title</span>
          <p className="text-xs text-[#0F0F0F] bg-[#F0F0EC] rounded-xl px-3 py-2.5 font-mono leading-snug">
            {prTitle(song, trimmed || '…', mode)}
          </p>
        </div>
      </div>

      {/* Nickname input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#888]">Nickname</label>
        <input
          className={inputCls}
          placeholder="e.g. phucbm"
          value={nickname}
          onChange={(e) => handleNicknameChange(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
        />
        {tooShort && (
          <p className="text-[11px] text-red-500">At least {MIN_LENGTH} characters required.</p>
        )}
        <p className="text-[11px] text-[#AAA] leading-relaxed">
          Shows in the PR title. Public on{' '}
          <a
            href={getPRListUrl()}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-[#888] transition-colors"
          >
            GitHub
          </a>
          {' '}— use anything you're comfortable with.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <Warning size={12} className="shrink-0 mt-0.5" />
          <span className="break-all">{error}</span>
        </div>
      )}
    </div>
  )
}
