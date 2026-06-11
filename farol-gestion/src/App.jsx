import React, { useState } from 'react'
import { LayoutGrid, Package, List, Users, Receipt, BarChart3 } from 'lucide-react'
import ClientesPage    from './modules/clientes/ClientesPage.jsx'
import PanelPage       from './modules/panel/PanelPage.jsx'
import ProductosPage   from './modules/productos/ProductosPage.jsx'
import ListasPreciosPage from './modules/listasPrecios/ListasPreciosPage.jsx'
import GastosPage      from './modules/gastos/GastosPage.jsx'
import GestionPage     from './modules/gestion/GestionPage.jsx'
import { clsx } from 'clsx'

const TABS = [
  { id: 'panel',     label: 'Panel',           icon: LayoutGrid,  component: PanelPage },
  { id: 'productos', label: 'Productos',        icon: Package,     component: ProductosPage },
  { id: 'listas',    label: 'Listas de precio', icon: List,        component: ListasPreciosPage },
  { id: 'clientes',  label: 'Clientes',         icon: Users,       component: ClientesPage },
  { id: 'gastos',    label: 'Gastos',           icon: Receipt,     component: GastosPage },
  { id: 'gestion',   label: 'Gestión',          icon: BarChart3,   component: GestionPage },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('panel')
  const ActiveComponent = TABS.find(t => t.id === activeTab)?.component ?? (() => null)

  return (
    <div className="min-h-screen flex flex-col bg-pipe-bg">
      <header className="h-12 bg-pipe-sidebar flex items-center px-4 shrink-0 z-40">
        <div className="flex items-center gap-2.5 mr-6">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="7" y="1" width="6" height="2" rx="1" fill="#60A5FA"/>
            <rect x="4" y="3" width="12" height="2" rx="1" fill="#60A5FA"/>
            <rect x="5" y="5" width="10" height="9" rx="2" fill="#93C5FD" fillOpacity="0.3" stroke="#60A5FA" strokeWidth="1.2"/>
            <rect x="8" y="7" width="4" height="5" rx="1" fill="#60A5FA" fillOpacity="0.8"/>
            <rect x="6" y="14" width="8" height="1.5" rx="0.75" fill="#60A5FA"/>
            <rect x="9" y="15.5" width="2" height="3" rx="1" fill="#60A5FA"/>
          </svg>
          <span className="text-white font-semibold text-sm tracking-tight">Farol Gestión</span>
        </div>
        <nav className="flex items-center gap-0.5 flex-1">
          {TABS.map(tab => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 h-8 rounded text-xs font-medium transition-colors',
                  active ? 'bg-white/15 text-white' : 'text-pipe-sidebarText hover:text-white hover:bg-white/10'
                )}>
                <Icon size={14} strokeWidth={active ? 2 : 1.7}/>
                {tab.label}
              </button>
            )
          })}
        </nav>
        <div className="text-pipe-sidebarText text-2xs font-mono">MVP v1</div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ActiveComponent />
      </main>
    </div>
  )
}
