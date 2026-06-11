import React from 'react'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-lg bg-pipe-blueFaint flex items-center justify-center mb-3">
          <Icon size={22} className="text-pipe-blue" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-base font-semibold text-pipe-text mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-pipe-muted max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  )
}
