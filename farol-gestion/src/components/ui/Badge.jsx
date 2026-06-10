import React from 'react'
import { clsx } from 'clsx'

const presets = {
  pagado:    'bg-farol-greenBg  text-farol-green  border-farol-green/20',
  pendiente: 'bg-farol-yellowBg text-farol-yellow border-farol-yellow/20',
  no_paga:   'bg-farol-redBg    text-farol-red    border-farol-red/20',
  dormido:   'bg-farol-redBg    text-farol-red    border-farol-red/20',
  entregado: 'bg-farol-greenBg  text-farol-green  border-farol-green/20',
  cancelado: 'bg-gray-100       text-gray-500     border-gray-200',
  default:   'bg-farol-mist     text-farol-ink/60 border-farol-border',
}

const labels = {
  pagado:    'Pagado',
  pendiente: 'Pendiente',
  no_paga:   'No paga',
  dormido:   'Dormido',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export default function Badge({ type, children, className }) {
  const style = presets[type] ?? presets.default
  return (
    <span className={clsx(
      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border',
      style, className
    )}>
      {children ?? labels[type] ?? type}
    </span>
  )
}
