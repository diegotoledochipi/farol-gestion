import React from 'react'
import { clsx } from 'clsx'

export default function Input({
  label,
  error,
  helper,
  className,
  textarea,
  ...props
}) {
  const base = clsx(
    'w-full rounded border bg-white px-3 py-2 text-sm text-farol-ink',
    'placeholder:text-farol-ink/30',
    'focus:outline-none focus:ring-2 focus:ring-farol-amber/40 focus:border-farol-amber',
    'transition-colors duration-150',
    error ? 'border-farol-red' : 'border-farol-border hover:border-farol-amber/50',
    className
  )

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-farol-ink/60 uppercase tracking-wide">
          {label}
        </label>
      )}
      {textarea ? (
        <textarea className={clsx(base, 'resize-none')} rows={3} {...props} />
      ) : (
        <input className={base} {...props} />
      )}
      {error  && <p className="text-xs text-farol-red">{error}</p>}
      {helper && !error && <p className="text-xs text-farol-ink/40">{helper}</p>}
    </div>
  )
}
