import { create } from 'zustand'
import type { Screen, PlayConfig, GenerateConfig } from '../types'

interface UIStore {
  screen: Screen
  playConfig: PlayConfig
  generateConfig: GenerateConfig
  autoplay: boolean
  navigateTo: (screen: Screen) => void
  setPlayConfig: (config: Partial<PlayConfig>) => void
  setGenerateConfig: (config: Partial<GenerateConfig>) => void
  setAutoplay: (v: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  screen: 'home',
  autoplay: false,
  playConfig: {
    pinyin: true,
    translation: true,
    secondLang: false,
    scrollSpeed: 5,
  },
  generateConfig: {
    translateLang: 'Vietnamese',
    secondLang: undefined,
    overridePinyin: false,
  },
  navigateTo: (screen) => set({ screen }),
  setPlayConfig: (config) => set((s) => ({ playConfig: { ...s.playConfig, ...config } })),
  setGenerateConfig: (config) => set((s) => ({ generateConfig: { ...s.generateConfig, ...config } })),
  setAutoplay: (v) => set({ autoplay: v }),
}))
