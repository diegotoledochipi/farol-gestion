import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient.js'

export function useGastos() {
  const [gastos, setGastos]   = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('gasto')
      .select('*')
      .order('fecha', { ascending: false })
    setGastos(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const crearGasto = async (form) => {
    const { error } = await supabase.from('gasto').insert([{
      descripcion: form.descripcion,
      monto: parseFloat(form.monto),
      tipo: form.tipo,
      categoria: form.categoria || 'otro',
      fecha: form.fecha || new Date().toISOString().split('T')[0],
      estado_pago: form.estado_pago || 'pagado',
      fecha_vencimiento: form.fecha_vencimiento || null,
      pagado_por: form.pagado_por || 'caja_farol',
    }])
    if (error) throw error
    await fetch()
  }

  const editarGasto = async (id, form) => {
    const { error } = await supabase.from('gasto').update({
      descripcion: form.descripcion,
      monto: parseFloat(form.monto),
      tipo: form.tipo,
      categoria: form.categoria || 'otro',
      fecha: form.fecha,
      estado_pago: form.estado_pago,
      fecha_vencimiento: form.fecha_vencimiento || null,
      pagado_por: form.pagado_por,
    }).eq('id', id)
    if (error) throw error
    await fetch()
  }

  const marcarPagado = async (id, pagado_por) => {
    const { error } = await supabase.from('gasto').update({
      estado_pago: 'pagado',
      pagado_por,
      fecha: new Date().toISOString().split('T')[0],
    }).eq('id', id)
    if (error) throw error
    await fetch()
  }

  const eliminarGasto = async (id) => {
    const { error } = await supabase.from('gasto').delete().eq('id', id)
    if (error) throw error
    await fetch()
  }

  // Gastos del mes actual (variables pagados + fijos pagados)
  const gastosMesActual = () => {
    const hoy = new Date()
    const mes = hoy.getMonth()
    const anio = hoy.getFullYear()
    return gastos.filter(g => {
      if (g.estado_pago !== 'pagado') return false
      const f = new Date(g.fecha)
      if (g.tipo === 'fijo') return true // fijos siempre
      return f.getMonth() === mes && f.getFullYear() === anio
    })
  }

  const gastosNoPagados = () => gastos.filter(g => g.estado_pago === 'no_pagado')

  return { gastos, loading, refetch: fetch, crearGasto, editarGasto, marcarPagado, eliminarGasto, gastosMesActual, gastosNoPagados }
}
