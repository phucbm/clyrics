import { create } from 'zustand'
import type { Screen, PlayConfig, GenerateConfig } from '../types'

interface UIStore {
  screen: Screen
  playConfig: PlayConfig
  generateConfig: GenerateConfig
  navigateTo: (screen: Screen) => void
  setPlayConfig: (config: Partial<PlayConfig>) => void
  setGenerateConfig: (config: Partial<GenerateConfig>) => void
}

export const useUIStore = create<UIStore>((set) => ({
  screen: 'home',
  playConfig: {
    pinyin: true,
    translation: true,
    secondLang: false,
    autoScroll: true,
  },
  generateConfig: {
    translateLang: 'vi',
    secondLang: undefined,
    overridePinyin: false,
  },
  navigateTo: (screen) => set({ screen }),
  setPlayConfig: (config) => set((s) => ({ playConfig: { ...s.playConfig, ...config } })),
  setGenerateConfig: (config) => set((s) => ({ generateConfig: { ...s.generateConfig, ...config } })),
}))
