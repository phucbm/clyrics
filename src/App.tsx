import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from './store/useUIStore'
import { BottomSheetProvider } from './components/shell/BottomSheet'
import { HomeScreen } from './components/screens/HomeScreen'
import { EditScreen } from './components/screens/EditScreen'
import { PlayScreen } from './components/screens/PlayScreen'

const SCREENS = {
  home: HomeScreen,
  edit: EditScreen,
  play: PlayScreen,
}

const variants = {
  enter: (dir: 'forward' | 'back') => ({
    x: dir === 'forward' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 'forward' | 'back') => ({
    x: dir === 'forward' ? '-100%' : '100%',
    opacity: 0,
  }),
}

const transition = { duration: 0.32, ease: [0.32, 0.72, 0, 1] as const }

export default function App() {
  const { screen, direction } = useUIStore()
  const Screen = SCREENS[screen]

  return (
    <div className="min-h-dvh flex justify-center bg-[#ECEAE6]">
      <div className="w-full max-w-[600px] h-dvh flex flex-col relative bg-[#F8F7F5] overflow-hidden">
        <BottomSheetProvider>
          <div className="flex-1 relative overflow-hidden">
            <AnimatePresence mode="sync" custom={direction} initial={false}>
              <motion.div
                key={screen}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="absolute inset-0"
              >
                <Screen />
              </motion.div>
            </AnimatePresence>
          </div>
        </BottomSheetProvider>
      </div>

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
