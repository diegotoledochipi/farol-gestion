import React from 'react'
import { clsx } from 'clsx'

const presets = {
  pagado:    'bg-pipe-greenBg  text-pipe-green  border-green-200',
  pendiente: 'bg-pipe-yellowBg text-pipe-yellow border-yellow-200',
  no_paga:   'bg-pipe-redBg    text-pipe-red    border-red-200',
  dormido:   'bg-pipe-redBg    text-pipe-red    border-red-200',
  entregado: 'bg-pipe-greenBg  text-pipe-green  border-green-200',
  cancelado: 'bg-gray-50       text-gray-400    border-gray-200',
  default:   'bg-pipe-bg       text-pipe-muted  border-pipe-border',
}

const labels = {
  pagado: 'Pagado', pendiente: 'Pendiente', no_paga: 'No paga',
  dormido: 'Dormido', entregado: 'Entregado', cancelado: 'Cancelado',
}

export default function Badge({ type, children, className }) {
  const style = presets[type] ?? presets.default
  return (
    <span className={clsx(
      'inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium border',
      style, className
    )}>
      {children ?? labels[type] ?? type}
    </span>
  )
}
