import {useState} from 'react'
import {AnimatePresence, motion} from 'framer-motion'
import {useUIStore} from './store/useUIStore'
import {BottomSheetProvider} from './components/shell/BottomSheet'
import {HomeScreen} from './components/screens/HomeScreen'
import {EditScreen} from './components/screens/EditScreen'
import {PlayScreen} from './components/screens/PlayScreen'
import {useUrlSync} from './hooks/useUrlSync'

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

type Align = 'left' | 'center' | 'right'
const LS_ALIGN = 'clyrics_align'
const JUSTIFY: Record<Align, string> = {
  left: 'justify-start',
  center: 'justify-center',
  right: 'justify-end',
}

function useAlign() {
  const [align, setAlignState] = useState<Align>(
    () => (localStorage.getItem(LS_ALIGN) as Align) || 'center'
  )
  function setAlign(a: Align) {
    setAlignState(a)
    localStorage.setItem(LS_ALIGN, a)
  }
  return { align, setAlign }
}

const ALIGN_OPTIONS: { value: Align; label: string }[] = [
  { value: 'left', label: '⊢' },
  { value: 'center', label: '↔' },
  { value: 'right', label: '⊣' },
]

export default function App() {
  const { screen, direction } = useUIStore()
  const Screen = SCREENS[screen]
  const { align, setAlign } = useAlign()
  const { ready } = useUrlSync()

  return (
    <div className={`min-h-dvh flex ${JUSTIFY[align]} bg-[#ECEAE6]`}>
      <div className="w-full max-w-[600px] h-dvh flex flex-col relative bg-[#F8F7F5] overflow-hidden">
        {!ready && (
          <div className="absolute inset-0 z-50 bg-[#F8F7F5] flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-[#0F0F0F]/20 border-t-[#0F0F0F] animate-spin" />
          </div>
        )}
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

      {/* Desktop-only controls — sits in sidebar space, switches side with alignment */}
      <div
          className={`hidden md:flex flex-col fixed top-3 gap-3 select-none ${
          align === 'left' ? 'right-4' : 'left-4'
        }`}
      >
          <div>
              <img src="/icon.png" alt="" className="w-8 h-8 rounded-lg" />
          </div>
          <div>
              <div className="inline-flex w-auto items-center gap-0.5 bg-[#E4E2DE] rounded-lg p-0.5">
                  {ALIGN_OPTIONS.map(({value, label}) => (
                      <button
                          key={value}
                          onClick={() => setAlign(value)}
                          title={`Align ${value}`}
                          className={`w-7 h-7 rounded-md text-sm transition-colors flex items-center justify-center ${
                              align === value
                                  ? 'bg-white text-[#0F0F0F] shadow-sm'
                                  : 'text-[#999] hover:text-[#555]'
                          }`}
                      >
                          {label}
                      </button>
                  ))}
              </div>
          </div>
          <a
              href="https://phucbm.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#AAA] hover:text-[#888] transition-colors"
          >
              made with ♥ by phucbm
          </a>

      </div>
    </div>
  )
}
