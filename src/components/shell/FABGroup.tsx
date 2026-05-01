import { Children, type ReactNode } from 'react'
import { motion } from 'framer-motion'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
}

function itemVariant(side: 'left' | 'right') {
  return {
    hidden: { opacity: 0, x: side === 'right' ? 48 : -48 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 380, damping: 26 } },
  }
}

interface FABGroupProps {
  children: ReactNode
  side: 'left' | 'right'
  className?: string
}

export function FABGroup({ children, side, className }: FABGroupProps) {
  const item = itemVariant(side)
  return (
    <motion.div variants={container} initial="hidden" animate="show" className={className}>
      {Children.map(children, (child) =>
        child != null && child !== false
          ? <motion.div variants={item}>{child}</motion.div>
          : null
      )}
    </motion.div>
  )
}
