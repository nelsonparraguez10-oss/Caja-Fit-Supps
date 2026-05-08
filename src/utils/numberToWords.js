const ONES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS',
  'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE']

const TWENTIES = ['VEINTE', 'VEINTIÚN', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO',
  'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE']

const TENS = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
  'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']

const HUNDREDS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS',
  'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

function chunk(n) {
  if (n === 0)   return ''
  if (n === 100) return 'CIEN'

  const h   = Math.floor(n / 100)
  const rem = n % 100

  const head = h > 0 ? HUNDREDS[h] : ''
  if (rem === 0) return head

  const sep = head ? ' ' : ''

  if (rem < 20)  return head + sep + ONES[rem]
  if (rem < 30)  return head + sep + TWENTIES[rem - 20]

  const d = Math.floor(rem / 10)
  const u = rem % 10
  return head + sep + TENS[d] + (u > 0 ? ' Y ' + ONES[u] : '')
}

export function numberToWords(n) {
  if (!n || n === 0) return 'CERO PESOS'

  const M = Math.floor(n / 1_000_000)
  const K = Math.floor((n % 1_000_000) / 1_000)
  const R = n % 1_000

  const parts = []
  if (M > 0) parts.push(M === 1 ? 'UN MILLÓN' : chunk(M) + ' MILLONES')
  if (K > 0) parts.push(K === 1 ? 'MIL'       : chunk(K) + ' MIL')
  if (R > 0) parts.push(chunk(R))

  return parts.join(' ') + ' PESOS'
}