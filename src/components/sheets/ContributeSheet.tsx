import { useState } from 'react'
import { useBottomSheet } from '../shell/BottomSheet'
import { contributeSong, getPRListUrl, prBody, prTitle } from '../../lib/github'
import { ArrowSquareOut, CheckCircle, GitPullRequest, Warning } from '@phosphor-icons/react'
import type { Song } from '../../types'

interface Props {
  song: Song
}

const inputCls =
  'w-full px-3 py-2.5 border border-[#E0E0DC] rounded-xl bg-white text-sm text-[#0F0F0F] placeholder-[#AAA] focus:border-[#0F0F0F] transition-colors outline-none'

const MIN_LENGTH = 5

export function ContributeSheet({ song }: Props) {
  const { close } = useBottomSheet()
  const [contributor, setContributor] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [prUrl, setPrUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const trimmed = contributor.trim()
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_LENGTH
  const canSubmit = trimmed.length >= MIN_LENGTH && status !== 'loading'

  async function handleCreatePR() {
    if (!canSubmit) return
    setStatus('loading')
    setError(null)
    try {
      const url = await contributeSong(song, trimmed)
      setPrUrl(url)
      setStatus('success')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PR creation failed')
      setStatus('error')
    }
  }

  if (status === 'success' && prUrl) {
    return (
      <div className="px-5 pb-8 space-y-4">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <CheckCircle size={32} weight="fill" className="text-green-500" />
          <p className="text-sm font-semibold text-[#0F0F0F]">PR created!</p>
          <p className="text-xs text-[#888]">Your song is under review. Thank you for contributing.</p>
        </div>
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
  }

  const isEdit = song.source === 'repo'

  return (
    <div className="px-5 pb-8 space-y-4">
      <p className="text-xs text-[#888] leading-relaxed">
        Create a Pull Request to save your lyrics. Once reviewed and merged, you can find it in the Community section.
      </p>

      {/* Mode badge */}
      {isEdit && (
        <div className="text-xs text-[#888] bg-[#F0F0EC] rounded-lg px-3 py-2">
          Updating existing song — your version will replace the current file. All changes reviewable in the PR.
        </div>
      )}

      {/* PR preview */}
      <div className="space-y-2">
        <div className="space-y-1">
          <span className="text-xs font-medium text-[#888]">Title</span>
          <p className="text-xs text-[#0F0F0F] bg-[#F0F0EC] rounded-xl px-3 py-2.5 font-mono leading-snug">
            {prTitle(song)}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs font-medium text-[#888]">Description</span>
          <pre className="text-xs text-[#555] bg-[#F0F0EC] rounded-xl px-3 py-2.5 whitespace-pre-wrap leading-relaxed font-sans">
            {prBody(song, trimmed || '…')}
          </pre>
        </div>
      </div>

      {/* Contributor input */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#888]">Your name or email</label>
        <input
          className={inputCls}
          placeholder="e.g. Jane or jane@example.com"
          value={contributor}
          onChange={(e) => setContributor(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
        />
        {tooShort && (
          <p className="text-[11px] text-red-500">At least {MIN_LENGTH} characters required.</p>
        )}
        <p className="text-[11px] text-[#AAA] leading-relaxed">
          We ask so we can give you early access if this app grows — you could be one of our first privileged users. We'll never send you updates or spam.{' '}
          Your name will be public in the PR at{' '}
          <a
            href={getPRListUrl()}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:text-[#888] transition-colors"
          >
            github.com/phucbm/clyrics/pulls
          </a>
          . Ask us to remove it anytime by commenting on the PR.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <Warning size={12} className="shrink-0 mt-0.5" />
          <span className="break-all">{error}</span>
        </div>
      )}

      <button
        onClick={handleCreatePR}
        disabled={!canSubmit}
        className="w-full py-3.5 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white disabled:opacity-40 hover:bg-[#2a2a2a] transition-colors flex items-center justify-center gap-2"
      >
        <GitPullRequest size={15} weight="fill" />
        {status === 'loading' ? 'Creating PR…' : isEdit ? 'Submit Update' : 'Contribute'}
      </button>
    </div>
  )
}
