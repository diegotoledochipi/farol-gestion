import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient.js'

/**
 * Devuelve la lista de clientes con:
 * - deuda_total: suma de pedidos entregados pendientes de cobro
 * - pedidos_count: cantidad de pedidos (para historial)
 * - dormido: true si no pide hace más días que el umbral configurado
 */
export function useClientes() {
  const [clientes, setClientes]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const fetchClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Traemos clientes + sus pedidos (para calcular deuda y dormido)
      const { data, error: err } = await supabase
        .from('cliente')
        .select(`
          *,
          pedido (
            id,
            total,
            fecha_pedido,
            estado_entrega,
            estado_cobro
          )
        `)
        .order('comercio', { ascending: true })

      if (err) throw err

      // Configuración de alerta dormido (default 21 días)
      const { data: cfg } = await supabase
        .from('config')
        .select('valor')
        .eq('clave', 'alerta_cliente_dias')
        .single()
      const umbralDias = parseInt(cfg?.valor ?? '21', 10)

      const hoy = new Date()

      const enriquecidos = (data ?? []).map(c => {
        const pedidos = c.pedido ?? []

        // Deuda = pedidos entregados con cobro pendiente
        const deuda_total = pedidos
          .filter(p => p.estado_entrega === 'entregado' && p.estado_cobro === 'pendiente')
          .reduce((sum, p) => sum + (p.total ?? 0), 0)

        // Último pedido
        const fechas = pedidos
          .filter(p => p.estado_entrega !== 'cancelado')
          .map(p => new Date(p.fecha_pedido))
        const ultimo = fechas.length ? new Date(Math.max(...fechas)) : null

        // Dormido: último pedido hace más de umbralDias
        const diasSinPedido = ultimo
          ? Math.floor((hoy - ultimo) / 86400000)
          : Infinity
        const dormido = diasSinPedido > umbralDias && pedidos.length > 0

        return {
          ...c,
          deuda_total,
          pedidos_count: pedidos.filter(p => p.estado_entrega !== 'cancelado').length,
          ultimo_pedido: ultimo,
          dias_sin_pedido: diasSinPedido === Infinity ? null : diasSinPedido,
          dormido,
          // no exponemos el array de pedidos en la lista (se pide por separado en detalle)
          pedido: undefined,
        }
      })

      setClientes(enriquecidos)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchClientes() }, [fetchClientes])

  // ── CRUD ──────────────────────────────────────────────────────────────────

  const crearCliente = async (form) => {
    const { data, error: err } = await supabase
      .from('cliente')
      .insert([sanitize(form)])
      .select()
      .single()
    if (err) throw err
    await fetchClientes()
    return data
  }

  const editarCliente = async (id, form) => {
    const { error: err } = await supabase
      .from('cliente')
      .update({ ...sanitize(form), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (err) throw err
    await fetchClientes()
  }

  const eliminarCliente = async (id) => {
    const { error: err } = await supabase
      .from('cliente')
      .delete()
      .eq('id', id)
    if (err) throw err
    await fetchClientes()
  }

  return { clientes, loading, error, refetch: fetchClientes, crearCliente, editarCliente, eliminarCliente }
}

/**
 * Trae el historial de pedidos de un cliente específico.
 */
export function usePedidosCliente(clienteId) {
  const [pedidos, setPedidos]   = useState([])
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    if (!clienteId) return
    setLoading(true)
    supabase
      .from('pedido')
      .select(`
        id, numero, total, fecha_pedido, fecha_entrega, fecha_cobro,
        estado_entrega, estado_cobro, aclaraciones
      `)
      .eq('cliente_id', clienteId)
      .order('fecha_pedido', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setPedidos(data ?? [])
        setLoading(false)
      })
  }, [clienteId])

  return { pedidos, loading }
}

// ── helpers ─────────────────────────────────────────────────────────────────

function sanitize(form) {
  return {
    nombre:    (form.nombre    ?? '').trim(),
    comercio:  (form.comercio  ?? '').trim(),
    direccion: (form.direccion ?? '').trim() || null,
    telefono:  limpiarTelefono(form.telefono ?? ''),
    nota:      (form.nota      ?? '').trim() || null,
  }
}

/** Deja solo dígitos (para wa.me funcione siempre) */
function limpiarTelefono(t) {
  const limpio = t.replace(/\D/g, '')
  return limpio || null
}
