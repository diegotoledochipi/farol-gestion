import React, { useState, useMemo } from 'react'
import { UserPlus, Search, AlertTriangle, Users, MessageCircle, ChevronRight, Filter } from 'lucide-react'
import { useClientes } from '../../hooks/useClientes.js'
import ClienteForm from './ClienteForm.jsx'
import ClienteDetalle from './ClienteDetalle.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { clsx } from 'clsx'

const ARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function ClientesPage() {
  const { clientes, loading, error, crearCliente, editarCliente, eliminarCliente } = useClientes()

  const [busqueda, setBusqueda]             = useState('')
  const [filtro, setFiltro]                 = useState('todos')
  const [clienteSeleccionado, setClienteSel] = useState(null)
  const [modalForm, setModalForm]           = useState(false)
  const [clienteEditar, setClienteEditar]   = useState(null)
  const [modalConfirmar, setModalConfirmar] = useState(null)
  const [saving, setSaving]                 = useState(false)
  const [errorForm, setErrorForm]           = useState(null)

  const listaFiltrada = useMemo(() => {
    let lista = clientes
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase()
      lista = lista.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        c.comercio.toLowerCase().includes(q) ||
        (c.direccion ?? '').toLowerCase().includes(q)
      )
    }
    if (filtro === 'con_deuda') lista = lista.filter(c => c.deuda_total > 0)
    if (filtro === 'dormidos')  lista = lista.filter(c => c.dormido)
    return lista
  }, [clientes, busqueda, filtro])

  const stats = useMemo(() => ({
    total:     clientes.length,
    con_deuda: clientes.filter(c => c.deuda_total > 0).length,
    dormidos:  clientes.filter(c => c.dormido).length,
    deuda_sum: clientes.reduce((s, c) => s + c.deuda_total, 0),
  }), [clientes])

  const abrirNuevo  = () => { setClienteEditar(null); setErrorForm(null); setModalForm(true) }
  const abrirEditar = (c) => { setClienteEditar(c);   setErrorForm(null); setModalForm(true) }

  const handleGuardar = async (form) => {
    setSaving(true); setErrorForm(null)
    try {
      if (clienteEditar) {
        await editarCliente(clienteEditar.id, form)
        if (clienteSeleccionado?.id === clienteEditar.id)
          setClienteSel(prev => ({ ...prev, ...form }))
      } else {
        await crearCliente(form)
      }
      setModalForm(false)
    } catch (e) { setErrorForm(e.message) }
    finally { setSaving(false) }
  }

  const confirmarEliminar = async () => {
    if (!modalConfirmar) return
    setSaving(true)
    try {
      await eliminarCliente(modalConfirmar.id)
      if (clienteSeleccionado?.id === modalConfirmar.id) setClienteSel(null)
      setModalConfirmar(null)
    } catch (e) { alert('Error: ' + e.message) }
    finally { setSaving(false) }
  }

  if (error) return (
    <div className="p-6 text-pipe-red text-sm">Error: {error}</div>
  )

  return (
    <div className="flex h-[calc(100vh-48px)]">

      {/* ── Lista ─────────────────────────────────────────────────────── */}
      <div className={clsx(
        'flex flex-col bg-white transition-all duration-200',
        clienteSeleccionado
          ? 'w-[400px] min-w-[320px] border-r border-pipe-border'
          : 'flex-1'
      )}>

        {/* Barra superior de la lista */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-pipe-border bg-white">
          <h1 className="text-base font-semibold text-pipe-text mr-1">Clientes</h1>

          {/* Filtros rápidos */}
          <div className="flex items-center gap-1">
            {[
              { id: 'todos',     label: `Todos (${stats.total})` },
              { id: 'con_deuda', label: `Con deuda (${stats.con_deuda})` },
              { id: 'dormidos',  label: `Inactivos (${stats.dormidos})` },
            ].map(f => (
              <button key={f.id} onClick={() => setFiltro(f.id)}
                className={clsx(
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors h-7',
                  filtro === f.id
                    ? 'bg-pipe-blueFaint text-pipe-blue'
                    : 'text-pipe-muted hover:bg-pipe-bg'
                )}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Buscador compacto */}
          <div className="relative w-44">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pipe-faint pointer-events-none" />
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar…"
              className="w-full pl-7 pr-2.5 py-1 text-sm rounded border border-pipe-border bg-pipe-bg
                         focus:outline-none focus:ring-2 focus:ring-pipe-blue/20 focus:border-pipe-blue
                         placeholder:text-pipe-faint transition-colors" />
          </div>

          <Button onClick={abrirNuevo} size="sm">
            <UserPlus size={13} />
            Nuevo cliente
          </Button>
        </div>

        {/* Header de columnas */}
        {!loading && listaFiltrada.length > 0 && (
          <div className="grid grid-cols-[1fr_auto] px-4 py-1.5 bg-pipe-bg border-b border-pipe-border text-2xs font-semibold text-pipe-faint uppercase tracking-wider">
            <span>Cliente</span>
            <span className="text-right">Deuda</span>
          </div>
        )}

        {/* Lista de clientes */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex flex-col">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-pipe-border">
                  <div className="w-7 h-7 rounded bg-pipe-bg animate-pulse shrink-0" />
                  <div className="flex-1">
                    <div className="h-3.5 bg-pipe-bg rounded animate-pulse w-32 mb-1.5" />
                    <div className="h-3 bg-pipe-bg rounded animate-pulse w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : listaFiltrada.length === 0 ? (
            <EmptyState
              icon={Users}
              title={busqueda || filtro !== 'todos' ? 'Sin resultados' : 'Sin clientes todavía'}
              description={
                busqueda ? `Ningún resultado para "${busqueda}"`
                : filtro === 'dormidos' ? 'Ningún cliente inactivo'
                : filtro === 'con_deuda' ? 'No hay deudas pendientes'
                : 'Creá el primero con el botón de arriba'
              }
              action={clientes.length === 0 ? (
                <Button onClick={abrirNuevo} size="sm"><UserPlus size={13} />Crear primer cliente</Button>
              ) : null}
            />
          ) : (
            <ul>
              {listaFiltrada.map(c => (
                <ClienteRow
                  key={c.id}
                  cliente={c}
                  activo={clienteSeleccionado?.id === c.id}
                  onClick={() => setClienteSel(clienteSeleccionado?.id === c.id ? null : c)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer con totales */}
        {!loading && stats.deuda_sum > 0 && (
          <div className="px-4 py-2 border-t border-pipe-border bg-pipe-bg flex items-center justify-between">
            <span className="text-xs text-pipe-faint">{stats.con_deuda} clientes con deuda</span>
            <span className="text-xs font-semibold font-mono text-pipe-yellow">{ARS(stats.deuda_sum)}</span>
          </div>
        )}
      </div>

      {/* ── Panel detalle ─────────────────────────────────────────────── */}
      {clienteSeleccionado && (
        <div className="flex-1 overflow-y-auto slide-in">
          <ClienteDetalle
            cliente={clientes.find(c => c.id === clienteSeleccionado.id) ?? clienteSeleccionado}
            onEditar={abrirEditar}
            onEliminar={setModalConfirmar}
            onCerrar={() => setClienteSel(null)}
          />
        </div>
      )}

      {/* ── Modal formulario ─────────────────────────────────────────── */}
      <Modal open={modalForm} onClose={() => !saving && setModalForm(false)}
        title={clienteEditar ? `Editar — ${clienteEditar.comercio}` : 'Nuevo cliente'}>
        {errorForm && (
          <div className="mb-3 px-3 py-2 rounded bg-pipe-redBg text-pipe-red text-sm border border-red-200">
            {errorForm}
          </div>
        )}
        <ClienteForm inicial={clienteEditar} onGuardar={handleGuardar}
          onCancelar={() => setModalForm(false)} loading={saving} />
      </Modal>

      {/* ── Modal confirmar eliminar ──────────────────────────────────── */}
      <Modal open={!!modalConfirmar} onClose={() => setModalConfirmar(null)}
        title="Eliminar cliente" size="sm">
        <p className="text-sm text-pipe-muted mb-1">
          Vas a eliminar a <strong className="text-pipe-text">{modalConfirmar?.comercio}</strong>.
        </p>
        <p className="text-sm text-pipe-red mb-5">Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setModalConfirmar(null)} disabled={saving}>Cancelar</Button>
          <Button variant="danger" onClick={confirmarEliminar} loading={saving}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}

function ClienteRow({ cliente, activo, onClick }) {
  const waLink = cliente.telefono
    ? `https://wa.me/${cliente.telefono.replace(/\D/g, '')}`
    : null

  return (
    <li onClick={onClick}
      className={clsx(
        'flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-pipe-border',
        'hover:bg-pipe-bg transition-colors group',
        activo && 'bg-pipe-blueFaint border-l-2 border-l-pipe-blue'
      )}>

      {/* Avatar inicial */}
      <div className={clsx(
        'w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0',
        cliente.dormido   ? 'bg-pipe-redBg    text-pipe-red'
        : cliente.deuda_total > 0 ? 'bg-pipe-yellowBg text-pipe-yellow'
        : 'bg-pipe-blueFaint text-pipe-blue'
      )}>
        {cliente.comercio.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-pipe-text truncate">{cliente.comercio}</span>
          {cliente.dormido && (
            <AlertTriangle size={11} className="text-pipe-red shrink-0" />
          )}
        </div>
        <p className="text-xs text-pipe-faint truncate">{cliente.nombre}</p>
      </div>

      {/* Deuda + WA + chevron */}
      <div className="flex items-center gap-1.5 shrink-0">
        {cliente.deuda_total > 0 && (
          <span className="text-xs font-mono font-semibold text-pipe-yellow tabular-nums">
            {ARS(cliente.deuda_total)}
          </span>
        )}
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-1 rounded text-pipe-faint hover:text-[#25D366] hover:bg-green-50 transition-colors opacity-0 group-hover:opacity-100"
            title="Abrir WhatsApp">
            <MessageCircle size={13} />
          </a>
        )}
        <ChevronRight size={13} className="text-pipe-border2" />
      </div>
    </li>
  )
}
