import React from 'react'
import { MessageCircle, Clock, AlertTriangle, X, Edit2, Trash2 } from 'lucide-react'
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
    <div className="flex flex-col h-full">
      {/* Header del panel */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-farol-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl text-farol-ink">{cliente.comercio}</h2>
            {cliente.dormido && (
              <span className="flex items-center gap-1 text-xs text-farol-red font-medium">
                <AlertTriangle size={13} />
                Dormido
              </span>
            )}
          </div>
          <p className="text-sm text-farol-ink/50 mt-0.5">{cliente.nombre}</p>
        </div>
        <div className="flex items-center gap-2">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              <MessageCircle size={13} />
              WhatsApp
            </a>
          )}
          <button
            onClick={() => onEditar(cliente)}
            className="p-1.5 rounded text-farol-ink/40 hover:text-farol-amber hover:bg-farol-mist transition-colors"
            title="Editar"
          >
            <Edit2 size={15} />
          </button>
          <button
            onClick={() => onEliminar(cliente)}
            className="p-1.5 rounded text-farol-ink/40 hover:text-farol-red hover:bg-farol-redBg transition-colors"
            title="Eliminar"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={onCerrar}
            className="p-1.5 rounded text-farol-ink/40 hover:text-farol-ink hover:bg-farol-mist transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Datos del cliente */}
      <div className="px-6 py-4 border-b border-farol-border grid grid-cols-2 gap-x-6 gap-y-3">
        {cliente.direccion && (
          <InfoRow label="Dirección" value={cliente.direccion} />
        )}
        {cliente.telefono && (
          <InfoRow label="Teléfono" value={cliente.telefono} />
        )}
        {cliente.ultimo_pedido && (
          <InfoRow
            label="Último pedido"
            value={
              <span className={cliente.dormido ? 'text-farol-red' : ''}>
                {fmtFecha(cliente.ultimo_pedido)}
                {cliente.dias_sin_pedido != null && (
                  <span className="text-farol-ink/40 ml-1">
                    (hace {cliente.dias_sin_pedido}d)
                  </span>
                )}
              </span>
            }
          />
        )}
        <InfoRow
          label="Total pedidos"
          value={`${cliente.pedidos_count ?? 0} pedidos`}
        />
      </div>

      {/* Nota interna */}
      {cliente.nota && (
        <div className="px-6 py-3 border-b border-farol-border bg-farol-mist/50">
          <p className="text-xs text-farol-ink/40 uppercase tracking-wide font-medium mb-1">Nota</p>
          <p className="text-sm text-farol-ink/70 italic">{cliente.nota}</p>
        </div>
      )}

      {/* Deuda */}
      {cliente.deuda_total > 0 && (
        <div className="mx-6 my-4 rounded bg-farol-yellowBg border border-farol-yellow/30 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-farol-yellow">
            <Clock size={15} />
            <span className="text-sm font-medium">Plata en la calle</span>
          </div>
          <span className="font-mono font-semibold text-farol-yellow text-base">
            {ARS(cliente.deuda_total)}
          </span>
        </div>
      )}

      {/* Historial de pedidos */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-6">
        <p className="text-xs text-farol-ink/40 uppercase tracking-wide font-medium mt-4 mb-3">
          Historial de pedidos
        </p>

        {loadingPedidos ? (
          <div className="flex items-center gap-2 text-farol-ink/30 text-sm py-4">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Cargando…
          </div>
        ) : pedidos.length === 0 ? (
          <p className="text-sm text-farol-ink/30 py-4">
            Sin pedidos todavía. Aparecerán acá cuando cargues el primero.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {pedidos.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2.5 rounded border border-farol-border bg-white hover:bg-farol-mist/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-farol-ink/40">
                    #{String(p.numero).padStart(4, '0')}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-farol-ink">{fmtFecha(p.fecha_pedido)}</p>
                    {p.aclaraciones && (
                      <p className="text-xs text-farol-ink/40 truncate max-w-[160px]">{p.aclaraciones}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge type={p.estado_cobro} />
                  <span className="font-mono text-sm font-medium text-farol-ink">
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

function InfoRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-farol-ink/40 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-sm text-farol-ink mt-0.5">{value}</p>
    </div>
  )
}
