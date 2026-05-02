import { DiscordLogo, GithubLogo } from '@phosphor-icons/react'

const version = __APP_VERSION__

export function AppFooter() {
  return (
    <footer className="pt-2 pb-4 flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <a
          href="https://discord.gg/TRF53Jkk5Y"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#5865F2]/10 text-[#5865F2] text-xs font-medium hover:bg-[#5865F2]/20 transition-colors"
        >
          <DiscordLogo size={14} weight="fill" />
          Discord
        </a>
        <a
          href="https://github.com/phucbm/clyrics"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0F0F0F]/8 text-[#0F0F0F] text-xs font-medium hover:bg-[#0F0F0F]/15 transition-colors"
        >
          <GithubLogo size={14} weight="fill" />
          GitHub
        </a>
      </div>
      <p className="text-[10px] text-[#bbb]">C-Lyrics · open source &amp; free forever · v{version}</p>
    </footer>
  )
}
