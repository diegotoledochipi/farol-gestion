import React, { useState } from 'react'
import {
  LayoutGrid, Package, List, Users, Receipt, BarChart3
} from 'lucide-react'
import ClientesPage from './modules/clientes/ClientesPage.jsx'

// Placeholders para módulos futuros
const Placeholder = ({ nombre }) => (
  <div className="flex flex-col items-center justify-center h-64 text-farol-border">
    <span className="font-display text-2xl text-farol-amber/40">{nombre}</span>
    <p className="text-sm mt-2 text-farol-border">Próximamente</p>
  </div>
)

const TABS = [
  { id: 'panel',         label: 'Panel',          icon: LayoutGrid,  component: () => <Placeholder nombre="Panel Principal" /> },
  { id: 'productos',     label: 'Productos',       icon: Package,     component: () => <Placeholder nombre="Productos" /> },
  { id: 'listas',        label: 'Lista de precios',icon: List,        component: () => <Placeholder nombre="Lista de Precios" /> },
  { id: 'clientes',      label: 'Clientes',        icon: Users,       component: ClientesPage },
  { id: 'gastos',        label: 'Gastos',          icon: Receipt,     component: () => <Placeholder nombre="Gastos" /> },
  { id: 'gestion',       label: 'Gestión',         icon: BarChart3,   component: () => <Placeholder nombre="Gestión" /> },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('clientes')
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? (() => null)

  return (
    <div className="min-h-screen flex flex-col bg-farol-paper">
      {/* Header */}
      <header className="border-b border-farol-border bg-farol-dark px-6 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2">
          {/* Logotipo textual: farol = linterna, tipografía display sobre oscuro */}
          <span className="font-display text-farol-gold text-xl tracking-wide">Farol</span>
          <span className="text-farol-border text-sm font-body font-medium tracking-widest uppercase">Gestión</span>
        </div>
        <div className="ml-auto text-farol-border/50 text-xs font-mono">v1 · MVP</div>
      </header>

      {/* Tabs nav */}
      <nav className="border-b border-farol-border bg-white/60 backdrop-blur-sm sticky top-0 z-30">
        <ul className="flex overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    active
                      ? 'border-farol-amber text-farol-amber'
                      : 'border-transparent text-farol-ink/50 hover:text-farol-ink hover:border-farol-border'
                  ].join(' ')}
                >
                  <Icon size={15} strokeWidth={active ? 2.2 : 1.8} />
                  {tab.label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Contenido */}
      <main className="flex-1 overflow-auto">
        <ActiveComponent />
      </main>
    </div>
  )
}
