import React from 'react'
import { MessageCircle, Clock, AlertTriangle, X, Edit2, Trash2, MapPin, Phone } from 'lucide-react'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import { usePedidosCliente } from '../../hooks/useClientes.js'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const fmtFecha = (d) => d ? format(new Date(d), "d MMM yyyy", { locale: es }) : '—'

export default function ClienteDetalle({ cliente, onEditar, onEliminar, onCerrar }) {
  const { pedidos, loading: loadingPedidos } = usePedidosCliente(cliente?.id)
  if (!cliente) return null

  const waLink = cliente.telefono
    ? `https://wa.me/${cliente.telefono.replace(/\D/g, '')}`
    : null

  return (
    <div className="flex flex-col h-full bg-white border-l border-pipe-border">

      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-pipe-border">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-pipe-text truncate">{cliente.comercio}</h2>
            {cliente.dormido && (
              <span className="flex items-center gap-1 text-xs text-pipe-red font-medium shrink-0">
                <AlertTriangle size={12} />
                Inactivo
              </span>
            )}
          </div>
          <p className="text-sm text-pipe-muted mt-0.5">{cliente.nombre}</p>
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          {waLink && (
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-[#25D366] text-white hover:bg-[#1ebe5d] transition-colors h-7">
              <MessageCircle size={12} />
              WhatsApp
            </a>
          )}
          <button onClick={() => onEditar(cliente)}
            className="p-1.5 rounded text-pipe-faint hover:text-pipe-blue hover:bg-pipe-blueFaint transition-colors" title="Editar">
            <Edit2 size={14} />
          </button>
          <button onClick={() => onEliminar(cliente)}
            className="p-1.5 rounded text-pipe-faint hover:text-pipe-red hover:bg-pipe-redBg transition-colors" title="Eliminar">
            <Trash2 size={14} />
          </button>
          <button onClick={onCerrar}
            className="p-1.5 rounded text-pipe-faint hover:text-pipe-text hover:bg-pipe-bg transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Info rápida */}
      <div className="px-5 py-3 border-b border-pipe-border flex flex-wrap gap-x-5 gap-y-2">
        {cliente.direccion && (
          <div className="flex items-center gap-1.5 text-sm text-pipe-muted">
            <MapPin size={13} className="text-pipe-faint shrink-0" />
            {cliente.direccion}
          </div>
        )}
        {cliente.telefono && (
          <div className="flex items-center gap-1.5 text-sm text-pipe-muted">
            <Phone size={13} className="text-pipe-faint shrink-0" />
            {cliente.telefono}
          </div>
        )}
        {cliente.ultimo_pedido && (
          <div className="flex items-center gap-1.5 text-sm">
            <Clock size={13} className="text-pipe-faint shrink-0" />
            <span className={cliente.dormido ? 'text-pipe-red' : 'text-pipe-muted'}>
              Último pedido: {fmtFecha(cliente.ultimo_pedido)}
              {cliente.dias_sin_pedido != null && (
                <span className="text-pipe-faint ml-1">(hace {cliente.dias_sin_pedido}d)</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Nota interna */}
      {cliente.nota && (
        <div className="mx-5 mt-3 px-3 py-2 rounded bg-pipe-yellowBg border border-yellow-200 text-sm text-pipe-yellow">
          <span className="font-medium text-xs uppercase tracking-wide text-pipe-faint block mb-0.5">Nota</span>
          {cliente.nota}
        </div>
      )}

      {/* Deuda */}
      {cliente.deuda_total > 0 && (
        <div className="mx-5 mt-3 flex items-center justify-between px-3 py-2.5 rounded bg-pipe-yellowBg border border-yellow-200">
          <div className="flex items-center gap-2 text-pipe-yellow text-sm font-medium">
            <Clock size={14} />
            Deuda pendiente
          </div>
          <span className="font-mono font-semibold text-pipe-yellow text-base">
            {ARS(cliente.deuda_total)}
          </span>
        </div>
      )}

      {/* Historial de pedidos */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-5 pb-5">
        <div className="flex items-center justify-between mt-4 mb-2">
          <p className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">
            Historial de pedidos
          </p>
          <span className="text-xs text-pipe-faint">{cliente.pedidos_count ?? 0} en total</span>
        </div>

        {loadingPedidos ? (
          <div className="flex flex-col gap-1.5">
            {[1,2,3].map(i => <div key={i} className="h-10 rounded bg-pipe-bg animate-pulse" />)}
          </div>
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-pipe-faint py-4 text-center">
            Sin pedidos todavía.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {pedidos.map(p => (
              <div key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded border border-pipe-border bg-white hover:bg-pipe-bg transition-colors">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-pipe-faint w-10">
                    #{String(p.numero).padStart(4, '0')}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-pipe-text leading-none">{fmtFecha(p.fecha_pedido)}</p>
                    {p.aclaraciones && (
                      <p className="text-xs text-pipe-faint truncate max-w-[140px] mt-0.5">{p.aclaraciones}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge type={p.estado_cobro} />
                  <span className="font-mono text-sm font-semibold text-pipe-text tabular-nums">
                    {ARS(p.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
