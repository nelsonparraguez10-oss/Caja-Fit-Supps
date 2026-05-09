import { Invoice }     from './Invoice'
import { useProducts } from '../hooks/useDB'
import { useClients }  from '../hooks/useDB'

export function Documents({ docs, onCreate, onRemove, onVoid }) {
  const { products } = useProducts()
  const { clients }  = useClients()

  return (
    <div className="documents">
      <Invoice
        products={products}
        clients={clients}
        docs={docs}
        onCreate={onCreate}
        onRemove={onRemove}
        onVoid={onVoid}
        prefillNote={null}
        onClearPrefill={() => {}}
      />
    </div>
  )
}