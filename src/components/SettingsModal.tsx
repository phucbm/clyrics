import { useState } from 'react'
import { useSongStore } from '../store/useSongStore'
import { saveUserGroqKey, clearUserGroqKey, getGroqKey } from '../lib/groq'
import { Button } from './ui/Button'
import { X } from '@phosphor-icons/react'

interface Props {
  onClose: () => void
}

export function SettingsModal({ onClose }: Props) {
  const { githubSettings, setGithubSettings } = useSongStore()
  const [username, setUsername] = useState(githubSettings?.username ?? '')
  const [token, setToken] = useState(githubSettings?.token ?? '')

  const hasEnvKey = !!import.meta.env.VITE_GROQ_API_KEY
  const currentUserKey = !hasEnvKey ? (localStorage.getItem('clyrics_groq_key') ?? '') : ''
  const [groqKey, setGroqKey] = useState(currentUserKey)

  function save() {
    // GitHub settings
    if (username && token) {
      setGithubSettings({ username, token })
    } else {
      setGithubSettings(null)
    }
    // Groq key (only if env key not present)
    if (!hasEnvKey) {
      if (groqKey.trim()) {
        saveUserGroqKey(groqKey.trim())
      } else {
        clearUserGroqKey()
      }
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl border border-[#EAEAEA] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-[#111111]">Settings</h2>
          <button onClick={onClose} className="text-[#999] hover:text-[#111111]">
            <X size={16} />
          </button>
        </div>

        {/* Groq API key */}
        <div className="mb-5">
          <p className="text-xs font-medium text-[#111111] mb-1">Groq API Key</p>
          {hasEnvKey ? (
            <p className="text-xs text-[#888]">
              Author's key active · shared usage limit · may be removed anytime.{' '}
              <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="underline">
                Get your own free key
              </a>
              {' '}and redeploy with <code className="bg-[#F7F6F3] px-1 rounded">VITE_GROQ_API_KEY</code>.
            </p>
          ) : (
            <>
              <input
                type="password"
                className="w-full h-10 px-3 text-sm border border-[#EAEAEA] rounded-md focus:outline-none focus:border-[#111111] mt-1"
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
              />
              <p className="text-xs text-[#999] mt-1">
                Free key from{' '}
                <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="underline">
                  console.groq.com
                </a>
                . Stored in localStorage only.
              </p>
            </>
          )}
        </div>

        {/* GitHub */}
        <div className="mb-5">
          <p className="text-xs font-medium text-[#111111] mb-1">GitHub (for contributing songs)</p>
          <p className="text-xs text-[#888] mb-2">
            Token needs <code className="bg-[#F7F6F3] px-1 rounded">repo</code> scope. Stored in localStorage.
          </p>
          <div className="space-y-2">
            <input
              className="w-full h-10 px-3 text-sm border border-[#EAEAEA] rounded-md focus:outline-none focus:border-[#111111]"
              placeholder="GitHub username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              className="w-full h-10 px-3 text-sm border border-[#EAEAEA] rounded-md focus:outline-none focus:border-[#111111]"
              placeholder="Personal access token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" onClick={save}>Save</Button>
        </div>
      </div>
    </div>
  )
}
