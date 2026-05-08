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
import { useCart }      from './hooks/useCart'
import { useProducts, useSales, useExpenses, useExpenseTemplates, useClients } from './hooks/useDB'

const NAV = [
  { id: 'terminal',    label: 'Terminal'    },
  { id: 'inventario',  label: 'Inventario'  },
  { id: 'clientes',    label: 'Clientes'    },
  { id: 'documentos',  label: 'Documentos'  },
  { id: 'gastos',      label: 'Gastos'      },
  { id: 'analiticas',  label: 'Analiticas'  },
]

export default function App() {
  const [tab, setTab]             = useState('terminal')
  const [queryMode, setQueryMode] = useState(false)
  const [toast, setToast]         = useState(null)

  const { products, create: createProduct, update: updateProduct, remove: removeProduct } = useProducts()
  const { sales,    create: createSale }                                                  = useSales()

  const { expenses, refresh: refreshExpenses,
          create: createExpense, update: updateExpense, remove: removeExpense } = useExpenses()

  const { templates, refresh: refreshTemplates,
          create: createTemplate, update: updateTemplate,
          remove: removeTemplate, imputeNow: _imputeNow } = useExpenseTemplates()

  const { clients, create: createClient, update: updateClient, remove: removeClient } = useClients()

  const cart = useCart()

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
      cardCommission: cart.cardCommission,
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
      <aside className="sidebar">
        <div className="sidebar__logo">
          <img src={logo} alt="FIT SUPPS" className="logo-img" />
        </div>
        <nav className="sidebar__nav">
          {NAV.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)} className={`nav-item${tab === id ? ' nav-item--active' : ''}`}>
              {label}
            </button>
          ))}
        </nav>
        <p className="sidebar__version">v3.1.0 — local</p>
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
      </main>

      {toast && <div className={`toast toast--${toast.type}`}>{toast.text}</div>}
    </div>
  )
}
