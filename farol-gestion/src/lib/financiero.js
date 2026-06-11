/**
 * Farol Gestión — Lógica financiera central
 * Regla de oro: solo pedidos con estado_cobro='pagado' entran al cálculo.
 * Los gastos 'no_pagado' NO entran al cálculo — aparecen como alerta roja separada.
 */

export const SOCIOS = [
  { id: 'pepe',       nombre: 'Pepe',       pct: 35 },
  { id: 'nahuel',     nombre: 'Nahuel',     pct: 35 },
  { id: 'mica_diego', nombre: 'Mica · Diego', pct: 30 },
]

export const RESERVA_PCT_DEFAULT = 10

/**
 * Cadena de cálculo principal para un período.
 * @param {Array} pedidos - pedidos del período
 * @param {Array} gastos  - gastos del período (solo estado_pago='pagado')
 * @param {number} reservaPct - % de reserva (default 10)
 */
export function calcularPeriodo(pedidos = [], gastos = [], reservaPct = RESERVA_PCT_DEFAULT) {
  // Solo pedidos cobrados
  const pedidosCobrados = pedidos.filter(p => p.estado_cobro === 'pagado' && p.estado_entrega !== 'cancelado')
  const pedidosPendientes = pedidos.filter(p => p.estado_cobro === 'pendiente' && p.estado_entrega !== 'cancelado' && p.estado_cobro !== 'no_paga')
  const pedidosNoPaga = pedidos.filter(p => p.estado_cobro === 'no_paga')

  const ventasCobradas = pedidosCobrados.reduce((s, p) => s + (p.total || 0), 0)
  const costoMercaderia = pedidosCobrados.reduce((s, p) => s + (p.costo_mercaderia_total || 0), 0)
  const margenBruto = ventasCobradas - costoMercaderia

  // Solo gastos pagados
  const gastosPagados = gastos.filter(g => g.estado_pago === 'pagado')
  const totalGastos = gastosPagados.reduce((s, g) => s + (g.monto || 0), 0)

  const utilidadNeta = margenBruto - totalGastos
  const reserva = utilidadNeta > 0 ? (utilidadNeta * reservaPct) / 100 : 0
  const montoRepartir = utilidadNeta > 0 ? utilidadNeta - reserva : 0

  const reparto = SOCIOS.map(s => ({
    ...s,
    monto: (montoRepartir * s.pct) / 100,
  }))

  return {
    ventasCobradas,
    costoMercaderia,
    margenBruto,
    totalGastos,
    utilidadNeta,
    reserva,
    montoRepartir,
    reparto,
    pedidosCobrados: pedidosCobrados.length,
    pedidosPendientes: pedidosPendientes.length,
    pedidosNoPaga: pedidosNoPaga.length,
    totalPendienteCobro: pedidosPendientes.reduce((s, p) => s + (p.total || 0), 0),
  }
}

/**
 * Calcula los reembolsos que le corresponden a cada socio
 * por gastos que adelantaron de su bolsillo.
 */
export function calcularReembolsos(gastos = []) {
  const reembolsos = {}
  SOCIOS.forEach(s => { reembolsos[s.id] = 0 })

  gastos
    .filter(g => g.estado_pago === 'pagado' && g.pagado_por !== 'caja_farol')
    .forEach(g => {
      if (reembolsos[g.pagado_por] !== undefined) {
        reembolsos[g.pagado_por] += g.monto || 0
      }
    })

  return reembolsos
}

export const ARS = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(n || 0)
