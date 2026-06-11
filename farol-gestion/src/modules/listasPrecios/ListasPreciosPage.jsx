import React, { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, FileDown, X } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { supabase } from '../../supabaseClient.js'
import { useProductos } from '../../hooks/useProductos.js'
import { ARS } from '../../lib/financiero.js'
import { clsx } from 'clsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

function useListas() {
  const [listas, setListas]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('lista_precios')
      .select(`*, items:lista_precios_item(*, producto:producto_id(id,nombre,precio_venta,costo_unitario))`)
      .eq('activa', true)
      .order('created_at', { ascending: false })
    setListas(data || [])
    setLoading(false)
  }
  useEffect(() => { fetch() }, [])

  const crearLista = async (nombre) => {
    const { data, error } = await supabase.from('lista_precios').insert([{ nombre }]).select().single()
    if (error) throw error
    await fetch()
    return data
  }

  const agregarItem = async (lista_id, producto_id, precio) => {
    const { error } = await supabase.from('lista_precios_item')
      .upsert([{ lista_id, producto_id, precio }], { onConflict: 'lista_id,producto_id' })
    if (error) throw error
    await fetch()
  }

  const editarItem = async (id, precio) => {
    await supabase.from('lista_precios_item').update({ precio }).eq('id', id)
    await fetch()
  }

  const quitarItem = async (id) => {
    await supabase.from('lista_precios_item').delete().eq('id', id)
    await fetch()
  }

  const eliminarLista = async (id) => {
    await supabase.from('lista_precios').update({ activa: false }).eq('id', id)
    await fetch()
  }

  return { listas, loading, crearLista, agregarItem, editarItem, quitarItem, eliminarLista, refetch: fetch }
}

