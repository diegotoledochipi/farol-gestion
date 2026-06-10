import React from 'react'
import { clsx } from 'clsx'

const variants = {
  primary:  'bg-farol-amber text-white hover:bg-farol-gold active:scale-[0.98] shadow-sm',
  secondary:'bg-white border border-farol-border text-farol-ink hover:bg-farol-mist active:scale-[0.98]',
  ghost:    'text-farol-ink/60 hover:text-farol-ink hover:bg-farol-mist',
  danger:   'bg-farol-red text-white hover:bg-red-800 active:scale-[0.98]',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  loading,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded transition-all duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {children}
    </button>
  )
}
