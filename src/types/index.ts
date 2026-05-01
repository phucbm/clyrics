export type Screen = 'home' | 'edit' | 'play'
export type Lang = 'vi' | 'en' | 'jp'

export interface LyricLine {
  id: string
  chinese: string
  pinyin: string
  translation: string
  secondTranslation?: string
}

export interface Song {
  id: string
  title: string
  artist: string
  youtubeUrl?: string
  youtubeDuration?: number
  language: Lang
  secondLanguage?: Lang
  lines: LyricLine[]
  createdAt: number
  source: 'local' | 'repo'
}

export interface PlayConfig {
  pinyin: boolean
  translation: boolean
  secondLang: boolean
  autoScroll: boolean
}

export interface GenerateConfig {
  translateLang: Lang
  secondLang?: Lang
  overridePinyin: boolean
}

export interface GitHubSettings {
  username: string
  token: string
}
