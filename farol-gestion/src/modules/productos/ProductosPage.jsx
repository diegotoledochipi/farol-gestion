import React, { useState } from 'react'
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, Calculator, Package, Layers } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { useInsumos, useProductos } from '../../hooks/useProductos.js'
import { ARS } from '../../lib/financiero.js'
import { clsx } from 'clsx'

const TIPOS_INSUMO = ['cerveza','botella','etiqueta','caja','otro']
const UNIDADES = ['unidad','kg','g','L','ml','caja','docena']

// ─── Formulario Insumo ──────────────────────────────────────────────────────
function InsumoForm({ inicial, onGuardar, onCancelar, loading }) {
  const [form, setForm] = useState(
    inicial || { nombre:'', tipo:'otro', proveedor:'', precio:'', unidad:'unidad' }
  )
  const set = k => e => setForm(f => ({...f, [k]: e.target.value}))

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre *" placeholder="Botella PET 1L" value={form.nombre} onChange={set('nombre')}/>
        <div>
          <label className="text-xs font-medium text-pipe-muted block mb-1">Tipo</label>
          <select value={form.tipo} onChange={set('tipo')}
            className="w-full rounded border border-pipe-border bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:border-pipe-blue">
            {TIPOS_INSUMO.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Proveedor" placeholder="Pepe" value={form.proveedor} onChange={set('proveedor')}/>
        <Input label="Precio actual *" placeholder="0" type="number" value={form.precio} onChange={set('precio')}/>
        <div>
          <label className="text-xs font-medium text-pipe-muted block mb-1">Unidad</label>
          <select value={form.unidad} onChange={set('unidad')}
            className="w-full rounded border border-pipe-border bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:border-pipe-blue">
            {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-pipe-border">
        <Button variant="secondary" onClick={onCancelar} disabled={loading}>Cancelar</Button>
        <Button onClick={() => onGuardar(form)} loading={loading}>
          {inicial ? 'Guardar' : 'Crear insumo'}
        </Button>
      </div>
    </div>
  )
}

// ─── Calculadora de costos ───────────────────────────────────────────────────
function CalculadoraForm({ insumos, precioVigente, onGuardar, onCancelar, loading }) {
  const [nombre, setNombre]     = useState('')
  const [margen, setMargen]     = useState(30)
  const [lineas, setLineas]     = useState([{ insumo_id:'', cantidad:1, unidad:'unidad' }])

  const agregarLinea = () => setLineas(l => [...l, { insumo_id:'', cantidad:1, unidad:'unidad' }])
  const updateLinea  = (i, k, v) => setLineas(l => l.map((x,idx) => idx===i ? {...x,[k]:v} : x))
  const quitarLinea  = (i) => setLineas(l => l.filter((_,idx) => idx!==i))

  const costo = lineas.reduce((s, l) => {
    const ins = insumos.find(x => x.id === l.insumo_id)
    if (!ins) return s
    return s + precioVigente(ins) * (parseFloat(l.cantidad) || 0)
  }, 0)
  const precioFinal = costo * (1 + (parseFloat(margen) || 0) / 100)

  const submit = () => {
    const insumosValidos = lineas
      .filter(l => l.insumo_id && l.cantidad > 0)
      .map(l => {
        const ins = insumos.find(x => x.id === l.insumo_id)
        return { insumo_id: l.insumo_id, insumo: ins, cantidad: parseFloat(l.cantidad), unidad: l.unidad }
      })
    onGuardar({ nombre, insumos: insumosValidos, margen_pct: parseFloat(margen) })
  }

  return (
    <div className="flex flex-col gap-4">
      <Input label="Nombre del producto *" placeholder="Rubia Arrabalera 1L" value={nombre} onChange={e=>setNombre(e.target.value)}/>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">Insumos</label>
          <button onClick={agregarLinea} className="flex items-center gap-1 text-xs text-pipe-blue hover:underline">
            <Plus size={12}/> Agregar insumo
          </button>
        </div>

        <div className="border border-pipe-border rounded overflow-hidden">
          <div className="grid grid-cols-[1fr_90px_90px_28px] gap-0 bg-pipe-bg px-3 py-1.5 border-b border-pipe-border text-2xs font-semibold text-pipe-faint uppercase tracking-wider">
            <span>Insumo</span><span>Cantidad</span><span>Unidad</span><span/>
          </div>
          {lineas.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_90px_90px_28px] gap-0 px-3 py-2 border-b border-pipe-border last:border-0 items-center">
              <select value={l.insumo_id} onChange={e=>updateLinea(i,'insumo_id',e.target.value)}
                className="text-sm border border-pipe-border rounded px-2 py-0.5 mr-2 focus:outline-none focus:border-pipe-blue bg-white">
                <option value="">Seleccionar…</option>
                {insumos.map(ins => (
                  <option key={ins.id} value={ins.id}>{ins.nombre} ({ARS(precioVigente(ins))})</option>
                ))}
              </select>
              <input type="number" min="0" step="0.01" value={l.cantidad}
                onChange={e=>updateLinea(i,'cantidad',e.target.value)}
                className="text-sm border border-pipe-border rounded px-2 py-0.5 mr-2 w-full focus:outline-none focus:border-pipe-blue"/>
              <select value={l.unidad} onChange={e=>updateLinea(i,'unidad',e.target.value)}
                className="text-sm border border-pipe-border rounded px-2 py-0.5 mr-2 focus:outline-none focus:border-pipe-blue bg-white">
                {UNIDADES.map(u=><option key={u} value={u}>{u}</option>)}
              </select>
              <button onClick={()=>quitarLinea(i)} className="text-pipe-faint hover:text-pipe-red"><Trash2 size={13}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* Margen y resultado */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Input label="Margen %" type="number" min="0" value={margen} onChange={e=>setMargen(e.target.value)}/>
        </div>
        <div className="rounded border border-pipe-border px-3 py-2 bg-pipe-bg">
          <p className="text-2xs text-pipe-faint uppercase tracking-wide">Costo</p>
          <p className="text-base font-semibold font-mono text-pipe-text mt-0.5">{ARS(costo)}</p>
        </div>
        <div className="rounded border border-green-300 px-3 py-2 bg-pipe-greenBg">
          <p className="text-2xs text-pipe-green uppercase tracking-wide">Precio final</p>
          <p className="text-base font-semibold font-mono text-pipe-green mt-0.5">{ARS(precioFinal)}</p>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1 border-t border-pipe-border">
        <Button variant="secondary" onClick={onCancelar} disabled={loading}>Cancelar</Button>
        <Button onClick={submit} loading={loading}>Crear producto</Button>
      </div>
    </div>
  )
}

// ─── Formulario Producto Simple ──────────────────────────────────────────────
function ProductoSimpleForm({ inicial, onGuardar, onCancelar, loading }) {
  const [form, setForm] = useState(inicial || { nombre:'', descripcion:'', precio_venta:'' })
  const set = k => e => setForm(f => ({...f,[k]:e.target.value}))
  return (
    <div className="flex flex-col gap-3">
      <Input label="Nombre *" placeholder="Promo Mundial Pack x6" value={form.nombre} onChange={set('nombre')}/>
      <Input label="Descripción" placeholder="6 unidades Rubia Arrabalera…" value={form.descripcion} onChange={set('descripcion')} textarea/>
      <Input label="Precio de venta *" type="number" placeholder="0" value={form.precio_venta} onChange={set('precio_venta')}/>
      <div className="flex justify-end gap-2 pt-1 border-t border-pipe-border">
        <Button variant="secondary" onClick={onCancelar} disabled={loading}>Cancelar</Button>
        <Button onClick={()=>onGuardar(form)} loading={loading}>{inicial?'Guardar':'Crear producto'}</Button>
      </div>
    </div>
  )
}

// ─── Página principal ────────────────────────────────────────────────────────
export default function ProductosPage() {
  const { insumos, loading: loadIns, precioVigente, crearInsumo, editarInsumo, eliminarInsumo } = useInsumos()
  const { productos, loading: loadProd, crearProductoSimple, crearProductoCompleto, editarProducto, eliminarProducto } = useProductos()

  const [modal, setModal]   = useState(null) // 'insumo'|'simple'|'calculadora'|'editInsumo'|'editProd'
  const [editItem, setEdit] = useState(null)
  const [saving, setSaving] = useState(false)
  const [seccion, setSeccion] = useState('productos') // 'productos'|'insumos'

  const handle = async (fn, ...args) => {
    setSaving(true)
    try { await fn(...args); setModal(null); setEdit(null) }
    catch(e) { alert(e.message) }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-48px)] overflow-hidden">

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-pipe-border bg-white shrink-0">
        <div className="flex rounded border border-pipe-border overflow-hidden">
          {[['productos','Productos'],['insumos','Insumos']].map(([id,label]) => (
            <button key={id} onClick={()=>setSeccion(id)}
              className={clsx('px-3 py-1.5 text-xs font-medium transition-colors',
                seccion===id ? 'bg-pipe-blue text-white' : 'bg-white text-pipe-muted hover:bg-pipe-bg')}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex-1"/>
        {seccion === 'productos' ? (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={()=>setModal('simple')}>
              <Package size={13}/> Producto simple
            </Button>
            <Button size="sm" onClick={()=>setModal('calculadora')}>
              <Calculator size={13}/> Calculadora de costos
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={()=>setModal('insumo')}>
            <Plus size={13}/> Agregar insumo
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">

        {/* ── PRODUCTOS ── */}
        {seccion === 'productos' && (
          <div className="p-4">
            {loadProd ? (
              <div className="flex flex-col gap-2">{[1,2,3].map(i=><div key={i} className="h-14 rounded bg-pipe-bg animate-pulse"/>)}</div>
            ) : productos.length === 0 ? (
              <div className="text-center py-16 text-pipe-faint text-sm">Sin productos todavía. Creá el primero.</div>
            ) : (
              <div className="border border-pipe-border rounded overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 bg-pipe-bg px-4 py-2 border-b border-pipe-border text-2xs font-semibold text-pipe-faint uppercase tracking-wider">
                  <span className="w-20">Tipo</span><span>Nombre</span><span className="w-28 text-right">Costo</span><span className="w-28 text-right">Precio</span><span className="w-16"/>
                </div>
                {productos.map((p, idx) => (
                  <div key={p.id} className={clsx('grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 px-4 py-2.5 items-center', idx<productos.length-1&&'border-b border-pipe-border', 'hover:bg-pipe-bg/50')}>
                    <span className={clsx('text-2xs font-medium px-1.5 py-0.5 rounded w-20',
                      p.tipo==='compuesto' ? 'bg-pipe-blueFaint text-pipe-blue' : 'bg-pipe-bg text-pipe-muted')}>
                      {p.tipo==='compuesto'?'Completo':'Simple'}
                    </span>
                    <div className="px-3">
                      <p className="text-sm font-medium text-pipe-text">{p.nombre}</p>
                      {p.descripcion && <p className="text-xs text-pipe-faint truncate max-w-xs">{p.descripcion}</p>}
                      {p.tipo==='compuesto' && p.margen_pct > 0 && (
                        <p className="text-xs text-pipe-faint">Margen: {p.margen_pct}%</p>
                      )}
                    </div>
                    <span className="font-mono text-sm text-pipe-muted w-28 text-right">{p.costo_unitario > 0 ? ARS(p.costo_unitario) : '—'}</span>
                    <span className="font-mono text-sm font-semibold text-pipe-text w-28 text-right">{ARS(p.precio_venta)}</span>
                    <div className="flex items-center gap-1 w-16 justify-end">
                      <button onClick={()=>{setEdit(p);setModal('editProd')}} className="p-1 text-pipe-faint hover:text-pipe-blue"><Edit2 size={13}/></button>
                      <button onClick={()=>handle(eliminarProducto, p.id)} className="p-1 text-pipe-faint hover:text-pipe-red"><Trash2 size={13}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INSUMOS ── */}
        {seccion === 'insumos' && (
          <div className="p-4">
            {loadIns ? (
              <div className="flex flex-col gap-2">{[1,2,3].map(i=><div key={i} className="h-12 rounded bg-pipe-bg animate-pulse"/>)}</div>
            ) : insumos.length === 0 ? (
              <div className="text-center py-16 text-pipe-faint text-sm">Sin insumos todavía.</div>
            ) : (
              <div className="border border-pipe-border rounded overflow-hidden">
                <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 bg-pipe-bg px-4 py-2 border-b border-pipe-border text-2xs font-semibold text-pipe-faint uppercase tracking-wider">
                  <span>Nombre</span><span className="w-24">Tipo</span><span className="w-24">Proveedor</span><span className="w-28 text-right">Precio vigente</span><span className="w-16"/>
                </div>
                {insumos.map((ins, idx) => (
                  <div key={ins.id} className={clsx('grid grid-cols-[1fr_auto_auto_auto_auto] gap-0 px-4 py-2.5 items-center', idx<insumos.length-1&&'border-b border-pipe-border', 'hover:bg-pipe-bg/50')}>
                    <p className="text-sm font-medium text-pipe-text">{ins.nombre}</p>
                    <span className="text-xs text-pipe-faint w-24">{ins.tipo}</span>
                    <span className="text-xs text-pipe-faint w-24">{ins.proveedor || '—'}</span>
                    <span className="font-mono text-sm font-semibold text-pipe-text w-28 text-right">{ARS(precioVigente(ins))}</span>
                    <div className="flex items-center gap-1 w-16 justify-end">
                      <button onClick={()=>{setEdit(ins);setModal('editInsumo')}} className="p-1 text-pipe-faint hover:text-pipe-blue"><Edit2 size={13}/></button>
                      <button onClick={()=>handle(eliminarInsumo, ins.id)} className="p-1 text-pipe-faint hover:text-pipe-red"><Trash2 size={13}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <Modal open={modal==='insumo'} onClose={()=>setModal(null)} title="Nuevo insumo">
        <InsumoForm onGuardar={f=>handle(crearInsumo,f)} onCancelar={()=>setModal(null)} loading={saving}/>
      </Modal>
      <Modal open={modal==='editInsumo'} onClose={()=>{setModal(null);setEdit(null)}} title={`Editar — ${editItem?.nombre}`}>
        <InsumoForm inicial={editItem ? {...editItem, precio: precioVigente(editItem)} : null}
          onGuardar={f=>handle(editarInsumo, editItem.id, f)} onCancelar={()=>{setModal(null);setEdit(null)}} loading={saving}/>
      </Modal>
      <Modal open={modal==='simple'} onClose={()=>setModal(null)} title="Nuevo producto simple">
        <ProductoSimpleForm onGuardar={f=>handle(crearProductoSimple,f)} onCancelar={()=>setModal(null)} loading={saving}/>
      </Modal>
      <Modal open={modal==='editProd'} onClose={()=>{setModal(null);setEdit(null)}} title={`Editar — ${editItem?.nombre}`} size="lg">
        <ProductoSimpleForm inicial={editItem ? {...editItem, precio_venta: editItem.precio_venta} : null}
          onGuardar={f=>handle(editarProducto, editItem.id, {nombre:f.nombre, descripcion:f.descripcion, precio_venta:parseFloat(f.precio_venta)})}
          onCancelar={()=>{setModal(null);setEdit(null)}} loading={saving}/>
      </Modal>
      <Modal open={modal==='calculadora'} onClose={()=>setModal(null)} title="Calculadora de costos" size="lg">
        <CalculadoraForm insumos={insumos} precioVigente={precioVigente}
          onGuardar={f=>handle(crearProductoCompleto,f)} onCancelar={()=>setModal(null)} loading={saving}/>
      </Modal>
    </div>
  )
}
