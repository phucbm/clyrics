import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'

interface SheetState {
  isOpen: boolean
  content: ReactNode | null
  title?: string
}

interface BottomSheetCtx {
  open: (content: ReactNode, title?: string) => void
  close: () => void
}

const Ctx = createContext<BottomSheetCtx>({ open: () => {}, close: () => {} })

export function useBottomSheet() {
  return useContext(Ctx)
}

export function BottomSheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<SheetState>({ isOpen: false, content: null })
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef(0)

  const open = useCallback((content: ReactNode, title?: string) => {
    setSheet({ isOpen: true, content, title })
    setDragY(0)
  }, [])

  const close = useCallback(() => {
    setSheet((s) => ({ ...s, isOpen: false }))
    setDragY(0)
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
    if (dragY > 100) {
      close()
    } else {
      setDragY(0)
    }
  }

  const panelTransform = sheet.isOpen ? `translateY(${dragY}px)` : 'translateY(100%)'
  const panelTransition = dragging ? 'none' : 'transform 0.3s cubic-bezier(0.32,0.72,0,1)'

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}

      {/* Backdrop */}
      <div
        className="absolute inset-0 z-40 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.35)',
          opacity: sheet.isOpen ? 1 : 0,
          pointerEvents: sheet.isOpen ? 'auto' : 'none',
        }}
        onClick={close}
      />

      {/* Sheet panel */}
      <div
        className="absolute inset-x-0 bottom-0 z-50 bg-[#F8F7F5] rounded-t-2xl shadow-2xl"
        style={{ transform: panelTransform, transition: panelTransition }}
      >
        {/* Drag handle */}
        <div
          className="pt-3 pb-1 flex justify-center cursor-grab active:cursor-grabbing touch-none select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="w-10 h-1 bg-[#D0D0CC] rounded-full" />
        </div>

        {/* Title */}
        {sheet.title && (
          <p className="px-5 pt-1 pb-2 text-sm font-semibold text-[#0F0F0F]">{sheet.title}</p>
        )}

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: '75dvh' }}>
          {sheet.content}
        </div>
      </div>
    </Ctx.Provider>
  )
}
