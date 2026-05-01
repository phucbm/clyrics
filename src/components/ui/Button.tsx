import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-[#111111] text-white hover:opacity-80',
    ghost: 'bg-transparent text-[#111111] border border-[#EAEAEA] hover:bg-[#F7F6F3]',
    danger: 'bg-transparent text-red-600 border border-red-200 hover:bg-red-50',
  }
  const sizes = {
    sm: 'h-8 px-3 text-sm rounded',
    md: 'h-10 px-5 text-sm rounded-md',
  }
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
