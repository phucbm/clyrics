import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ArrowLeft } from '@phosphor-icons/react'

interface SheetEntry {
  content: ReactNode
  title?: string
  footer?: ReactNode
}

interface BottomSheetCtx {
  open: (content: ReactNode, title?: string, footer?: ReactNode) => void
  close: () => void
  closeAll: () => void
  setFooter: (footer: ReactNode) => void
}

const Ctx = createContext<BottomSheetCtx>({
  open: () => {},
  close: () => {},
  closeAll: () => {},
  setFooter: () => {},
})

export function useBottomSheet() {
  return useContext(Ctx)
}

export function BottomSheetProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<SheetEntry[]>([])
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef(0)

  const isOpen = stack.length > 0
  const current = stack[stack.length - 1]

  const open = useCallback((content: ReactNode, title?: string, footer?: ReactNode) => {
    setStack(s => [...s, { content, title, footer }])
    setDragY(0)
  }, [])

  const close = useCallback(() => {
    setStack(s => (s.length <= 1 ? [] : s.slice(0, -1)))
    setDragY(0)
  }, [])

  const closeAll = useCallback(() => {
    setStack([])
    setDragY(0)
  }, [])

  const setFooter = useCallback((footer: ReactNode) => {
    setStack(s => {
      if (s.length === 0) return s
      const updated = [...s]
      updated[updated.length - 1] = { ...updated[updated.length - 1], footer }
      return updated
    })
  }, [])

  function onPointerDown(e: React.PointerEvent) {
    setDragging(true)
    startY.current = e.clientY
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return
    const delta = Math.max(0, e.clientY - startY.current)
    setDragY(delta)
  }

  function onPointerUp() {
    setDragging(false)
    if (dragY > 100) close()
    else setDragY(0)
  }

  const panelTransform = isOpen ? `translateY(${dragY}px)` : 'translateY(100%)'
  const panelTransition = dragging ? 'none' : 'transform 0.3s cubic-bezier(0.32,0.72,0,1)'

  return (
    <Ctx.Provider value={{ open, close, closeAll, setFooter }}>
      {children}

      {/* Backdrop */}
      <div
        className="absolute inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.35)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={closeAll}
      />

      {/* Sheet panel */}
      <div
        className="absolute inset-x-0 bottom-0 z-50 bg-[#F8F7F5] rounded-t-2xl shadow-2xl flex flex-col"
        style={{ transform: panelTransform, transition: panelTransition, maxHeight: '85dvh' }}
      >
        {/* Drag handle */}
        <div
          className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="w-10 h-1 bg-[#D0D0CC] rounded-full" />
        </div>

        {/* Title row */}
        {current?.title && (
          <div className="flex items-center gap-2 px-5 pt-1 pb-2 shrink-0">
            {stack.length > 1 && (
              <button
                onClick={close}
                className="flex items-center justify-center w-6 h-6 -ml-1 text-[#888] hover:text-[#0F0F0F] transition-colors"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <p className="text-sm font-semibold text-[#0F0F0F]">{current.title}</p>
          </div>
        )}

        {/* Content — render all stack entries, only show top */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {stack.map((entry, i) => (
            <div key={i} style={{ display: i === stack.length - 1 ? undefined : 'none' }}>
              {entry.content}
            </div>
          ))}
        </div>

        {/* Footer — top of stack only */}
        {current?.footer && (
          <div className="shrink-0 px-5 py-4 border-t border-[#E0E0DC] bg-[#F8F7F5]">
            {current.footer}
          </div>
        )}
      </div>
    </Ctx.Provider>
  )
}
