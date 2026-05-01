import { useUIStore } from './store/useUIStore'
import { BottomSheetProvider } from './components/shell/BottomSheet'
import { HomeScreen } from './components/screens/HomeScreen'
import { EditScreen } from './components/screens/EditScreen'
import { PlayScreen } from './components/screens/PlayScreen'
import type { Screen } from './types'

const SCREEN_ORDER: Screen[] = ['home', 'edit', 'play']

export default function App() {
  const { screen } = useUIStore()
  const idx = SCREEN_ORDER.indexOf(screen)

  return (
    /* AppShell: centers frame, page background, desktop credit */
    <div className="min-h-dvh flex justify-center bg-[#ECEAE6]">
      {/* AppFrame: mobile-first, max 600px, full viewport height */}
      <div className="w-full max-w-[600px] h-dvh flex flex-col relative bg-[#F8F7F5] overflow-hidden">
        <BottomSheetProvider>
          {/* Screen slider */}
          <div className="flex-1 overflow-hidden relative">
            <div
              className="flex h-full"
              style={{
                width: '300%',
                transform: `translateX(-${idx * (100 / 3)}%)`,
                transition: 'transform 0.32s cubic-bezier(0.32,0.72,0,1)',
              }}
            >
              <div className="h-full" style={{ width: '33.333%' }}>
                <HomeScreen />
              </div>
              <div className="h-full" style={{ width: '33.333%' }}>
                <EditScreen />
              </div>
              <div className="h-full" style={{ width: '33.333%' }}>
                <PlayScreen />
              </div>
            </div>
          </div>
        </BottomSheetProvider>
      </div>

      {/* Desktop credit — outside frame, fixed bottom-right */}
      <a
        href="https://phucbm.com"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-3 right-4 text-xs text-[#AAA] hover:text-[#888] transition-colors hidden md:block select-none"
      >
        made with ♥ by phucbm
      </a>
    </div>
  )
}
