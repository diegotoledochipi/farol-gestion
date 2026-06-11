import React, { useState, useEffect } from 'react'
import Modal from '../../components/ui/Modal.jsx'
import Button from '../../components/ui/Button.jsx'
import Input from '../../components/ui/Input.jsx'
import { Plus, Trash2, Search } from 'lucide-react'
import { ARS } from '../../lib/financiero.js'

export default function NuevoPedidoModal({ open, onClose, onGuardar, clientes, productos, loading }) {
  const [clienteId, setClienteId]   = useState('')
  const [items, setItems]           = useState([])
  const [aclaraciones, setAclar]    = useState('')
  const [busqCliente, setBusqC]     = useState('')
  const [busqProd, setBusqP]        = useState('')
  const [errores, setErrores]       = useState({})

  useEffect(() => {
    if (!open) { setClienteId(''); setItems([]); setAclar(''); setBusqC(''); setBusqP(''); setErrores({}) }
  }, [open])

  const clientesFiltrados = clientes.filter(c =>
    c.comercio.toLowerCase().includes(busqCliente.toLowerCase()) ||
    c.nombre.toLowerCase().includes(busqCliente.toLowerCase())
  ).slice(0, 8)

  const prodFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqProd.toLowerCase())
  ).slice(0, 8)

  const agregarItem = (prod) => {
    if (items.find(i => i.producto_id === prod.id)) return
    setItems(prev => [...prev, {
      producto_id: prod.id,
      nombre: prod.nombre,
      cantidad: 1,
      precio_unitario: prod.precio_venta || 0,
      costo_unitario_snapshot: prod.costo_unitario || 0,
    }])
    setBusqP('')
  }

  const updateItem = (idx, campo, val) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [campo]: val } : it))
  }

  const quitarItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const total = items.reduce((s, i) => s + (i.cantidad || 0) * (i.precio_unitario || 0), 0)

  const clienteSelec = clientes.find(c => c.id === clienteId)

  const submit = async () => {
    const e = {}
    if (!clienteId) e.cliente = 'Seleccioná un cliente'
    if (!items.length) e.items = 'Agregá al menos un producto'
    if (Object.keys(e).length) { setErrores(e); return }
    await onGuardar({ cliente_id: clienteId, items, aclaraciones })
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo pedido" size="lg">
      <div className="flex flex-col gap-4">

        {/* Cliente */}
        <div>
          <label className="text-xs font-medium text-pipe-muted block mb-1">Cliente *</label>
          {clienteSelec ? (
            <div className="flex items-center justify-between px-3 py-2 rounded border border-pipe-blue bg-pipe-blueFaint">
              <div>
                <span className="text-sm font-medium text-pipe-text">{clienteSelec.comercio}</span>
                <span className="text-xs text-pipe-muted ml-2">{clienteSelec.nombre}</span>
              </div>
              <button onClick={() => setClienteId('')} className="text-pipe-faint hover:text-pipe-red text-xs">✕ Cambiar</button>
            </div>
          ) : (
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pipe-faint" />
              <input value={busqCliente} onChange={e => setBusqC(e.target.value)}
                placeholder="Buscar cliente…"
                className="w-full pl-7 pr-3 py-1.5 text-sm rounded border border-pipe-border focus:outline-none focus:ring-2 focus:ring-pipe-blue/20 focus:border-pipe-blue" />
              {busqCliente && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-pipe-border rounded shadow-panel max-h-40 overflow-y-auto">
                  {clientesFiltrados.length ? clientesFiltrados.map(c => (
                    <button key={c.id} onClick={() => { setClienteId(c.id); setBusqC('') }}
                      className="w-full text-left px-3 py-2 hover:bg-pipe-bg text-sm">
                      <span className="font-medium">{c.comercio}</span>
                      <span className="text-pipe-faint ml-2">{c.nombre}</span>
                    </button>
                  )) : <p className="px-3 py-2 text-sm text-pipe-faint">Sin resultados</p>}
                </div>
              )}
            </div>
          )}
          {errores.cliente && <p className="text-xs text-pipe-red mt-1">{errores.cliente}</p>}
        </div>

        {/* Productos */}
        <div>
          <label className="text-xs font-medium text-pipe-muted block mb-1">Productos *</label>
          <div className="relative mb-2">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pipe-faint" />
            <input value={busqProd} onChange={e => setBusqP(e.target.value)}
              placeholder="Buscar y agregar producto…"
              className="w-full pl-7 pr-3 py-1.5 text-sm rounded border border-pipe-border focus:outline-none focus:ring-2 focus:ring-pipe-blue/20 focus:border-pipe-blue" />
            {busqProd && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-pipe-border rounded shadow-panel max-h-40 overflow-y-auto">
                {prodFiltrados.length ? prodFiltrados.map(p => (
                  <button key={p.id} onClick={() => agregarItem(p)}
                    className="w-full text-left px-3 py-2 hover:bg-pipe-bg text-sm flex items-center justify-between">
                    <span>{p.nombre}</span>
                    <span className="text-pipe-muted font-mono text-xs">{ARS(p.precio_venta)}</span>
                  </button>
                )) : <p className="px-3 py-2 text-sm text-pipe-faint">Sin resultados</p>}
              </div>
            )}
          </div>

          {/* Tabla de items */}
          {items.length > 0 && (
            <div className="border border-pipe-border rounded overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_110px_32px] gap-0 bg-pipe-bg px-3 py-1.5 text-2xs font-semibold text-pipe-faint uppercase tracking-wider border-b border-pipe-border">
                <span>Producto</span><span className="text-center">Cant.</span><span className="text-right">Precio unit.</span><span/>
              </div>
              {items.map((it, idx) => (
                <div key={it.producto_id} className="grid grid-cols-[1fr_80px_110px_32px] gap-0 px-3 py-2 border-b border-pipe-border last:border-0 items-center">
                  <span className="text-sm text-pipe-text truncate pr-2">{it.nombre}</span>
                  <input type="number" min="1" value={it.cantidad}
                    onChange={e => updateItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                    className="text-center text-sm border border-pipe-border rounded px-1 py-0.5 w-16 focus:outline-none focus:border-pipe-blue" />
                  <input type="number" min="0" value={it.precio_unitario}
                    onChange={e => updateItem(idx, 'precio_unitario', parseFloat(e.target.value) || 0)}
                    className="text-right text-sm font-mono border border-pipe-border rounded px-1 py-0.5 w-full focus:outline-none focus:border-pipe-blue" />
                  <button onClick={() => quitarItem(idx)} className="ml-1 text-pipe-faint hover:text-pipe-red"><Trash2 size={13}/></button>
                </div>
              ))}
            </div>
          )}
          {errores.items && <p className="text-xs text-pipe-red mt-1">{errores.items}</p>}
        </div>

        {/* Nota */}
        <Input label="Nota / aclaraciones" placeholder="Entregar el martes, paga en efectivo…"
          value={aclaraciones} onChange={e => setAclar(e.target.value)} textarea />

        {/* Total */}
        {items.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 rounded bg-pipe-bg border border-pipe-border">
            <span className="text-sm font-medium text-pipe-muted">{items.reduce((s,i) => s + i.cantidad, 0)} productos</span>
            <span className="text-lg font-semibold font-mono text-pipe-text">{ARS(total)}</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1 border-t border-pipe-border">
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={submit} loading={loading}>Crear pedido</Button>
        </div>
      </div>
    </Modal>
  )
}
