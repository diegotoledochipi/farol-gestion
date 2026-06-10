import React from 'react'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-farol-mist flex items-center justify-center mb-4">
          <Icon size={24} className="text-farol-amber/60" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="font-display text-lg text-farol-ink mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-farol-ink/50 max-w-xs mb-5">{description}</p>
      )}
      {action}
    </div>
  )
}
