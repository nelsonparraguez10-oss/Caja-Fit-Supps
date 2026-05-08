import { Invoice }      from './Invoice'
import { useProducts }  from '../hooks/useDB'
import { useClients }   from '../hooks/useDB'
import { useSalesNotes } from '../hooks/useDB'
import { useDocuments } from '../hooks/useDB'

export function Documents() {
  const { products }                                     = useProducts()
  const { clients }                                      = useClients()
  const { notes, update: updateNote }                    = useSalesNotes()
  const { docs, create: createDoc, remove: removeDoc }   = useDocuments()

  return (
    <div className="documents">
      <Invoice
        products={products}
        clients={clients}
        notes={notes}
        docs={docs}
        onCreate={createDoc}
        onRemove={removeDoc}
        onUpdateNote={updateNote}
        prefillNote={null}
        onClearPrefill={() => {}}
      />
    </div>
  )
}