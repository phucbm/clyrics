import { useState, useRef, useEffect } from 'react'
import { useBottomSheet } from '../shell/BottomSheet'

interface Props {
  initialValue: string
  onChange: (value: string) => void
}

export function LyricsEditorSheet({ initialValue, onChange }: Props) {
  const [value, setValue] = useState(initialValue)
  const { close, setFooter } = useBottomSheet()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setFooter(
      <button
        onClick={close}
        className="w-full py-3.5 bg-[#0F0F0F] rounded-xl text-sm font-semibold text-white hover:bg-[#2a2a2a] transition-colors"
      >
        Done
      </button>
    )
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value)
    onChange(e.target.value)
  }

  const lineCount = value.split('\n').filter(Boolean).length

  return (
    <div className="px-5 pb-2">
      <textarea
        ref={textareaRef}
        className="w-full py-2 text-[#0F0F0F] placeholder-[#AAA] resize-none focus:outline-none leading-relaxed bg-transparent"
        style={{ fontFamily: "ui-monospace, 'SF Mono', monospace", fontSize: '16px', minHeight: '65dvh' }}
        placeholder="One Chinese line per row"
        value={value}
        onChange={handleChange}
      />
      <p className="text-xs text-[#AAA] text-right pb-1">{lineCount} lines</p>
    </div>
  )
}
