import React, { useState, useEffect } from 'react'
import Input from '../../components/ui/Input.jsx'
import Button from '../../components/ui/Button.jsx'

const VACIO = { nombre: '', comercio: '', direccion: '', telefono: '', nota: '' }

export default function ClienteForm({ inicial, onGuardar, onCancelar, loading }) {
  const [form, setForm] = useState(VACIO)
  const [errores, setErrores] = useState({})

  useEffect(() => {
    setForm(inicial ? { ...VACIO, ...inicial } : VACIO)
    setErrores({})
  }, [inicial])

  const set = (campo) => (e) => setForm(f => ({ ...f, [campo]: e.target.value }))

  const validar = () => {
    const e = {}
    if (!form.nombre.trim())   e.nombre   = 'Obligatorio'
    if (!form.comercio.trim()) e.comercio  = 'Obligatorio'
    if (form.telefono && !/^[\d\s\+\-\(\)]+$/.test(form.telefono))
      e.telefono = 'Solo números y caracteres válidos (+, -, espacios)'
    return e
  }

  const submit = async () => {
    const e = validar()
    if (Object.keys(e).length) { setErrores(e); return }
    await onGuardar(form)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Contacto *"
          placeholder="Nombre del que atiende"
          value={form.nombre}
          onChange={set('nombre')}
          error={errores.nombre}
        />
        <Input
          label="Comercio *"
          placeholder="Nombre del local"
          value={form.comercio}
          onChange={set('comercio')}
          error={errores.comercio}
        />
      </div>

      <Input
        label="Dirección"
        placeholder="Calle y número, barrio"
        value={form.direccion}
        onChange={set('direccion')}
      />

      <Input
        label="Teléfono / WhatsApp"
        placeholder="549 11 1234 5678"
        value={form.telefono}
        onChange={set('telefono')}
        error={errores.telefono}
        helper="Sin espacios ni guiones para que el link de WA funcione siempre"
      />

      <Input
        label="Nota interna"
        placeholder="Paga a 15 días, prefiere IPA, el dueño es Carlos…"
        value={form.nota}
        onChange={set('nota')}
        textarea
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancelar} disabled={loading}>
          Cancelar
        </Button>
        <Button onClick={submit} loading={loading}>
          {inicial ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </div>
  )
}
