import React, { useState, useMemo } from 'react'
import { Plus, AlertCircle } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import NuevoPedidoModal from './NuevoPedidoModal.jsx'
import PedidoDetalle from './PedidoDetalle.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { usePedidos } from '../../hooks/usePedidos.js'
import { useClientes } from '../../hooks/useClientes.js'
import { useProductos } from '../../hooks/useProductos.js'
import { ARS } from '../../lib/financiero.js'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const fmt = d => d ? format(new Date(d), "d MMM", { locale: es }) : '—'

const COLUMNAS = [
  { id: 'pendiente', label: 'Pedidos',   filter: p => p.estado_entrega === 'pendiente' && p.estado_cobro !== 'no_paga' },
  { id: 'entregado', label: 'Entregados', filter: p => p.estado_entrega === 'entregado' },
  { id: 'cobrado',   label: 'Cobrados',  filter: p => p.estado_cobro === 'pagado' },
  { id: 'cancelado', label: 'Cancelados/No paga', filter: p => p.estado_entrega === 'cancelado' || p.estado_cobro === 'no_paga' },
]

function colorTarjeta(pedido) {
  if (pedido.estado_cobro === 'no_paga' || pedido.estado_entrega === 'cancelado') return 'border-l-red-400 bg-pipe-redBg/30'
  if (pedido.estado_cobro === 'pagado') return 'border-l-green-400 bg-pipe-greenBg/30'
  if (pedido.estado_entrega === 'entregado') return 'border-l-yellow-400 bg-pipe-yellowBg/30'
  return 'border-l-pipe-border2 bg-white'
}

export default function PanelPage() {
  const { pedidos, loading, crearPedido, actualizarEstado, eliminarPedido } = usePedidos()
  const { clientes } = useClientes()
  const { productos } = useProductos()

  const [modalNuevo, setModalNuevo]   = useState(false)
  const [savingNuevo, setSavingNuevo] = useState(false)
  const [pedidoSel, setPedidoSel]     = useState(null)
  const [confirmarEl, setConfirmarEl] = useState(null)

  // Plata en la calle: entregados pendientes de cobro (sin no_paga)
  const plataEnLaCalle = useMemo(() =>
    pedidos
      .filter(p => p.estado_entrega === 'entregado' && p.estado_cobro === 'pendiente')
      .reduce((s, p) => s + (p.total || 0), 0)
  , [pedidos])

  const handleCrear = async (form) => {
    setSavingNuevo(true)
    try { await crearPedido(form); setModalNuevo(false) }
    catch(e) { alert('Error: ' + e.message) }
    finally { setSavingNuevo(false) }
  }

  const handleEliminar = async () => {
    if (!confirmarEl) return
    await eliminarPedido(confirmarEl.id)
    if (pedidoSel?.id === confirmarEl.id) setPedidoSel(null)
    setConfirmarEl(null)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)]">

      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-pipe-border bg-white shrink-0">
        <h1 className="text-base font-semibold text-pipe-text">Pipeline de ventas</h1>
        {plataEnLaCalle > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-pipe-yellowBg border border-yellow-200 text-pipe-yellow text-xs font-medium">
            <AlertCircle size={12}/>
            Plata en la calle: {ARS(plataEnLaCalle)}
          </div>
        )}
        <div className="flex-1"/>
        <Button onClick={() => setModalNuevo(true)} size="sm">
          <Plus size={13}/> Nuevo pedido
        </Button>
      </div>

      {/* Kanban */}
      <div className={clsx('flex flex-1 overflow-hidden', pedidoSel ? 'mr-[380px]' : '')}>
        <div className="flex flex-1 overflow-x-auto gap-0">
          {COLUMNAS.map((col, colIdx) => {
            const colPedidos = pedidos.filter(col.filter)
            const colTotal   = colPedidos.reduce((s, p) => s + (p.total || 0), 0)

            return (
              <div key={col.id} className={clsx(
                'flex flex-col min-w-[260px] flex-1 border-r border-pipe-border',
                colIdx === COLUMNAS.length - 1 && 'border-r-0'
              )}>
                {/* Header columna */}
                <div className="flex items-center justify-between px-3 py-2 bg-pipe-bg border-b border-pipe-border shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">{col.label}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-pipe-border text-pipe-muted text-2xs font-semibold">{colPedidos.length}</span>
                  </div>
                  {colTotal > 0 && <span className="text-xs font-mono font-semibold text-pipe-muted">{ARS(colTotal)}</span>}
                </div>

                {/* Tarjetas */}
                <div className="flex-1 overflow-y-auto scrollbar-thin p-2 flex flex-col gap-2">
                  {loading ? (
                    [1,2,3].map(i => <div key={i} className="h-20 rounded-md bg-pipe-border/30 animate-pulse"/>)
                  ) : colPedidos.length === 0 ? (
                    <div className="flex items-center justify-center h-16 text-pipe-faint text-xs">Sin pedidos</div>
                  ) : colPedidos.map(p => (
                    <TarjetaPedido
                      key={p.id}
                      pedido={p}
                      activo={pedidoSel?.id === p.id}
                      onClick={() => setPedidoSel(pedidoSel?.id === p.id ? null : p)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Panel lateral */}
        {pedidoSel && (
          <div className="fixed top-12 right-0 w-[380px] h-[calc(100vh-48px)] z-20 shadow-panel">
            <PedidoDetalle
              pedido={pedidos.find(p => p.id === pedidoSel.id) ?? pedidoSel}
              onClose={() => setPedidoSel(null)}
              onActualizar={actualizarEstado}
              onEliminar={setConfirmarEl}
            />
          </div>
        )}
      </div>

      {/* Modal nuevo pedido */}
      <NuevoPedidoModal
        open={modalNuevo}
        onClose={() => setModalNuevo(false)}
        onGuardar={handleCrear}
        clientes={clientes}
        productos={productos}
        loading={savingNuevo}
      />

      {/* Confirmar eliminar */}
      <Modal open={!!confirmarEl} onClose={() => setConfirmarEl(null)} title="Eliminar pedido" size="sm">
        <p className="text-sm text-pipe-muted mb-4">
          ¿Eliminás el pedido #{confirmarEl && String(confirmarEl.numero).padStart(4,'0')} de <strong>{confirmarEl?.cliente?.comercio}</strong>? Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmarEl(null)}>Cancelar</Button>
          <Button variant="danger" onClick={handleEliminar}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}

function TarjetaPedido({ pedido, activo, onClick }) {
  const items = pedido.pedido_item || []
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-md border border-pipe-border border-l-4 px-3 py-2.5 cursor-pointer transition-all',
        colorTarjeta(pedido),
        activo && 'ring-2 ring-pipe-blue ring-offset-1',
        'hover:shadow-card'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-pipe-text truncate">{pedido.cliente?.comercio}</p>
          <p className="text-xs text-pipe-faint truncate">{pedido.cliente?.nombre}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge type={pedido.estado_cobro}/>
          <span className="font-mono text-sm font-semibold text-pipe-text">{ARS(pedido.total)}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-pipe-faint truncate max-w-[130px]">
          {items.slice(0,2).map(i => `${i.cantidad}× ${i.producto?.nombre}`).join(', ')}
          {items.length > 2 && ` +${items.length-2}`}
        </p>
        <span className="text-2xs text-pipe-faint font-mono">{fmt(pedido.fecha_pedido)}</span>
      </div>
    </div>
  )
}
