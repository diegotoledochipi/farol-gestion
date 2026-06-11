import React from 'react'
import { clsx } from 'clsx'

export default function Input({ label, error, helper, className, textarea, ...props }) {
  const base = clsx(
    'w-full rounded border bg-white px-2.5 py-1.5 text-sm text-pipe-text',
    'placeholder:text-pipe-faint',
    'focus:outline-none focus:ring-2 focus:ring-pipe-blue/20 focus:border-pipe-blue',
    'transition-colors duration-100',
    error
      ? 'border-pipe-red'
      : 'border-pipe-border hover:border-pipe-border2',
    className
  )

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-medium text-pipe-muted">
          {label}
        </label>
      )}
      {textarea
        ? <textarea className={clsx(base, 'resize-none')} rows={3} {...props} />
        : <input className={base} {...props} />
      }
      {error  && <p className="text-xs text-pipe-red">{error}</p>}
      {helper && !error && <p className="text-xs text-pipe-faint">{helper}</p>}
    </div>
  )
}
