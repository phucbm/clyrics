import { useState, useCallback } from 'react'

interface YouTubeInfo {
  duration: number
  title: string
}

export function useYouTube() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInfo = useCallback(async (url: string): Promise<YouTubeInfo | null> => {
    setLoading(true)
    setError(null)
    try {
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`
      const res = await fetch(oembedUrl)
      if (!res.ok) throw new Error('Invalid YouTube URL')
      const data = await res.json()
      // oEmbed doesn't return duration — use 0 as fallback
      return { duration: 0, title: data.title as string }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch video info')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { fetchInfo, loading, error }
}

export function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  return match?.[1] ?? null
}
