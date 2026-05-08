import { useState } from 'react'
import { SalesNote } from './SalesNote'
import { Invoice }   from './Invoice'
import { useProducts }   from '../hooks/useDB'
import { useClients }    from '../hooks/useDB'
import { useSalesNotes } from '../hooks/useDB'
import { useDocuments }  from '../hooks/useDB'

export function Documents() {
  const [subTab, setSubTab]         = useState('notas')
  const [pendingNote, setPending]   = useState(null)

  const { products }                                             = useProducts()
  const { clients }                                              = useClients()
  const { notes, create: createNote, update: updateNote, remove: removeNote } = useSalesNotes()
  const { docs,  create: createDoc,  remove: removeDoc }         = useDocuments()

  const handleEmitFromNote = (note) => {
    setPending(note)
    setSubTab('documentos')
  }

  return (
    <div className="documents">
      <div className="doc-tabs">
        <button
          type="button"
          className={subTab === 'notas' ? 'active' : ''}
          onClick={() => setSubTab('notas')}
        >
          NOTAS DE VENTA
        </button>
        <button
          type="button"
          className={subTab === 'documentos' ? 'active' : ''}
          onClick={() => setSubTab('documentos')}
        >
          FACTURAS Y BOLETAS
        </button>
      </div>

      {subTab === 'notas' && (
        <SalesNote
          products={products}
          clients={clients}
          notes={notes}
          onCreate={createNote}
          onUpdate={updateNote}
          onRemove={removeNote}
          onEmit={handleEmitFromNote}
        />
      )}

      {subTab === 'documentos' && (
        <Invoice
          products={products}
          clients={clients}
          notes={notes}
          docs={docs}
          onCreate={createDoc}
          onRemove={removeDoc}
          onUpdateNote={updateNote}
          prefillNote={pendingNote}
          onClearPrefill={() => setPending(null)}
        />
      )}
    </div>
  )
}
