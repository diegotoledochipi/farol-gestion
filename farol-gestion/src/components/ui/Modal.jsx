import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { clsx } from 'clsx'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  // Cerrar con Escape
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-farol-dark/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={clsx(
        'relative w-full bg-white rounded-lg shadow-2xl fade-in overflow-hidden',
        widths[size]
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-farol-border">
          <h2 className="font-display text-lg text-farol-ink">{title}</h2>
          <button
            onClick={onClose}
            className="text-farol-ink/40 hover:text-farol-ink transition-colors p-1 rounded hover:bg-farol-mist"
          >
            <X size={18} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
