export const formatRUT = (value) => {
  const raw = value.replace(/[^0-9kK]/g, '').toUpperCase()
  if (raw.length < 2) return raw
  const body = raw.slice(0, -1)
  const dv   = raw.slice(-1)
  const dotted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${dotted}-${dv}`
}

export const validateRUT = (rut) => {
  const raw = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (raw.length < 2) return false
  const body = raw.slice(0, -1)
  const dv   = raw.slice(-1)
  let sum = 0, factor = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * factor
    factor = factor >= 7 ? 2 : factor + 1
  }
  const rem = 11 - (sum % 11)
  const expected = rem === 11 ? '0' : rem === 10 ? 'K' : String(rem)
  return dv === expected
}