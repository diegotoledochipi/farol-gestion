import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={clsx(
        'relative w-full bg-white rounded-lg shadow-modal fade-in overflow-hidden',
        widths[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-pipe-border">
          <h2 className="text-base font-semibold text-pipe-text">{title}</h2>
          <button
            onClick={onClose}
            className="text-pipe-faint hover:text-pipe-text transition-colors p-1 rounded hover:bg-pipe-bg"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
