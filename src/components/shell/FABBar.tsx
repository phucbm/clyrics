import { Children, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import type { ControlButton } from './controls'

// ── FAB ──────────────────────────────────────────────────────────────────────

interface FABProps {
  onClick: () => void
  children: ReactNode
  variant?: 'primary' | 'secondary'
  label?: string
  indicator?: boolean
}

function FAB({ onClick, children, variant = 'primary', label, indicator }: FABProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-150 active:scale-90 ${
        variant === 'primary'
          ? 'bg-[#0F0F0F] text-white hover:bg-[#2a2a2a]'
          : 'bg-white text-[#0F0F0F] border border-[#E0E0DC] hover:bg-[#F0F0EC]'
      }`}
    >
      {children}
      {indicator && (
        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-green-500 ring-2 ring-white" />
      )}
    </button>
  )
}

// ── FABGroup ──────────────────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0, transition: { duration: 0.25, when: 'afterChildren' } },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

function itemVariant(side: 'left' | 'right') {
  return {
    hidden: { opacity: 0, x: side === 'right' ? 48 : -48 },
    show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 380, damping: 26 } },
  }
}

interface FABGroupProps {
  children: ReactNode
  side: 'left' | 'right'
  className?: string
  visible?: boolean
}

function FABGroup({ children, side, className, visible = true }: FABGroupProps) {
  const item = itemVariant(side)
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate={visible ? 'show' : 'hidden'}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
      className={className}
    >
      {Children.map(children, (child) =>
        child != null && child !== false
          ? <motion.div variants={item}>{child}</motion.div>
          : null
      )}
    </motion.div>
  )
}

// ── FABBar ────────────────────────────────────────────────────────────────────

interface FABBarProps {
  buttons: ControlButton[]
  visible?: boolean
}

export function FABBar({ buttons, visible = true }: FABBarProps) {
  const left = buttons.filter((b) => b.position === 'left')
  const right = buttons.filter((b) => b.position === 'right')

  return (
    <>
      {left.length > 0 && (
        <div className="absolute bottom-6 left-5 z-20">
          <FABGroup side="left" className="flex flex-col items-center gap-3" visible={visible}>
            {left.map((btn, i) => (
              <FAB key={i} onClick={btn.onClick} variant={btn.variant} label={btn.label} indicator={btn.indicator}>
                {btn.icon}
              </FAB>
            ))}
          </FABGroup>
        </div>
      )}
      {right.length > 0 && (
        <div className="absolute bottom-6 right-5 z-20">
          <FABGroup side="right" className="flex flex-col items-center gap-3" visible={visible}>
            {right.map((btn, i) => (
              <FAB key={i} onClick={btn.onClick} variant={btn.variant} label={btn.label} indicator={btn.indicator}>
                {btn.icon}
              </FAB>
            ))}
          </FABGroup>
        </div>
      )}
    </>
  )
}
