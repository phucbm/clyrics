import { MusicNote, PencilSimple, Browsers } from '@phosphor-icons/react'
import { useSongStore } from '../store/useSongStore'
import type { AppTab } from '../types'

const TABS: { id: AppTab; label: string; Icon: typeof MusicNote }[] = [
  { id: 'input', label: 'Edit', Icon: PencilSimple },
  { id: 'lyrics', label: 'Lyrics', Icon: MusicNote },
  { id: 'fullscreen', label: 'Screen', Icon: Browsers },
]

export function TabNav() {
  const { activeTab, setActiveTab } = useSongStore()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#F8F7F5]/95 backdrop-blur-sm border-t border-[#EBEBEA]">
      <div className="flex items-center h-14">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="flex-1 flex flex-col items-center justify-center h-full gap-1 transition-colors"
              aria-label={label}
            >
              <Icon
                size={20}
                weight={active ? 'fill' : 'regular'}
                className={active ? 'text-[#0F0F0F]' : 'text-[#CCC]'}
              />
              <span
                className={`text-[10px] tracking-wide transition-colors ${
                  active ? 'text-[#0F0F0F]' : 'text-[#CCC]'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
