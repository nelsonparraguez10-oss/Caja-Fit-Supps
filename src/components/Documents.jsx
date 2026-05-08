import { Invoice }      from './Invoice'
import { useProducts }  from '../hooks/useDB'
import { useClients }   from '../hooks/useDB'
import { useDocuments } from '../hooks/useDB'

export function Documents() {
  const { products }                                   = useProducts()
  const { clients }                                    = useClients()
  const { docs, create: createDoc, remove: removeDoc } = useDocuments()

  return (
    <div className="documents">
      <Invoice
        products={products}
        clients={clients}
        docs={docs}
        onCreate={createDoc}
        onRemove={removeDoc}
        prefillNote={null}
        onClearPrefill={() => {}}
      />
    </div>
  )
}