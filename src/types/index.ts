export interface LyricLine {
  id: string
  chinese: string
  pinyin: string
  translation: string
}

export interface Song {
  id: string
  title: string
  artist: string
  youtubeUrl?: string
  youtubeDuration?: number
  language: 'vi' | 'en'
  lines: LyricLine[]
  createdAt: number
}

export interface GitHubSettings {
  username: string
  token: string
}

export type AppTab = 'input' | 'lyrics' | 'fullscreen'
