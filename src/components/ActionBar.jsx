const TIPO_NAMES = {
  nota:    'Nota de Venta',
  boleta:  'Boleta',
  factura: 'Factura',
}

export function ActionBar({ printRef, tipo, folio, receptor, total, onClose }) {
  const tipoLabel = TIPO_NAMES[tipo] ?? tipo

  const handlePrint = () => window.print()

  const handlePDF = async () => {
    const { default: html2pdf } = await import('html2pdf.js')
    const cliente = receptor?.razonSocial || 'Consumidor_Final'
    const filename = `${tipo.toUpperCase()}_${folio}_${cliente.replace(/\s+/g, '_')}.pdf`
    html2pdf()
      .set({
        margin:     0,
        filename,
        image:      { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:      { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(printRef.current)
      .save()
  }

  const handleWhatsApp = () => {
    const name    = receptor?.contacto || receptor?.razonSocial || 'cliente'
    const phone   = receptor?.telefono ? receptor.telefono.replace(/\D/g, '') : ''
    const totalFmt = total.toLocaleString('es-CL')
    const msg     = encodeURIComponent(
      `Hola ${name}, le envío su ${tipoLabel} N° ${folio} por un total de $${totalFmt}. ` +
      `Para cualquier consulta estamos a su disposición. Saludos, FIT SUPPS`
    )
    const url = phone
      ? `https://wa.me/56${phone}?text=${msg}`
      : `https://wa.me/?text=${msg}`
    window.open(url, '_blank')
  }

  const handleEmail = () => {
    const subject = encodeURIComponent(`${tipoLabel} N° ${folio} — FIT SUPPS`)
    const name    = receptor?.razonSocial || 'cliente'
    const totalFmt = total.toLocaleString('es-CL')
    const body    = encodeURIComponent(
      `Estimado(a) ${name},\n\n` +
      `Le hacemos llegar su ${tipoLabel} N° ${folio} por un total de $${totalFmt}.\n\n` +
      `Para cualquier consulta no dude en contactarnos.\n\n` +
      `Saludos cordiales,\nFIT SUPPS\nfitsupps2025@gmail.com`
    )
    window.location.href = `mailto:${receptor?.email || ''}?subject=${subject}&body=${body}`
  }

  return (
    <div className="action-bar no-print">
      <div className="action-bar__left">
        <button onClick={onClose}>VOLVER</button>
        <span className="action-bar__doc-label">{tipoLabel} · {folio}</span>
      </div>
      <div className="action-bar__right">
        <button onClick={handleEmail}>CORREO</button>
        <button onClick={handleWhatsApp}>WHATSAPP</button>
        <button onClick={handlePDF}>DESCARGAR PDF</button>
        <button onClick={handlePrint} className="action-bar__primary">IMPRIMIR</button>
      </div>
    </div>
  )
}