function exportarPDF(lista) {
  // Generamos HTML y lo imprimimos via window.print()
  const fecha = format(new Date(), "d 'de' MMMM yyyy", { locale: es })
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8"/>
      <title>Lista de Precios — Farol</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1d23; padding: 40px; }
        .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1a1d23; padding-bottom: 16px; }
        .marca { font-size: 28px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
        .subtitulo { font-size: 14px; color: #6b7280; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
        .lista-nombre { font-size: 18px; font-weight: 600; margin-top: 8px; }
        .fecha { font-size: 12px; color: #9ca3af; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; border-bottom: 1px solid #e4e6ea; padding: 8px 12px; }
        th.right { text-align: right; }
        td { padding: 10px 12px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
        td.right { text-align: right; font-family: monospace; font-weight: 600; }
        .num { color: #9ca3af; font-size: 12px; }
        .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #9ca3af; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="marca">Farol Buenos Aires</div>
        <div class="subtitulo">Cerveza Artesanal</div>
        <div class="lista-nombre">${lista.nombre}</div>
        <div class="fecha">Lista de precios · Emitida el ${fecha}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Producto</th>
            <th class="right">Precio</th>
          </tr>
        </thead>
        <tbody>
          ${(lista.items || []).map((it, i) => `
            <tr>
              <td class="num">${i + 1}</td>
              <td>${it.producto?.nombre || '—'}</td>
              <td class="right">${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(it.precio)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <div class="footer">Farol Argentina · precios sujetos a cambio sin previo aviso</div>
    </body>
    </html>
  `
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.onload = () => { win.print() }
}

export default function ListasPreciosPage() {
  const { listas, loading, crearLista, agregarItem, editarItem, quitarItem, eliminarLista } = useListas()
  const { productos } = useProductos()

  const [listaActiva, setListaActiva] = useState(null)
  const [modalNueva, setModalNueva]   = useState(false)
  const [nombreNueva, setNombreNueva] = useState('')
  const [saving, setSaving]           = useState(false)
  const [addProdId, setAddProdId]     = useState('')
  const [addPrecio, setAddPrecio]     = useState('')

  const lista = listas.find(l => l.id === listaActiva)

  const handle = async (fn, ...args) => {
    setSaving(true)
    try { await fn(...args) }
    catch(e) { alert(e.message) }
    finally { setSaving(false) }
  }

  const prodDisponibles = productos.filter(p =>
    !(lista?.items || []).find(it => it.producto_id === p.id)
  )

  const agregarProd = async () => {
    if (!addProdId || !addPrecio) return
    await handle(agregarItem, listaActiva, addProdId, parseFloat(addPrecio))
    setAddProdId(''); setAddPrecio('')
  }

  return (
    <div className="flex h-[calc(100vh-48px)]">

      {/* Sidebar listas */}
      <div className="w-56 border-r border-pipe-border bg-white flex flex-col shrink-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-pipe-border">
          <span className="text-xs font-semibold text-pipe-muted uppercase tracking-wider">Listas</span>
          <button onClick={() => setModalNueva(true)}
            className="p-1 rounded text-pipe-faint hover:text-pipe-blue hover:bg-pipe-blueFaint">
            <Plus size={14}/>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? <div className="p-3"><div className="h-8 bg-pipe-bg rounded animate-pulse"/></div>
          : listas.length === 0 ? <p className="text-xs text-pipe-faint text-center py-8">Sin listas</p>
          : listas.map(l => (
            <button key={l.id} onClick={() => setListaActiva(l.id)}
              className={clsx('w-full text-left px-3 py-2.5 text-sm border-b border-pipe-border transition-colors',
                listaActiva===l.id ? 'bg-pipe-blueFaint text-pipe-blue font-medium' : 'text-pipe-text hover:bg-pipe-bg')}>
              {l.nombre}
              <span className="text-xs text-pipe-faint block">{(l.items||[]).length} productos</span>
            </button>
          ))}
        </div>
      </div>

      {/* Contenido lista */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!lista ? (
          <div className="flex items-center justify-center h-full text-pipe-faint text-sm">
            Seleccioná una lista o creá una nueva
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-pipe-text">{lista.nombre}</h2>
                <p className="text-xs text-pipe-faint">{(lista.items||[]).length} productos</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => exportarPDF(lista)}>
                  <FileDown size={13}/> Exportar PDF
                </Button>
                <Button variant="danger" size="sm" onClick={() => handle(eliminarLista, lista.id)}>
                  <Trash2 size={13}/> Eliminar lista
                </Button>
              </div>
            </div>

            {/* Agregar producto */}
            <div className="flex items-end gap-2 mb-4 p-3 rounded border border-pipe-border bg-pipe-bg">
              <div className="flex-1">
                <label className="text-xs font-medium text-pipe-muted block mb-1">Agregar producto</label>
                <select value={addProdId} onChange={e => { setAddProdId(e.target.value); const p = productos.find(x=>x.id===e.target.value); if(p) setAddPrecio(p.precio_venta||'') }}
                  className="w-full rounded border border-pipe-border bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:border-pipe-blue">
                  <option value="">Seleccionar producto…</option>
                  {prodDisponibles.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="w-36">
                <label className="text-xs font-medium text-pipe-muted block mb-1">Precio</label>
                <input type="number" value={addPrecio} onChange={e=>setAddPrecio(e.target.value)}
                  placeholder="0" className="w-full rounded border border-pipe-border bg-white px-2.5 py-1.5 text-sm focus:outline-none focus:border-pipe-blue"/>
              </div>
              <Button size="sm" onClick={agregarProd} loading={saving}><Plus size={13}/> Agregar</Button>
            </div>

            {/* Tabla */}
            {(lista.items||[]).length === 0 ? (
              <p className="text-sm text-pipe-faint text-center py-8">Sin productos en esta lista</p>
            ) : (
              <div className="border border-pipe-border rounded overflow-hidden">
                <div className="grid grid-cols-[1fr_160px_40px] bg-pipe-bg px-4 py-2 border-b border-pipe-border text-2xs font-semibold text-pipe-faint uppercase tracking-wider">
                  <span>Producto</span><span className="text-right">Precio</span><span/>
                </div>
                {(lista.items||[]).map((it, idx) => (
                  <div key={it.id} className={clsx('grid grid-cols-[1fr_160px_40px] px-4 py-2.5 items-center', idx<lista.items.length-1&&'border-b border-pipe-border', 'hover:bg-pipe-bg/50')}>
                    <span className="text-sm text-pipe-text">{it.producto?.nombre}</span>
                    <div className="flex items-center justify-end gap-2">
                      <input type="number" value={it.precio}
                        onChange={e => handle(editarItem, it.id, parseFloat(e.target.value))}
                        className="w-28 text-right font-mono text-sm font-semibold border border-pipe-border rounded px-2 py-0.5 focus:outline-none focus:border-pipe-blue"/>
                    </div>
                    <button onClick={() => handle(quitarItem, it.id)} className="ml-2 text-pipe-faint hover:text-pipe-red"><X size={13}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal nueva lista */}
      <Modal open={modalNueva} onClose={() => setModalNueva(false)} title="Nueva lista de precios" size="sm">
        <Input label="Nombre de la lista" placeholder="Mayorista · Pizzerías · Lanzamiento…"
          value={nombreNueva} onChange={e => setNombreNueva(e.target.value)}/>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" onClick={() => setModalNueva(false)}>Cancelar</Button>
          <Button loading={saving} onClick={async () => {
            if (!nombreNueva.trim()) return
            setSaving(true)
            const l = await crearLista(nombreNueva.trim())
            setListaActiva(l.id); setModalNueva(false); setNombreNueva('')
            setSaving(false)
          }}>Crear</Button>
        </div>
      </Modal>
    </div>
  )
}
