export type Screen = 'home' | 'edit' | 'play'

export interface Translation {
  lang: string
  text: string
}

export interface LyricLine {
  id: string
  chinese: string
  pinyin: string
  translations: Translation[]
}

export interface Song {
  id: string
  title: string
  titlePinyin?: string
  artist: string
  youtubeUrl?: string
  youtubeDuration?: number
  authors: string[]
  lines: LyricLine[]
  createdAt: number
  updatedAt?: number
  source: 'local' | 'repo'
  copiedFrom?: string
}

export interface PlayConfig {
  pinyin: boolean
  translation: boolean
  secondLang: boolean
  scrollSpeed: number
  loop: boolean
  hideVideo: boolean
}

export interface GenerateConfig {
  translateLang: string
  secondLang?: string
  thirdLang?: string
  overridePinyin: boolean
  temperature: number
  customPrompt?: string
}
