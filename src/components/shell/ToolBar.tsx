import { motion } from 'framer-motion'
import type { ControlButton } from './controls'

// ── ToolBarButton ─────────────────────────────────────────────────────────────

interface ToolBarButtonProps {
  btn: ControlButton
  inPill?: boolean
}

function ToolBarButton({ btn, inPill = false }: ToolBarButtonProps) {
  const isPrimary = btn.variant === 'primary'
  return (
    <button
      onClick={btn.onClick}
      aria-label={btn.label}
      className={`flex flex-col items-center justify-center gap-1 transition-all active:scale-90 ${
        inPill ? 'w-12 h-12' : 'w-14 h-14'
      } ${
        isPrimary
          ? 'bg-[#0F0F0F] text-white rounded-full shadow-sm'
          : 'text-[#0F0F0F]'
      }`}
    >
      {btn.icon}
      <span className="text-[10px] font-medium leading-none text-current opacity-60">{btn.label}</span>
    </button>
  )
}

// ── ToolBarGroup ──────────────────────────────────────────────────────────────

function ToolBarGroup({ buttons }: { buttons: ControlButton[] }) {
  const single = buttons.length === 1
  const isPrimarySingle = single && buttons[0].variant === 'primary'

  return (
    <div
      className={`flex items-center shadow-md ${
        single
          ? `w-14 h-14 justify-center rounded-full ${isPrimarySingle ? 'bg-[#0F0F0F]' : 'bg-white border border-[#E0E0DC]'}`
          : 'rounded-2xl bg-white border border-[#E0E0DC] px-1 gap-0.5'
      }`}
    >
      {buttons.map((btn, i) => (
        <ToolBarButton key={i} btn={btn} inPill={!single} />
      ))}
    </div>
  )
}

// ── ToolBar ───────────────────────────────────────────────────────────────────

interface ToolBarProps {
  buttons: ControlButton[]
  visible?: boolean
}

export function ToolBar({ buttons, visible = true }: ToolBarProps) {
  const left = buttons.filter((b) => b.position === 'left')
  const right = buttons.filter((b) => b.position === 'right')

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={visible ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      className="absolute bottom-0 inset-x-0 flex items-end justify-between px-5 pb-6 z-20"
    >
      <div>{left.length > 0 ? <ToolBarGroup buttons={left} /> : <div className="w-14" />}</div>
      <div>{right.length > 0 ? <ToolBarGroup buttons={right} /> : null}</div>
    </motion.div>
  )
}
