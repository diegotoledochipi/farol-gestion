import React, { useState } from 'react'
import { X, MessageCircle, Trash2 } from 'lucide-react'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { ARS } from '../../lib/financiero.js'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const fmt = d => d ? format(new Date(d), "d MMM yyyy", { locale: es }) : '—'

const ESTADOS_ENTREGA = [
  { value: 'pendiente',  label: 'Pendiente entrega', color: 'pendiente' },
  { value: 'entregado',  label: 'Entregado',          color: 'entregado' },
  { value: 'cancelado',  label: 'Cancelado',          color: 'cancelado' },
]
const ESTADOS_COBRO = [
  { value: 'pendiente', label: 'Pendiente de cobro', color: 'pendiente' },
  { value: 'pagado',    label: 'Pagado',              color: 'pagado' },
  { value: 'no_paga',   label: 'No paga',             color: 'no_paga' },
]

export default function PedidoDetalle({ pedido, onClose, onActualizar, onEliminar }) {
  const [saving, setSaving] = useState(false)

  if (!pedido) return null

  const cambiarEstado = async (campo, valor) => {
    setSaving(true)
    try { await onActualizar(pedido.id, { [campo]: valor }) }
    finally { setSaving(false) }
  }

  const waLink = pedido.cliente?.telefono
    ? `https://wa.me/${pedido.cliente.telefono.replace(/\D/g,'')}`
    : null

  const items = pedido.pedido_item || []
  const total = pedido.total || 0

  return (
    <div className="flex flex-col h-full bg-white border-l border-pipe-border slide-in">
      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-pipe-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-pipe-faint">#{String(pedido.numero).padStart(4,'0')}</span>
            <h2 className="text-base font-semibold text-pipe-text">{pedido.cliente?.comercio}</h2>
          </div>
          <p className="text-sm text-pipe-muted mt-0.5">{pedido.cliente?.nombre} · {fmt(pedido.fecha_pedido)}</p>
        </div>
        <div className="flex items-center gap-1">
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-[#25D366] text-white hover:bg-[#1ebe5d] h-7">
              <MessageCircle size={12}/> WA
            </a>
          )}
          <button onClick={() => onEliminar(pedido)}
            className="p-1.5 rounded text-pipe-faint hover:text-pipe-red hover:bg-pipe-redBg">
            <Trash2 size={14}/>
          </button>
          <button onClick={onClose} className="p-1.5 rounded text-pipe-faint hover:text-pipe-text hover:bg-pipe-bg">
            <X size={14}/>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4 flex flex-col gap-4">

        {/* Estado entrega */}
        <div>
          <p className="text-xs font-semibold text-pipe-muted uppercase tracking-wider mb-2">Estado de entrega</p>
          <div className="flex gap-2">
            {ESTADOS_ENTREGA.map(e => (
              <button key={e.value}
                onClick={() => cambiarEstado('estado_entrega', e.value)}
                disabled={saving}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  pedido.estado_entrega === e.value
                    ? e.value === 'entregado' ? 'bg-pipe-greenBg border-green-300 text-pipe-green'
                    : e.value === 'cancelado' ? 'bg-gray-100 border-gray-300 text-gray-500'
                    : 'bg-pipe-yellowBg border-yellow-300 text-pipe-yellow'
                    : 'bg-white border-pipe-border text-pipe-muted hover:bg-pipe-bg'
                }`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Estado cobro */}
        <div>
          <p className="text-xs font-semibold text-pipe-muted uppercase tracking-wider mb-2">Estado de cobro</p>
          <div className="flex gap-2">
            {ESTADOS_COBRO.map(e => (
              <button key={e.value}
                onClick={() => cambiarEstado('estado_cobro', e.value)}
                disabled={saving}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  pedido.estado_cobro === e.value
                    ? e.value === 'pagado'  ? 'bg-pipe-greenBg  border-green-300 text-pipe-green'
                    : e.value === 'no_paga' ? 'bg-pipe-redBg    border-red-300   text-pipe-red'
                    : 'bg-pipe-yellowBg border-yellow-300 text-pipe-yellow'
                    : 'bg-white border-pipe-border text-pipe-muted hover:bg-pipe-bg'
                }`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pedido',   val: pedido.fecha_pedido },
            { label: 'Entrega',  val: pedido.fecha_entrega },
            { label: 'Cobro',    val: pedido.fecha_cobro },
          ].map(f => (
            <div key={f.label} className="rounded border border-pipe-border px-3 py-2">
              <p className="text-2xs text-pipe-faint uppercase tracking-wide">{f.label}</p>
              <p className="text-sm font-medium text-pipe-text mt-0.5">{fmt(f.val)}</p>
            </div>
          ))}
        </div>

        {/* Productos */}
        <div>
          <p className="text-xs font-semibold text-pipe-muted uppercase tracking-wider mb-2">Productos</p>
          <div className="border border-pipe-border rounded overflow-hidden">
            {items.map((it, idx) => (
              <div key={it.id} className={`flex items-center justify-between px-3 py-2 text-sm ${idx < items.length-1 ? 'border-b border-pipe-border' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-pipe-faint text-xs w-5">{it.cantidad}×</span>
                  <span className="text-pipe-text">{it.producto?.nombre}</span>
                </div>
                <span className="font-mono text-pipe-muted">{ARS(it.precio_unitario)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nota */}
        {pedido.aclaraciones && (
          <div className="rounded border border-pipe-border px-3 py-2 bg-pipe-bg">
            <p className="text-2xs text-pipe-faint uppercase tracking-wide mb-1">Nota</p>
            <p className="text-sm text-pipe-text">{pedido.aclaraciones}</p>
          </div>
        )}

        {/* Total */}
        <div className="flex items-center justify-between px-3 py-3 rounded bg-pipe-bg border border-pipe-border">
          <span className="text-sm font-medium text-pipe-muted">Total</span>
          <span className="text-xl font-semibold font-mono text-pipe-text">{ARS(total)}</span>
        </div>
      </div>
    </div>
  )
}
