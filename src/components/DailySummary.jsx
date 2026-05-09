import { useMemo } from 'react'
import { calcNeto, formatCLP } from '../utils/calculations'

const dateStr = (d) => d.toDateString()

export function DailySummary({ sales }) {
  const stats = useMemo(() => {
    const now  = new Date()
    const yest = new Date(now); yest.setDate(yest.getDate() - 1)

    const active = sales.filter((s) => s.status !== 'VOIDED')
    const todaySales     = active.filter((s) => dateStr(new Date(s.date)) === dateStr(now))
    const yesterdaySales = active.filter((s) => dateStr(new Date(s.date)) === dateStr(yest))

    const gross     = (arr) => arr.reduce((a, s) => a + (s.effectiveTotal ?? s.total ?? 0), 0)
    const costOf    = (arr) => arr.reduce((a, s) => a + s.items.reduce((b, i) => b + (i.cost || 0) * i.quantity, 0), 0)

    const todayGross    = gross(todaySales)
    const yesterdayGross = gross(yesterdaySales)
    const todayNet      = calcNeto(todayGross)
    const todayProfit   = todayNet - costOf(todaySales)

    const growthPct = yesterdayGross > 0
      ? ((todayGross - yesterdayGross) / yesterdayGross) * 100
      : todayGross > 0 ? 100 : null

    return { count: todaySales.length, gross: todayGross, net: todayNet, profit: todayProfit, growthPct }
  }, [sales])

  const badge = stats.growthPct === null ? null : {
    text: `${stats.growthPct >= 0 ? '+' : ''}${stats.growthPct.toFixed(1)}% vs ayer`,
    mod:  stats.growthPct > 0 ? 'pos' : stats.growthPct < 0 ? 'neg' : 'neu',
  }

  const dateLabel = new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="daily-summary">
      <p className="daily-summary__date">{dateLabel}</p>
      <div className="daily-summary__grid">

        <div className="daily-card">
          <p className="daily-card__label">Ventas hoy</p>
          <p className="daily-card__value">{stats.count}</p>
          {stats.count === 0 && <p className="daily-card__badge daily-card__badge--neu">Sin ventas aún</p>}
        </div>

        <div className="daily-card">
          <p className="daily-card__label">Ingreso Bruto</p>
          <p className="daily-card__value">{formatCLP(stats.gross)}</p>
          {badge && <p className={`daily-card__badge daily-card__badge--${badge.mod}`}>{badge.text}</p>}
          {!badge && <p className="daily-card__badge daily-card__badge--neu">Sin datos de ayer</p>}
        </div>

        <div className="daily-card">
          <p className="daily-card__label">Ingreso Neto</p>
          <p className="daily-card__value">{formatCLP(stats.net)}</p>
        </div>

        <div className="daily-card">
          <p className="daily-card__label">Utilidad Diaria</p>
          <p className={`daily-card__value${stats.profit < 0 ? ' daily-card__value--neg' : ''}`}>
            {formatCLP(stats.profit)}
          </p>
        </div>

      </div>
    </div>
  )
}