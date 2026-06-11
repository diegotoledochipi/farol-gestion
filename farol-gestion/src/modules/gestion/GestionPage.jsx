import React, { useState, useMemo } from 'react'
import { TrendingUp, Users, AlertTriangle, DollarSign, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { usePedidos } from '../../hooks/usePedidos.js'
import { useGastos } from '../../hooks/useGastos.js'
import { calcularPeriodo, calcularReembolsos, SOCIOS, ARS } from '../../lib/financiero.js'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import { supabase } from '../../supabaseClient.js'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { clsx } from 'clsx'

// ─── Hook pagos socios ───────────────────────────────────────────────────────
function usePagosSocios() {
  const [pagos, setPagos] = useState([])

  const fetch = async () => {
    const { data } = await supabase.from('pago_socio').select('*').order('fecha', { ascending: false })
    setPagos(data || [])
  }

  React.useEffect(() => { fetch() }, [])

  const registrarPago = async ({ socio_id, monto, nota, fecha }) => {
    await supabase.from('pago_socio').insert([{ socio_id, monto, nota, fecha }])
    await fetch()
  }

  return { pagos, registrarPago, refetch: fetch }
}

// ─── Tarjeta KPI ─────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color = 'default' }) {
  const colors = {
    default: 'bg-white border-pipe-border',
    green:   'bg-pipe-greenBg border-green-200',
    yellow:  'bg-pipe-yellowBg border-yellow-200',
    red:     'bg-pipe-redBg border-red-200',
    blue:    'bg-pipe-blueFaint border-blue-200',
  }
  return (
    <div className={clsx('rounded-lg border px-4 py-3', colors[color])}>
      <p className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">{label}</p>
      <p className="text-xl font-semibold font-mono text-pipe-text mt-1">{value}</p>
      {sub && <p className="text-xs text-pipe-faint mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Balance de socio ────────────────────────────────────────────────────────
function BalanceSocio({ socio, ganancia, reembolso, pagosRecibidos, onPagar }) {
  const totalCobrar  = ganancia + reembolso
  const totalRecibido = pagosRecibidos.reduce((s, p) => s + p.monto, 0)
  const saldo = totalCobrar - totalRecibido
  const [abierto, setAbierto] = useState(false)

  return (
    <div className={clsx('rounded-lg border overflow-hidden',
      saldo > 0 ? 'border-pipe-border' : 'border-green-200')}>
      <div className="flex items-center justify-between px-4 py-3 bg-white">
        <div className="flex items-center gap-3">
          <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
            'bg-pipe-blueFaint text-pipe-blue')}>
            {socio.nombre.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-pipe-text">{socio.nombre}</p>
            <p className="text-xs text-pipe-faint">{socio.pct}% · Saldo: <span className={clsx('font-mono font-semibold', saldo > 0 ? 'text-pipe-yellow' : 'text-pipe-green')}>{ARS(saldo)}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-pipe-faint">Ganancia + reembolso</p>
            <p className="font-mono text-sm font-semibold text-pipe-text">{ARS(totalCobrar)}</p>
          </div>
          <Button size="sm" variant="secondary" onClick={() => onPagar(socio)}>
            <Plus size={12}/> Registrar pago
          </Button>
          <button onClick={() => setAbierto(a => !a)} className="text-pipe-faint hover:text-pipe-text">
            {abierto ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
          </button>
        </div>
      </div>

      {abierto && (
        <div className="border-t border-pipe-border bg-pipe-bg px-4 py-3">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="rounded border border-pipe-border bg-white px-3 py-2">
              <p className="text-2xs text-pipe-faint uppercase">Ganancia</p>
              <p className="font-mono text-sm font-semibold text-pipe-text">{ARS(ganancia)}</p>
            </div>
            <div className="rounded border border-pipe-border bg-white px-3 py-2">
              <p className="text-2xs text-pipe-faint uppercase">Reembolso gastos</p>
              <p className="font-mono text-sm font-semibold text-pipe-yellow">{ARS(reembolso)}</p>
            </div>
            <div className="rounded border border-pipe-border bg-white px-3 py-2">
              <p className="text-2xs text-pipe-faint uppercase">Ya recibió</p>
              <p className="font-mono text-sm font-semibold text-pipe-green">{ARS(totalRecibido)}</p>
            </div>
          </div>

          {pagosRecibidos.length > 0 && (
            <div>
              <p className="text-2xs font-semibold text-pipe-faint uppercase tracking-wider mb-2">Historial de pagos</p>
              <div className="flex flex-col gap-1">
                {pagosRecibidos.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-xs text-pipe-muted">
                    <span>{format(new Date(p.fecha), "d MMM yyyy", { locale: es })}</span>
                    {p.nota && <span className="text-pipe-faint italic">{p.nota}</span>}
                    <span className="font-mono font-semibold text-pipe-green">{ARS(p.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Modal registrar pago ────────────────────────────────────────────────────
function PagoModal({ socio, open, onClose, onGuardar }) {
  const [monto, setMonto] = useState('')
  const [nota, setNota]   = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  return (
    <Modal open={open} onClose={onClose} title={`Registrar pago — ${socio?.nombre}`} size="sm">
      <div className="flex flex-col gap-3">
        <Input label="Monto" type="number" value={monto} onChange={e=>setMonto(e.target.value)} placeholder="0"/>
        <Input label="Nota (opcional)" value={nota} onChange={e=>setNota(e.target.value)} placeholder="Transferencia, efectivo…"/>
        <Input label="Fecha" type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/>
        <div className="flex justify-end gap-2 pt-1 border-t border-pipe-border">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onGuardar({ monto: parseFloat(monto), nota, fecha })}>Registrar</Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function GestionPage() {
  const { pedidos, loading: loadP } = usePedidos()
  const { gastos,  loading: loadG } = useGastos()
  const { pagos, registrarPago }    = usePagosSocios()

  const [socioModal, setSocioModal] = useState(null)
  const [saving, setSaving]         = useState(false)

  // Período: mes actual
  const hoy       = new Date()
  const inicioMes = startOfMonth(hoy)
  const finMes    = endOfMonth(hoy)
  const mesLabel  = format(hoy, "MMMM yyyy", { locale: es })

  const pedidosMes = pedidos.filter(p => {
    const f = new Date(p.fecha_pedido)
    return f >= inicioMes && f <= finMes
  })

  const gastosMesPagados = gastos.filter(g => {
    if (g.estado_pago === 'no_pagado') return false
    if (g.tipo === 'fijo') return true
    const f = new Date(g.fecha)
    return f >= inicioMes && f <= finMes
  })

  const gastosNoPagados = gastos.filter(g => g.estado_pago === 'no_pagado')
  const totalDeuda      = gastosNoPagados.reduce((s, g) => s + g.monto, 0)

  const periodo = useMemo(() =>
    calcularPeriodo(pedidosMes, gastosMesPagados),
    [pedidosMes, gastosMesPagados]
  )

  const reembolsos = useMemo(() =>
    calcularReembolsos(gastosMesPagados),
    [gastosMesPagados]
  )

  const pagosPorSocio = (socioId) =>
    pagos.filter(p => p.socio_id === socioId && new Date(p.fecha) >= inicioMes && new Date(p.fecha) <= finMes)

  const handlePago = async (form) => {
    setSaving(true)
    try {
      await registrarPago({ socio_id: socioModal.id, ...form })
      setSocioModal(null)
    } catch(e) { alert(e.message) }
    finally { setSaving(false) }
  }

  // Ranking de productos del mes
  const rankingProductos = useMemo(() => {
    const map = {}
    pedidosMes
      .filter(p => p.estado_entrega !== 'cancelado')
      .forEach(p => {
        (p.pedido_item || []).forEach(it => {
          const nombre = it.producto?.nombre || 'Desconocido'
          if (!map[nombre]) map[nombre] = { nombre, cantidad: 0, facturado: 0 }
          map[nombre].cantidad  += it.cantidad
          map[nombre].facturado += it.subtotal || (it.cantidad * it.precio_unitario)
        })
      })
    return Object.values(map).sort((a, b) => b.cantidad - a.cantidad)
  }, [pedidosMes])

  const loading = loadP || loadG

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-y-auto scrollbar-thin">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-pipe-border bg-white sticky top-0 z-10">
        <h1 className="text-base font-semibold text-pipe-text">Gestión</h1>
        <span className="text-xs text-pipe-faint px-2 py-1 rounded bg-pipe-bg border border-pipe-border capitalize">{mesLabel}</span>
      </div>

      <div className="p-4 flex flex-col gap-5">

        {/* Alerta deudas */}
        {gastosNoPagados.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-pipe-redBg border-2 border-pipe-red">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-pipe-red"/>
              <div>
                <p className="text-sm font-semibold text-pipe-red">Deudas pendientes sin pagar</p>
                <p className="text-xs text-red-500">{gastosNoPagados.length} gasto{gastosNoPagados.length>1?'s':''} · Estos montos NO están incluidos en el cálculo de ganancias</p>
              </div>
            </div>
            <span className="font-mono font-bold text-pipe-red text-lg">{ARS(totalDeuda)}</span>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI label="Ventas cobradas" value={ARS(periodo.ventasCobradas)} sub={`${periodo.pedidosCobrados} pedidos cobrados`} color="green"/>
          <KPI label="Plata en la calle" value={ARS(periodo.totalPendienteCobro)} sub={`${periodo.pedidosPendientes} pedidos pendientes`} color="yellow"/>
          <KPI label="No cobrable" value={ARS(pedidosMes.filter(p=>p.estado_cobro==='no_paga').reduce((s,p)=>s+p.total,0))} sub={`${periodo.pedidosNoPaga} pedidos`} color="red"/>
          <KPI label="Gastos del mes" value={ARS(periodo.totalGastos)} sub="Solo gastos pagados" color="default"/>
        </div>

        {/* Cadena de cálculo */}
        <div className="rounded-lg border border-pipe-border overflow-hidden">
          <div className="px-4 py-2.5 bg-pipe-bg border-b border-pipe-border">
            <span className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">Cadena de cálculo — {mesLabel}</span>
          </div>
          <div className="p-4 flex flex-col gap-2">
            {[
              { label: 'Ventas cobradas',    value: periodo.ventasCobradas,    op: null,   color: 'text-pipe-text' },
              { label: 'Costo de mercadería',value: periodo.costoMercaderia,   op: '−',    color: 'text-pipe-muted' },
              { label: 'Margen bruto',       value: periodo.margenBruto,       op: '=',    color: 'text-pipe-text font-semibold', sep: true },
              { label: 'Gastos pagados',     value: periodo.totalGastos,       op: '−',    color: 'text-pipe-muted' },
              { label: 'Utilidad neta',      value: periodo.utilidadNeta,      op: '=',    color: 'text-pipe-text font-semibold', sep: true },
              { label: 'Reserva (10%)',       value: periodo.reserva,           op: '−',    color: 'text-pipe-blue' },
              { label: 'A repartir',         value: periodo.montoRepartir,     op: '=',    color: 'text-pipe-green font-bold text-base', sep: true },
            ].map((row, i) => (
              <div key={i}>
                {row.sep && <div className="border-t border-pipe-border my-1"/>}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {row.op && <span className="text-pipe-faint w-4 text-sm font-mono">{row.op}</span>}
                    {!row.op && <span className="w-4"/>}
                    <span className={clsx('text-sm', row.color)}>{row.label}</span>
                  </div>
                  <span className={clsx('font-mono text-sm', row.color)}>{ARS(row.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reparto */}
        <div className="rounded-lg border border-pipe-border overflow-hidden">
          <div className="px-4 py-2.5 bg-pipe-bg border-b border-pipe-border">
            <span className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">Reparto entre socios</span>
          </div>
          <div className="divide-y divide-pipe-border">
            {periodo.reparto.map(s => (
              <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-pipe-blueFaint flex items-center justify-center text-xs font-bold text-pipe-blue">
                    {s.nombre.charAt(0)}
                  </div>
                  <span className="text-sm font-medium text-pipe-text">{s.nombre}</span>
                  <span className="text-xs text-pipe-faint">{s.pct}%</span>
                </div>
                <span className="font-mono text-sm font-semibold text-pipe-text">{ARS(s.monto)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Balance socios */}
        <div>
          <p className="text-xs font-semibold text-pipe-muted uppercase tracking-wider mb-3">Balance de socios</p>
          <div className="flex flex-col gap-3">
            {SOCIOS.map(socio => {
              const repartoPct = periodo.reparto.find(r => r.id === socio.id)
              return (
                <BalanceSocio
                  key={socio.id}
                  socio={socio}
                  ganancia={repartoPct?.monto || 0}
                  reembolso={reembolsos[socio.id] || 0}
                  pagosRecibidos={pagosPorSocio(socio.id)}
                  onPagar={s => setSocioModal(s)}
                />
              )
            })}
          </div>
        </div>

        {/* Ranking productos */}
        {rankingProductos.length > 0 && (
          <div className="rounded-lg border border-pipe-border overflow-hidden">
            <div className="px-4 py-2.5 bg-pipe-bg border-b border-pipe-border">
              <span className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">Ranking de productos — {mesLabel}</span>
            </div>
            <div className="divide-y divide-pipe-border">
              {rankingProductos.map((p, i) => (
                <div key={p.nombre} className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-pipe-faint w-5">#{i+1}</span>
                    <span className="text-sm font-medium text-pipe-text">{p.nombre}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-pipe-faint">{p.cantidad} unidades</span>
                    <span className="font-mono text-sm font-semibold text-pipe-text">{ARS(p.facturado)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal pago */}
      <PagoModal
        socio={socioModal}
        open={!!socioModal}
        onClose={() => setSocioModal(null)}
        onGuardar={handlePago}
      />
    </div>
  )
}
