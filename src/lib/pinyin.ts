import { useDefault, Segment } from 'segmentit'
import { pinyin } from 'pinyin-pro'

const seg = useDefault(new Segment())

const CJK_RE = /[一-鿿㐀-䶿]/

export function linePinyin(chinese: string): string {
  const cjkOnly = chinese.replace(/[^一-鿿㐀-䶿]/g, '')
  if (!cjkOnly) return ''

  // Full-line context for accurate polyphonic resolution (e.g. 了 → le not liǎo)
  const chars = pinyin(cjkOnly, { toneType: 'symbol', type: 'array' })

  // Segmentit only for word boundaries, not pinyin generation
  const words = seg.doSegment(cjkOnly, { simple: true }) as string[]

  let charIdx = 0
  return words
    .filter((w) => CJK_RE.test(w))
    .map((w) => {
      const wordPinyin = chars.slice(charIdx, charIdx + w.length).join('')
      charIdx += w.length
      return wordPinyin
    })
    .join(' ')
}
