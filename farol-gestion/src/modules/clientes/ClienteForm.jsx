import React, { useState, useEffect } from 'react'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'

const VACIO = { nombre: '', comercio: '', direccion: '', telefono: '', nota: '' }

export default function ClienteForm({ inicial, onGuardar, onCancelar, loading }) {
  const [form, setForm]     = useState(VACIO)
  const [errores, setErrores] = useState({})

  useEffect(() => {
    setForm(inicial ? { ...VACIO, ...inicial } : VACIO)
    setErrores({})
  }, [inicial])

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }))

  const validar = () => {
    const e = {}
    if (!form.nombre.trim())   e.nombre   = 'Requerido'
    if (!form.comercio.trim()) e.comercio = 'Requerido'
    if (form.telefono && !/^[\d\s\+\-\(\)]+$/.test(form.telefono))
      e.telefono = 'Solo números y caracteres válidos'
    return e
  }

  const submit = async () => {
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }
    await onGuardar(form)
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Nombre de contacto *" placeholder="Carlos, María…"
          value={form.nombre} onChange={set('nombre')} error={errores.nombre} />
        <Input label="Nombre del local *" placeholder="Pizzería Don Juan…"
          value={form.comercio} onChange={set('comercio')} error={errores.comercio} />
      </div>
      <Input label="Dirección" placeholder="Av. San Martín 450"
        value={form.direccion} onChange={set('direccion')} />
      <Input label="Teléfono / WhatsApp" placeholder="54911 1234 5678"
        value={form.telefono} onChange={set('telefono')} error={errores.telefono}
        helper="Sin espacios para que el link de WA funcione siempre" />
      <Input label="Nota interna" placeholder="Paga a 15 días · prefiere IPA · pedir por Carlos…"
        value={form.nota} onChange={set('nota')} textarea />

      <div className="flex justify-end gap-2 pt-1 border-t border-pipe-border mt-1">
        <Button variant="secondary" onClick={onCancelar} disabled={loading}>Cancelar</Button>
        <Button onClick={submit} loading={loading}>
          {inicial ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </div>
  )
}
