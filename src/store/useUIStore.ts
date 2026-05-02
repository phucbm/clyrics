import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Screen, PlayConfig, GenerateConfig } from '../types'

const SCREEN_ORDER: Screen[] = ['home', 'edit', 'play']

interface UIStore {
  screen: Screen
  prevScreen: Screen
  direction: 'forward' | 'back'
  playConfig: PlayConfig
  generateConfig: GenerateConfig
  autoplay: boolean
  primaryLang: string
  secondaryLang: string | undefined
  navigateTo: (screen: Screen) => void
  setPlayConfig: (config: Partial<PlayConfig>) => void
  setGenerateConfig: (config: Partial<GenerateConfig>) => void
  setAutoplay: (v: boolean) => void
  setLangs: (primary: string, secondary?: string) => void
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      screen: 'home',
      prevScreen: 'home',
      direction: 'forward',
      autoplay: false,
      primaryLang: 'Vietnamese',
      secondaryLang: undefined,
      playConfig: {
        pinyin: true,
        translation: true,
        secondLang: false,
        scrollSpeed: 0.2,
        loop: true,
        hideVideo: false,
      },
      generateConfig: {
        translateLang: 'Vietnamese',
        secondLang: undefined,
        overridePinyin: false,
      },
      navigateTo: (screen) => {
        const cur = SCREEN_ORDER.indexOf(get().screen)
        const next = SCREEN_ORDER.indexOf(screen)
        set({ prevScreen: get().screen, screen, direction: next >= cur ? 'forward' : 'back' })
      },
      setPlayConfig: (config) => set((s) => ({ playConfig: { ...s.playConfig, ...config } })),
      setGenerateConfig: (config) => set((s) => ({ generateConfig: { ...s.generateConfig, ...config } })),
      setAutoplay: (v) => set({ autoplay: v }),
      setLangs: (primary, secondary) => set({ primaryLang: primary, secondaryLang: secondary }),
    }),
    {
      name: 'clyrics_ui',
      partialize: (s) => ({
        primaryLang: s.primaryLang,
        secondaryLang: s.secondaryLang,
        playConfig: s.playConfig,
        generateConfig: s.generateConfig,
      }),
    }
  )
)
