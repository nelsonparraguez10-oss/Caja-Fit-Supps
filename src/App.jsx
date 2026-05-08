import { useState, useEffect } from 'react'
import logo from './assets/logo-sidebar.png'
import { expenseTemplates as dbTemplates } from './data/db'
import { ScannerInput } from './components/ScannerInput'
import { Cart }         from './components/Cart'
import { Products }     from './components/Products'
import { Expenses }     from './components/Expenses'
import { Analytics }    from './components/Analytics'
import { Clients }      from './components/Clients'
import { Documents }    from './components/Documents'
import { Login }        from './components/Login'
import { Settings }     from './components/Settings'
import { useCart }      from './hooks/useCart'
import { useSettings }  from './hooks/useSettings'
import { useProducts, useSales, useExpenses, useExpenseTemplates, useClients } from './hooks/useDB'

const NAV = [
  {
    id: 'terminal', label: 'Ventas',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  },
  {
    id: 'inventario', label: 'Inventario',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  },
  {
    id: 'clientes', label: 'Clientes',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
  {
    id: 'documentos', label: 'Documentos',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  },
  {
    id: 'gastos', label: 'Gastos',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  },
  {
    id: 'analiticas', label: 'Analíticas',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    id: 'configuracion', label: 'Config',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  },
]

const ICON_LOGOUT = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const ICON_CHEVRON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

export default function App() {
  const [authed, setAuthed] = useState(() => localStorage.getItem('pos_auth') === '1')

  if (!authed) {
    return (
      <Login onSuccess={() => {
        localStorage.setItem('pos_auth', '1')
        setAuthed(true)
      }} />
    )
  }

  return (
    <AppContent onLogout={() => {
      localStorage.removeItem('pos_auth')
      setAuthed(false)
    }} />
  )
}

function AppContent({ onLogout }) {
  const [tab, setTab]             = useState('terminal')
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebar_collapsed') === '1')
  const [queryMode, setQueryMode] = useState(false)
  const [toast, setToast]         = useState(null)

  const toggleCollapsed = () => setCollapsed((c) => {
    const next = !c
    localStorage.setItem('sidebar_collapsed', next ? '1' : '0')
    return next
  })

  const { products, create: createProduct, update: updateProduct, remove: removeProduct } = useProducts()
  const { sales,    create: createSale }                                                  = useSales()

  const { expenses, refresh: refreshExpenses,
          create: createExpense, update: updateExpense, remove: removeExpense } = useExpenses()

  const { templates, refresh: refreshTemplates,
          create: createTemplate, update: updateTemplate,
          remove: removeTemplate, imputeNow: _imputeNow } = useExpenseTemplates()

  const { clients, create: createClient, update: updateClient, remove: removeClient } = useClients()

  const { cfg, save: saveSettings } = useSettings()
  const cart = useCart(cfg)

  useEffect(() => {
    dbTemplates.autoImputeMonth()
    refreshExpenses()
    refreshTemplates()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const showToast = (text, type = 'success') => {
    setToast({ text, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCheckout = () => {
    if (cart.items.length === 0) return
    createSale({
      channel:        cart.channel,
      items:          [...cart.items],
      listTotal:      cart.listTotal,
      effectiveTotal: cart.effectiveTotal,
      paymentMethod:  cart.channel === 'ECOM' ? 'mercadopago' : cart.paymentMethod,
      cardCommission: cart.channel === 'ECOM' ? cart.mpCommission : cart.cardCommission,
      shipping: {
        cobro:  parseFloat(cart.cobroEnvio) || 0,
        costo:  parseFloat(cart.costoEnvio) || 0,
        margin: cart.shippingMargin,
      },
    })
    cart.clearCart()
    showToast('Venta registrada correctamente')
  }

  const handleImputeTemplate = (id) => {
    _imputeNow(id)
    refreshExpenses()
  }

  return (
    <div className="app">
      <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}>
        <div className="sidebar__logo">
          <img src={logo} alt="FIT SUPPS" className="logo-img" />
          <button className="sidebar__collapse-btn" onClick={toggleCollapsed} title={collapsed ? 'Expandir menú' : 'Contraer menú'}>
            {ICON_CHEVRON}
          </button>
        </div>
        <nav className="sidebar__nav">
          {NAV.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setTab(id)} title={label} className={`nav-item${tab === id ? ' nav-item--active' : ''}`}>
              <span className="nav-item__icon">{icon}</span>
              <span className="nav-item__label">{label}</span>
            </button>
          ))}
        </nav>
        <button className="sidebar__logout" onClick={onLogout} title="Cerrar sesión">
          <span className="sidebar__logout-icon">{ICON_LOGOUT}</span>
          <span className="sidebar__logout-label">Cerrar sesión</span>
        </button>
        <p className="sidebar__version">v3.1.0</p>
      </aside>

      <main className="main">
        {tab === 'terminal' && (
          <div className="sales-layout">
            <ScannerInput
              onScan={cart.addItem}
              queryMode={queryMode}
              onToggleQueryMode={() => setQueryMode((m) => !m)}
            />
            <Cart
              items={cart.items}
              channel={cart.channel}               setChannel={cart.setChannel}
              paymentMethod={cart.paymentMethod}   setPaymentMethod={cart.setPaymentMethod}
              ecomReceived={cart.ecomReceived}     setEcomReceived={cart.setEcomReceived}
              cobroEnvio={cart.cobroEnvio}         setCobroEnvio={cart.setCobroEnvio}
              costoEnvio={cart.costoEnvio}         setCostoEnvio={cart.setCostoEnvio}
              listTotal={cart.listTotal}
              effectiveTotal={cart.effectiveTotal}
              cardCommission={cart.cardCommission}
              mpCommission={cart.mpCommission}
              cfg={cfg}
              shippingMargin={cart.shippingMargin}
              onRemove={cart.removeItem}
              onUpdateQuantity={cart.updateQuantity}
              onCheckout={handleCheckout}
            />
          </div>
        )}

        {tab === 'inventario' && (
          <Products products={products} onCreate={createProduct} onUpdate={updateProduct} onRemove={removeProduct} />
        )}

        {tab === 'clientes' && (
          <Clients clients={clients} onCreate={createClient} onUpdate={updateClient} onRemove={removeClient} />
        )}

        {tab === 'documentos' && <Documents />}

        {tab === 'gastos' && (
          <Expenses
            expenses={expenses}
            templates={templates}
            onCreate={createExpense}
            onUpdate={updateExpense}
            onRemove={removeExpense}
            onCreateTemplate={createTemplate}
            onUpdateTemplate={updateTemplate}
            onRemoveTemplate={removeTemplate}
            onImputeTemplate={handleImputeTemplate}
          />
        )}

        {tab === 'analiticas' && (
          <Analytics sales={sales} expenses={expenses} products={products} />
        )}

        {tab === 'configuracion' && (
          <Settings cfg={cfg} onSave={saveSettings} />
        )}
      </main>

      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}
    </div>
  )
}