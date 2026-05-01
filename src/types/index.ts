export type Screen = 'home' | 'edit' | 'play'

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
  language: string
  secondLanguage?: string
  lines: LyricLine[]
  createdAt: number
  source: 'local' | 'repo'
}

export interface PlayConfig {
  pinyin: boolean
  translation: boolean
  secondLang: boolean
  scrollSpeed: number  // lines/sec, 0 = stopped
}

export interface GenerateConfig {
  translateLang: string
  secondLang?: string
  overridePinyin: boolean
}

export interface GitHubSettings {
  username: string
  token: string
}
