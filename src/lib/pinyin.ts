import { useDefault, Segment } from 'segmentit'
import { pinyin } from 'pinyin-pro'

const seg = useDefault(new Segment())

const CJK_RE = /[一-鿿㐀-䶿]/

// Split on spaces, commas, Chinese punctuation — preserves clause boundaries
const CLAUSE_SPLIT_RE = /[\s，、。！？,]+/

function clausePinyin(cjkOnly: string): string {
  const chars = pinyin(cjkOnly, { toneType: 'symbol', type: 'array' })
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

export function linePinyin(chinese: string): string {
  const clauses = chinese.split(CLAUSE_SPLIT_RE).map((c) => c.replace(/[^一-鿿㐀-䶿]/g, '')).filter(Boolean)
  if (!clauses.length) return ''
  const result = clauses.map(clausePinyin).join(', ')
  return result.charAt(0).toUpperCase() + result.slice(1)
}
