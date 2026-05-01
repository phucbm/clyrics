import { create } from 'zustand'
import type { Screen, PlayConfig, GenerateConfig } from '../types'

const SCREEN_ORDER: Screen[] = ['home', 'edit', 'play']

interface UIStore {
  screen: Screen
  direction: 'forward' | 'back'
  playConfig: PlayConfig
  generateConfig: GenerateConfig
  autoplay: boolean
  navigateTo: (screen: Screen) => void
  setPlayConfig: (config: Partial<PlayConfig>) => void
  setGenerateConfig: (config: Partial<GenerateConfig>) => void
  setAutoplay: (v: boolean) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  screen: 'home',
  direction: 'forward',
  autoplay: false,
  playConfig: {
    pinyin: true,
    translation: true,
    secondLang: false,
    scrollSpeed: 1,
    loop: true,
  },
  generateConfig: {
    translateLang: 'Vietnamese',
    secondLang: undefined,
    overridePinyin: false,
  },
  navigateTo: (screen) => {
    const cur = SCREEN_ORDER.indexOf(get().screen)
    const next = SCREEN_ORDER.indexOf(screen)
    set({ screen, direction: next >= cur ? 'forward' : 'back' })
  },
  setPlayConfig: (config) => set((s) => ({ playConfig: { ...s.playConfig, ...config } })),
  setGenerateConfig: (config) => set((s) => ({ generateConfig: { ...s.generateConfig, ...config } })),
  setAutoplay: (v) => set({ autoplay: v }),
}))
