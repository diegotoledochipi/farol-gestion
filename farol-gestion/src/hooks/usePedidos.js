import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient.js'

export function usePedidos() {
  const [pedidos, setPedidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchPedidos = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('pedido')
      .select(`
        *,
        cliente:cliente_id (id, nombre, comercio, telefono),
        pedido_item (
          id, cantidad, precio_unitario, costo_unitario_snapshot, subtotal,
          producto:producto_id (id, nombre, tipo)
        )
      `)
      .order('fecha_pedido', { ascending: false })
    if (err) { setError(err.message); setLoading(false); return }
    setPedidos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPedidos() }, [fetchPedidos])

  const crearPedido = async ({ cliente_id, items, aclaraciones, lista_precios_id }) => {
    // Calcular totales
    const total = items.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0)
    const costo = items.reduce((s, i) => s + i.cantidad * (i.costo_unitario_snapshot || 0), 0)

    const { data: pedido, error: e1 } = await supabase
      .from('pedido')
      .insert([{
        cliente_id,
        lista_precios_id: lista_precios_id || null,
        total,
        costo_mercaderia_total: costo,
        aclaraciones: aclaraciones || null,
        estado_entrega: 'pendiente',
        estado_cobro: 'pendiente',
        fecha_pedido: new Date().toISOString().split('T')[0],
      }])
      .select()
      .single()
    if (e1) throw e1

    const pedidoItems = items.map(i => ({
      pedido_id: pedido.id,
      producto_id: i.producto_id,
      cantidad: i.cantidad,
      precio_unitario: i.precio_unitario,
      costo_unitario_snapshot: i.costo_unitario_snapshot || 0,
    }))

    const { error: e2 } = await supabase.from('pedido_item').insert(pedidoItems)
    if (e2) throw e2

    // Actualizar fecha_ultimo_pedido en cliente
    await supabase
      .from('cliente')
      .update({ fecha_ultimo_pedido: new Date().toISOString().split('T')[0] })
      .eq('id', cliente_id)

    await fetchPedidos()
    return pedido
  }

  const actualizarEstado = async (id, campos) => {
    const update = { ...campos, updated_at: new Date().toISOString() }
    // Auto-fecha
    if (campos.estado_entrega === 'entregado' && !campos.fecha_entrega)
      update.fecha_entrega = new Date().toISOString().split('T')[0]
    if (campos.estado_cobro === 'pagado' && !campos.fecha_cobro)
      update.fecha_cobro = new Date().toISOString().split('T')[0]

    const { error: err } = await supabase.from('pedido').update(update).eq('id', id)
    if (err) throw err
    await fetchPedidos()
  }

  const eliminarPedido = async (id) => {
    const { error: err } = await supabase.from('pedido').delete().eq('id', id)
    if (err) throw err
    await fetchPedidos()
  }

  return { pedidos, loading, error, refetch: fetchPedidos, crearPedido, actualizarEstado, eliminarPedido }
}
