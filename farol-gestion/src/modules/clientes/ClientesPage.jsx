import React, { useState, useMemo } from 'react'
import {
  UserPlus, Search, AlertTriangle, Users, MessageCircle, ChevronRight
} from 'lucide-react'
import { useClientes } from '../../hooks/useClientes.js'
import ClienteForm from './ClienteForm.jsx'
import ClienteDetalle from './ClienteDetalle.jsx'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Badge from '../../components/ui/Badge.jsx'
import { clsx } from 'clsx'

const ARS = (n) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

export default function ClientesPage() {
  const { clientes, loading, error, crearCliente, editarCliente, eliminarCliente } = useClientes()

  // ── Estado UI ──────────────────────────────────────────────────────────────
  const [busqueda, setBusqueda]               = useState('')
  const [filtro, setFiltro]                   = useState('todos')   // 'todos' | 'con_deuda' | 'dormidos'
  const [clienteSeleccionado, setClienteSelec] = useState(null)
  const [modalForm, setModalForm]             = useState(false)
  const [clienteEditar, setClienteEditar]     = useState(null)
  const [modalConfirmar, setModalConfirmar]   = useState(null)
  const [saving, setSaving]                   = useState(false)
  const [errorForm, setErrorForm]             = useState(null)

  // ── Lista filtrada ─────────────────────────────────────────────────────────
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

  // ── Stats rápidas ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:     clientes.length,
    con_deuda: clientes.filter(c => c.deuda_total > 0).length,
    dormidos:  clientes.filter(c => c.dormido).length,
    deuda_sum: clientes.reduce((s, c) => s + c.deuda_total, 0),
  }), [clientes])

  // ── Handlers ───────────────────────────────────────────────────────────────
  const abrirNuevo = () => {
    setClienteEditar(null)
    setErrorForm(null)
    setModalForm(true)
  }

  const abrirEditar = (c) => {
    setClienteEditar(c)
    setErrorForm(null)
    setModalForm(true)
  }

  const handleGuardar = async (form) => {
    setSaving(true)
    setErrorForm(null)
    try {
      if (clienteEditar) {
        await editarCliente(clienteEditar.id, form)
        // Actualizar el seleccionado si es el mismo
        if (clienteSeleccionado?.id === clienteEditar.id) {
          setClienteSelec(prev => ({ ...prev, ...form }))
        }
      } else {
        await crearCliente(form)
      }
      setModalForm(false)
    } catch (e) {
      setErrorForm(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEliminar = async (c) => {
    setModalConfirmar(c)
  }

  const confirmarEliminar = async () => {
    if (!modalConfirmar) return
    setSaving(true)
    try {
      await eliminarCliente(modalConfirmar.id)
      if (clienteSeleccionado?.id === modalConfirmar.id) setClienteSelec(null)
      setModalConfirmar(null)
    } catch (e) {
      alert('Error al eliminar: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="p-8 text-farol-red text-sm">Error al cargar clientes: {error}</div>
  )

  return (
    <div className="flex h-[calc(100vh-105px)]">

      {/* ── Columna izquierda: lista ─────────────────────────────────────── */}
      <div className={clsx(
        'flex flex-col border-r border-farol-border bg-white transition-all duration-200',
        clienteSeleccionado ? 'w-[420px] min-w-[320px]' : 'flex-1'
      )}>

        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-farol-border">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-display text-2xl text-farol-ink">Clientes</h1>
            <Button onClick={abrirNuevo} size="sm">
              <UserPlus size={14} />
              Nuevo cliente
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <StatChip
              label="Clientes"
              value={stats.total}
              active={filtro === 'todos'}
              onClick={() => setFiltro('todos')}
            />
            <StatChip
              label="Con deuda"
              value={stats.con_deuda}
              sub={stats.con_deuda > 0 ? ARS(stats.deuda_sum) : null}
              active={filtro === 'con_deuda'}
              onClick={() => setFiltro('con_deuda')}
              accent="yellow"
            />
            <StatChip
              label="Dormidos"
              value={stats.dormidos}
              active={filtro === 'dormidos'}
              onClick={() => setFiltro('dormidos')}
              accent="red"
            />
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-farol-ink/30" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o comercio…"
              className="w-full pl-8 pr-3 py-2 text-sm rounded border border-farol-border bg-farol-mist/50 focus:outline-none focus:ring-2 focus:ring-farol-amber/30 focus:border-farol-amber placeholder:text-farol-ink/30"
            />
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-16 rounded bg-farol-mist animate-pulse" />
              ))}
            </div>
          ) : listaFiltrada.length === 0 ? (
            <EmptyState
              icon={Users}
              title={busqueda || filtro !== 'todos' ? 'Sin resultados' : 'Todavía no hay clientes'}
              description={
                busqueda
                  ? `No se encontró "${busqueda}"`
                  : filtro === 'dormidos'
                    ? 'Ningún cliente inactivo por ahora'
                    : filtro === 'con_deuda'
                      ? 'No hay deudas pendientes'
                      : 'Creá el primero con el botón de arriba'
              }
              action={
                clientes.length === 0
                  ? <Button onClick={abrirNuevo}><UserPlus size={14} />Crear primer cliente</Button>
                  : null
              }
            />
          ) : (
            <ul>
              {listaFiltrada.map(c => (
                <ClienteRow
                  key={c.id}
                  cliente={c}
                  activo={clienteSeleccionado?.id === c.id}
                  onClick={() => setClienteSelec(
                    clienteSeleccionado?.id === c.id ? null : c
                  )}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Panel derecho: detalle ────────────────────────────────────────── */}
      {clienteSeleccionado && (
        <div className="flex-1 overflow-y-auto slide-in">
          <ClienteDetalle
            cliente={clientes.find(c => c.id === clienteSeleccionado.id) ?? clienteSeleccionado}
            onEditar={abrirEditar}
            onEliminar={handleEliminar}
            onCerrar={() => setClienteSelec(null)}
          />
        </div>
      )}

      {/* ── Modal formulario ──────────────────────────────────────────────── */}
      <Modal
        open={modalForm}
        onClose={() => !saving && setModalForm(false)}
        title={clienteEditar ? `Editar — ${clienteEditar.comercio}` : 'Nuevo cliente'}
      >
        {errorForm && (
          <div className="mb-4 px-3 py-2 rounded bg-farol-redBg text-farol-red text-sm border border-farol-red/20">
            {errorForm}
          </div>
        )}
        <ClienteForm
          inicial={clienteEditar}
          onGuardar={handleGuardar}
          onCancelar={() => setModalForm(false)}
          loading={saving}
        />
      </Modal>

      {/* ── Modal confirmación eliminar ───────────────────────────────────── */}
      <Modal
        open={!!modalConfirmar}
        onClose={() => setModalConfirmar(null)}
        title="¿Eliminar cliente?"
        size="sm"
      >
        <p className="text-sm text-farol-ink/70 mb-1">
          Vas a eliminar a{' '}
          <strong className="text-farol-ink">{modalConfirmar?.comercio}</strong>.
        </p>
        <p className="text-sm text-farol-red mb-6">
          Esta acción no se puede deshacer. Los pedidos asociados quedarán huérfanos.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalConfirmar(null)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmarEliminar} loading={saving}>
            Sí, eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// ── Subcomponentes ─────────────────────────────────────────────────────────

function ClienteRow({ cliente, activo, onClick }) {
  const waLink = cliente.telefono
    ? `https://wa.me/${cliente.telefono.replace(/\D/g, '')}`
    : null

  return (
    <li
      onClick={onClick}
      className={clsx(
        'flex items-center gap-3 px-5 py-3.5 cursor-pointer border-b border-farol-border/50',
        'hover:bg-farol-mist/60 transition-colors',
        activo && 'bg-farol-mist border-l-2 border-l-farol-amber'
      )}
    >
      {/* Inicial */}
      <div className={clsx(
        'w-9 h-9 rounded-full flex items-center justify-center text-sm font-display font-bold shrink-0',
        cliente.dormido
          ? 'bg-farol-redBg text-farol-red'
          : cliente.deuda_total > 0
            ? 'bg-farol-yellowBg text-farol-yellow'
            : 'bg-farol-mist text-farol-amber'
      )}>
        {cliente.comercio.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-farol-ink truncate">{cliente.comercio}</span>
          {cliente.dormido && <AlertTriangle size={12} className="text-farol-red shrink-0" />}
        </div>
        <p className="text-xs text-farol-ink/40 truncate">{cliente.nombre}</p>
      </div>

      {/* Deuda + WA */}
      <div className="flex items-center gap-2 shrink-0">
        {cliente.deuda_total > 0 && (
          <Badge type="pendiente">
            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cliente.deuda_total)}
          </Badge>
        )}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="p-1 rounded text-green-500 hover:bg-green-50 transition-colors"
            title="Abrir WhatsApp"
          >
            <MessageCircle size={15} />
          </a>
        )}
        <ChevronRight size={14} className="text-farol-border" />
      </div>
    </li>
  )
}

function StatChip({ label, value, sub, active, onClick, accent }) {
  const colors = {
    default: active ? 'bg-farol-amber text-white' : 'bg-farol-mist text-farol-ink hover:bg-farol-border/40',
    yellow:  active ? 'bg-farol-yellow text-white' : 'bg-farol-yellowBg text-farol-yellow hover:bg-yellow-100',
    red:     active ? 'bg-farol-red text-white'    : 'bg-farol-redBg text-farol-red hover:bg-red-100',
  }
  const color = colors[accent ?? 'default']

  return (
    <button
      onClick={onClick}
      className={clsx(
        'rounded p-2 text-left transition-colors',
        color
      )}
    >
      <div className="text-lg font-display font-bold leading-none">{value}</div>
      <div className="text-xs mt-0.5 opacity-80">{label}</div>
      {sub && <div className="text-xs font-mono opacity-70 mt-0.5">{sub}</div>}
    </button>
  )
}
