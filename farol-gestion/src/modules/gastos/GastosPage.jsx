import React, { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { useGastos } from '../../hooks/useGastos.js'
import { ARS } from '../../lib/financiero.js'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const CATEGORIAS  = ['pauta','combustible','peaje','servicios','otro']
const PAGADO_POR  = [
  { value: 'caja_farol', label: 'Caja Farol' },
  { value: 'pepe',       label: 'Pepe' },
  { value: 'nahuel',     label: 'Nahuel' },
  { value: 'mica_diego', label: 'Mica · Diego' },
  { value: 'no_pagado',  label: 'No pagado' },
]
const fmt = d => d ? format(new Date(d), "d MMM yyyy", { locale: es }) : '—'

function GastoForm({ inicial, tipo, onGuardar, onCancelar, loading }) {
  const [form, setForm] = useState(inicial || {
    descripcion:'', monto:'', categoria:'otro',
    fecha: new Date().toISOString().split('T')[0],
    estado_pago:'pagado', fecha_vencimiento:'', pagado_por:'caja_farol',
  })
  const set = k => e => setForm(f => ({...f,[k]:e.target.value}))

  return (
    <div className="flex flex-col gap-3">
      <Input label="Descripción *" placeholder="Meta Ads, combustible, peajes…" value={form.descripcion} onChange={set('descripcion')}/>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Monto *" type="number" placeholder="0" value={form.monto} onChange={set('monto')}/>
        <div>
          <label className="text-xs font-medium text-pipe-muted block mb-1">Categoría</label>
          <select value={form.categoria} onChange={set('categoria')}
            className="w-full rounded border border-pipe-border bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:border-pipe-blue">
            {CATEGORIAS.map(c=><option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Fecha" type="date" value={form.fecha} onChange={set('fecha')}/>
        <div>
          <label className="text-xs font-medium text-pipe-muted block mb-1">Pagado por</label>
          <select value={form.pagado_por} onChange={set('pagado_por')}
            className="w-full rounded border border-pipe-border bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:border-pipe-blue">
            {PAGADO_POR.map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
      </div>
      {form.pagado_por === 'no_pagado' && (
        <Input label="Fecha de vencimiento" type="date" value={form.fecha_vencimiento} onChange={set('fecha_vencimiento')}/>
      )}
      <div className="flex justify-end gap-2 pt-1 border-t border-pipe-border">
        <Button variant="secondary" onClick={onCancelar} disabled={loading}>Cancelar</Button>
        <Button onClick={()=>onGuardar({...form, tipo, estado_pago: form.pagado_por==='no_pagado'?'no_pagado':'pagado'})} loading={loading}>
          {inicial?'Guardar':'Crear gasto'}
        </Button>
      </div>
    </div>
  )
}

function MarcarPagadoModal({ gasto, open, onClose, onPagar }) {
  const [pagadoPor, setPagadoPor] = useState('caja_farol')
  if (!gasto) return null
  return (
    <Modal open={open} onClose={onClose} title="Marcar como pagado" size="sm">
      <p className="text-sm text-pipe-muted mb-3">
        <strong>{gasto.descripcion}</strong> · {ARS(gasto.monto)}
      </p>
      <div>
        <label className="text-xs font-medium text-pipe-muted block mb-1">¿Quién lo pagó?</label>
        <select value={pagadoPor} onChange={e=>setPagadoPor(e.target.value)}
          className="w-full rounded border border-pipe-border bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:border-pipe-blue">
          {PAGADO_POR.filter(p=>p.value!=='no_pagado').map(p=><option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={()=>onPagar(gasto.id, pagadoPor)}>Confirmar pago</Button>
      </div>
    </Modal>
  )
}

function FilaGasto({ gasto, onEditar, onEliminar, onMarcarPagado }) {
  const noPagado = gasto.estado_pago === 'no_pagado'
  const pagadoPorLabel = PAGADO_POR.find(p=>p.value===gasto.pagado_por)?.label || gasto.pagado_por

  return (
    <div className={clsx(
      'grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-0 px-4 py-2.5 items-center border-b border-pipe-border last:border-0',
      noPagado ? 'bg-pipe-redBg/40' : 'hover:bg-pipe-bg/50'
    )}>
      <div>
        <div className="flex items-center gap-2">
          {noPagado && <AlertTriangle size={13} className="text-pipe-red shrink-0"/>}
          <p className="text-sm font-medium text-pipe-text">{gasto.descripcion}</p>
        </div>
        <p className="text-xs text-pipe-faint">{gasto.categoria} · {fmt(gasto.fecha)}</p>
      </div>
      <span className={clsx('text-xs px-2 py-0.5 rounded font-medium mr-3 w-20 text-center',
        noPagado ? 'bg-pipe-redBg text-pipe-red border border-red-200'
        : gasto.pagado_por !== 'caja_farol' ? 'bg-pipe-yellowBg text-pipe-yellow border border-yellow-200'
        : 'bg-pipe-greenBg text-pipe-green border border-green-200')}>
        {noPagado ? 'Sin pagar' : pagadoPorLabel}
      </span>
      <span className="font-mono text-sm font-semibold text-pipe-text w-28 text-right mr-3">{ARS(gasto.monto)}</span>
      {noPagado ? (
        <button onClick={()=>onMarcarPagado(gasto)}
          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-pipe-greenBg text-pipe-green border border-green-200 hover:bg-green-100 mr-2">
          <CheckCircle size={12}/> Marcar pagado
        </button>
      ) : <span className="w-28 mr-2"/>}
      <button onClick={()=>onEditar(gasto)} className="p-1 text-pipe-faint hover:text-pipe-blue mr-1"><Edit2 size={13}/></button>
      <button onClick={()=>onEliminar(gasto)} className="p-1 text-pipe-faint hover:text-pipe-red"><Trash2 size={13}/></button>
    </div>
  )
}

export default function GastosPage() {
  const { gastos, loading, crearGasto, editarGasto, marcarPagado, eliminarGasto } = useGastos()

  const [modal, setModal]         = useState(null) // 'fijo'|'variable'|'editar'|'pagar'
  const [editItem, setEditItem]   = useState(null)
  const [saving, setSaving]       = useState(false)

  const noPagados = gastos.filter(g => g.estado_pago === 'no_pagado')
  const fijos     = gastos.filter(g => g.tipo === 'fijo' && g.estado_pago !== 'no_pagado')
  const variables = useMemo(() => {
    const hoy = new Date()
    return gastos.filter(g => {
      if (g.tipo !== 'variable' || g.estado_pago === 'no_pagado') return false
      const f = new Date(g.fecha)
      return f.getMonth() === hoy.getMonth() && f.getFullYear() === hoy.getFullYear()
    })
  }, [gastos])

  const totalNoPagado = noPagados.reduce((s,g)=>s+g.monto,0)
  const totalFijos    = fijos.reduce((s,g)=>s+g.monto,0)
  const totalVars     = variables.reduce((s,g)=>s+g.monto,0)

  const handle = async (fn,...args) => {
    setSaving(true)
    try { await fn(...args); setModal(null); setEditItem(null) }
    catch(e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const mesActual = format(new Date(), "MMMM yyyy", { locale: es })

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-y-auto scrollbar-thin">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-pipe-border bg-white sticky top-0 z-10">
        <h1 className="text-base font-semibold text-pipe-text">Gastos</h1>
        <div className="flex-1"/>
        <Button variant="secondary" size="sm" onClick={()=>setModal('variable')}>
          <Plus size={13}/> Gasto variable
        </Button>
        <Button size="sm" onClick={()=>setModal('fijo')}>
          <Plus size={13}/> Gasto fijo
        </Button>
      </div>

      <div className="p-4 flex flex-col gap-5">

        {/* Deudas pendientes */}
        {noPagados.length > 0 && (
          <div className="rounded-lg border-2 border-pipe-red bg-pipe-redBg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-red-200">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-pipe-red"/>
                <span className="text-sm font-semibold text-pipe-red">Deudas pendientes — {noPagados.length} gasto{noPagados.length>1?'s':''}</span>
              </div>
              <span className="font-mono font-bold text-pipe-red text-base">{ARS(totalNoPagado)}</span>
            </div>
            {noPagados.map((g,idx) => (
              <FilaGasto key={g.id} gasto={g}
                onEditar={g=>{setEditItem(g);setModal('editar')}}
                onEliminar={g=>handle(eliminarGasto,g.id)}
                onMarcarPagado={g=>{setEditItem(g);setModal('pagar')}}/>
            ))}
          </div>
        )}

        {/* Gastos fijos */}
        <div className="rounded-lg border border-pipe-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-pipe-bg border-b border-pipe-border">
            <span className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">Gastos fijos (todos los meses)</span>
            <span className="font-mono text-sm font-semibold text-pipe-muted">{ARS(totalFijos)}</span>
          </div>
          {fijos.length === 0
            ? <p className="text-sm text-pipe-faint text-center py-6">Sin gastos fijos</p>
            : fijos.map(g => (
              <FilaGasto key={g.id} gasto={g}
                onEditar={g=>{setEditItem(g);setModal('editar')}}
                onEliminar={g=>handle(eliminarGasto,g.id)}
                onMarcarPagado={g=>{setEditItem(g);setModal('pagar')}}/>
            ))
          }
        </div>

        {/* Gastos variables del mes */}
        <div className="rounded-lg border border-pipe-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 bg-pipe-bg border-b border-pipe-border">
            <span className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">Gastos variables — {mesActual}</span>
            <span className="font-mono text-sm font-semibold text-pipe-muted">{ARS(totalVars)}</span>
          </div>
          {variables.length === 0
            ? <p className="text-sm text-pipe-faint text-center py-6">Sin gastos variables este mes</p>
            : variables.map(g => (
              <FilaGasto key={g.id} gasto={g}
                onEditar={g=>{setEditItem(g);setModal('editar')}}
                onEliminar={g=>handle(eliminarGasto,g.id)}
                onMarcarPagado={g=>{setEditItem(g);setModal('pagar')}}/>
            ))
          }
        </div>
      </div>

      {/* Modales */}
      <Modal open={modal==='fijo'} onClose={()=>setModal(null)} title="Nuevo gasto fijo">
        <GastoForm tipo="fijo" onGuardar={f=>handle(crearGasto,f)} onCancelar={()=>setModal(null)} loading={saving}/>
      </Modal>
      <Modal open={modal==='variable'} onClose={()=>setModal(null)} title="Nuevo gasto variable">
        <GastoForm tipo="variable" onGuardar={f=>handle(crearGasto,f)} onCancelar={()=>setModal(null)} loading={saving}/>
      </Modal>
      <Modal open={modal==='editar'} onClose={()=>{setModal(null);setEditItem(null)}} title={`Editar — ${editItem?.descripcion}`}>
        <GastoForm inicial={editItem} tipo={editItem?.tipo||'variable'}
          onGuardar={f=>handle(editarGasto, editItem.id, f)} onCancelar={()=>{setModal(null);setEditItem(null)}} loading={saving}/>
      </Modal>
      <MarcarPagadoModal gasto={editItem} open={modal==='pagar'}
        onClose={()=>{setModal(null);setEditItem(null)}}
        onPagar={(id,por)=>handle(marcarPagado,id,por)}/>
    </div>
  )
}
