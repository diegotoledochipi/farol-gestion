import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient.js'

export function useInsumos() {
  const [insumos, setInsumos] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('insumo')
      .select(`*, precios:insumo_precio_historial(precio, fecha_desde, nota)`)
      .eq('activo', true)
      .order('nombre')
    setInsumos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const precioVigente = (insumo) => {
    const hist = insumo.precios || []
    if (!hist.length) return 0
    const sorted = [...hist].sort((a, b) => new Date(b.fecha_desde) - new Date(a.fecha_desde))
    return sorted[0].precio
  }

  const crearInsumo = async ({ nombre, tipo, proveedor, precio, unidad }) => {
    const { data, error } = await supabase
      .from('insumo')
      .insert([{ nombre, tipo: tipo || 'otro', proveedor: proveedor || null, unidad: unidad || null }])
      .select().single()
    if (error) throw error
    await supabase.from('insumo_precio_historial').insert([{
      insumo_id: data.id, precio, fecha_desde: new Date().toISOString().split('T')[0]
    }])
    await fetch()
    return data
  }

  const editarInsumo = async (id, campos) => {
    const { nombre, tipo, proveedor, unidad, precio } = campos
    await supabase.from('insumo').update({ nombre, tipo, proveedor, unidad }).eq('id', id)
    if (precio !== undefined) {
      await supabase.from('insumo_precio_historial').insert([{
        insumo_id: id, precio, fecha_desde: new Date().toISOString().split('T')[0]
      }])
    }
    await fetch()
  }

  const eliminarInsumo = async (id) => {
    await supabase.from('insumo').update({ activo: false }).eq('id', id)
    await fetch()
  }

  return { insumos, loading, refetch: fetch, precioVigente, crearInsumo, editarInsumo, eliminarInsumo }
}

export function useProductos() {
  const [productos, setProductos] = useState([])
  const [loading, setLoading]     = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('producto')
      .select(`
        *,
        producto_insumo (
          cantidad, unidad,
          insumo:insumo_id (id, nombre, tipo, unidad,
            precios:insumo_precio_historial(precio, fecha_desde)
          )
        )
      `)
      .eq('activo', true)
      .order('nombre')
    setProductos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const crearProductoSimple = async ({ nombre, precio_venta, descripcion }) => {
    const { error } = await supabase.from('producto').insert([{
      nombre, tipo: 'simple', precio_venta, descripcion: descripcion || null,
      costo_unitario: 0, margen_pct: 0,
    }])
    if (error) throw error
    await fetch()
  }

  const crearProductoCompleto = async ({ nombre, insumos, margen_pct }) => {
    // Calcular costo con precios vigentes
    const costo = insumos.reduce((s, i) => {
      const hist = i.insumo?.precios || []
      const sorted = [...hist].sort((a, b) => new Date(b.fecha_desde) - new Date(a.fecha_desde))
      const precio = sorted[0]?.precio || 0
      return s + precio * i.cantidad
    }, 0)
    const precio_venta = costo * (1 + (margen_pct || 0) / 100)

    const { data, error } = await supabase.from('producto').insert([{
      nombre, tipo: 'compuesto', costo_unitario: costo,
      margen_pct, precio_venta,
    }]).select().single()
    if (error) throw error

    const items = insumos.map(i => ({
      producto_id: data.id,
      insumo_id: i.insumo_id,
      cantidad: i.cantidad,
      unidad: i.unidad || null,
    }))
    if (items.length) await supabase.from('producto_insumo').insert(items)
    await fetch()
    return data
  }

  const editarProducto = async (id, campos) => {
    const { error } = await supabase.from('producto').update(campos).eq('id', id)
    if (error) throw error
    await fetch()
  }

  const eliminarProducto = async (id) => {
    await supabase.from('producto').update({ activo: false }).eq('id', id)
    await fetch()
  }

  return { productos, loading, refetch: fetch, crearProductoSimple, crearProductoCompleto, editarProducto, eliminarProducto }
}
