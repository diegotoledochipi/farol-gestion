import React from 'react'
import { clsx } from 'clsx'

const variants = {
  primary:   'bg-pipe-blue text-white hover:bg-pipe-blueHover active:scale-[0.98] shadow-sm',
  secondary: 'bg-white border border-pipe-border text-pipe-text hover:bg-pipe-bg hover:border-pipe-border2 active:scale-[0.98]',
  ghost:     'text-pipe-muted hover:text-pipe-text hover:bg-pipe-bg',
  danger:    'bg-pipe-red text-white hover:bg-red-700 active:scale-[0.98]',
}

const sizes = {
  sm: 'px-2.5 py-1 text-xs gap-1.5 h-7',
  md: 'px-3 py-1.5 text-sm gap-2 h-8',
  lg: 'px-4 py-2 text-sm gap-2 h-9',
}

export default function Button({ children, variant = 'primary', size = 'md', className, disabled, loading, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded transition-all duration-100',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
