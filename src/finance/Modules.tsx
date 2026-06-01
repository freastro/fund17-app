// Fund17 dashboard modules — NetWorth hero, SpendingDonut, Investments.
import {
  NW_TREND,
  NW_PARTS,
  NW_DEBT,
  SPEND,
  MOVERS,
  PORTFOLIO_PTS,
  PORTFOLIO_MONTHS,
} from './data'
import { Select, Pct } from './Shell'

function Sparkline({
  pts,
  w = 150,
  h = 44,
  stroke = 'var(--color-lime-400)',
}: {
  pts: number[]
  w?: number
  h?: number
  stroke?: string
}) {
  const max = Math.max(...pts)
  const min = Math.min(...pts)
  const rng = max - min || 1
  const d = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * w
      const y = h - ((p - min) / rng) * (h - 6) - 3
      return (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)
    })
    .join(' ')
  const area = d + ` L ${w} ${h} L 0 ${h} Z`
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      preserveAspectRatio="none"
      className="block"
    >
      <path d={area} fill="rgba(187,244,156,.18)" />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function NetWorthCard({ compact = false }: { compact?: boolean }) {
  const gross = NW_PARTS.reduce((s, p) => s + p.n, 0)
  return (
    <div
      className={
        'relative overflow-hidden rounded-[18px] bg-green-900 text-white shadow-green group-data-[shell=dark]/app:border group-data-[shell=dark]/app:border-[rgba(187,244,156,.18)] max-[640px]:p-[22px_20px] ' +
        (compact ? 'p-[20px_22px]' : 'p-[26px_28px]')
      }
    >
      <img
        src="/fund17-mark.svg"
        alt=""
        className="absolute bottom-[-30px] right-[-26px] w-[160px] opacity-10 [filter:brightness(0)_invert(1)]"
      />
      <div className="flex items-start justify-between gap-4 max-[640px]:flex-col max-[640px]:items-start max-[640px]:gap-[18px]">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[.5px] text-[rgba(255,255,255,.6)]">
            Net Worth
          </div>
          <div
            className={
              'mb-1 mt-2 font-extrabold leading-[1.05] tracking-[-1px] [font-variant-numeric:tabular-nums] max-[640px]:text-[34px] ' +
              (compact ? 'text-[36px]' : 'text-[42px]')
            }
          >
            $532,456
          </div>
          <div className="flex items-center gap-[10px]">
            <span className="inline-flex items-center gap-[5px] rounded-full bg-lime-400 px-[11px] py-1 text-[12px] font-bold text-green-900">
              <i className="ph ph-trend-up" />
              +2.4%
            </span>
            <span className="text-[13px] text-[rgba(255,255,255,.7)]">
              +$12,840 this month
            </span>
          </div>
        </div>
        <div className="flex-none text-right max-[640px]:self-stretch">
          <div className="max-[640px]:[&_svg]:w-full">
            <Sparkline pts={NW_TREND} />
          </div>
          <div className="mt-1 text-[11px] text-[rgba(255,255,255,.55)]">
            Last 12 months
          </div>
        </div>
      </div>

      <div className="mt-5 flex h-[9px] overflow-hidden rounded-full bg-[rgba(255,255,255,.12)]">
        {NW_PARTS.map((p) => (
          <span
            key={p.nm}
            className="h-full"
            style={{ width: (p.n / gross) * 100 + '%', background: p.dot }}
          />
        ))}
      </div>

      <div className="relative z-[1] mt-6 flex flex-col gap-[13px]">
        {NW_PARTS.map((p) => (
          <div className="flex items-center gap-3" key={p.nm}>
            <span
              className="h-[9px] w-[9px] flex-none rounded-full"
              style={{ background: p.dot }}
            />
            <span className="flex-1 text-[13.5px] text-[rgba(255,255,255,.82)]">
              {p.nm}
            </span>
            <span className="text-[14px] font-bold [font-variant-numeric:tabular-nums]">
              {p.vl}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-3 border-t border-[rgba(255,255,255,.12)] pt-[13px]">
          <span
            className="h-[9px] w-[9px] flex-none rounded-full"
            style={{ background: NW_DEBT.dot }}
          />
          <span className="flex-1 text-[13.5px] text-[rgba(255,255,255,.82)]">
            {NW_DEBT.nm}
          </span>
          <span className="text-[14px] font-bold text-[#FFC7CB] [font-variant-numeric:tabular-nums]">
            {NW_DEBT.vl}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SpendingDonut() {
  let acc = 0
  const stops = SPEND.map((s) => {
    const from = acc
    acc += s.pc
    return `${s.c} ${from}% ${acc}%`
  }).join(', ')
  return (
    <div className="rounded-[18px] border border-line bg-white p-[var(--cardpad)]">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 text-[19px] font-bold text-ink-900">Spending by Category</h3>
        <Select />
      </div>
      <div className="m-[6px_0_22px] flex justify-center">
        <div
          className="flex h-[188px] w-[188px] items-center justify-center rounded-full max-[420px]:h-[160px] max-[420px]:w-[160px]"
          style={{ background: `conic-gradient(${stops})` }}
        >
          <div className="flex h-[116px] w-[116px] flex-col items-center justify-center rounded-full bg-white max-[420px]:h-[100px] max-[420px]:w-[100px]">
            <div className="text-[10px] font-semibold uppercase tracking-[.4px] text-ink-500">
              Spent
            </div>
            <div className="text-[24px] font-extrabold tracking-[-.5px] text-ink-900">
              $5,500
            </div>
            <div className="text-[11px] text-ink-500">of $6,200</div>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-[14px]">
        {SPEND.map((s) => (
          <div className="flex items-center gap-[13px] text-[14px]" key={s.nm}>
            <span
              className="h-[10px] w-[10px] flex-none rounded-[3px]"
              style={{ background: s.c }}
            />
            <span className="flex-1 text-ink-800">{s.nm}</span>
            <span className="w-[38px] text-right text-[12.5px] font-semibold text-ink-500">
              {s.pc}%
            </span>
            <span className="font-bold text-ink-900 [font-variant-numeric:tabular-nums]">
              {s.vl}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PortfolioArea() {
  const pts = PORTFOLIO_PTS
  const W = 560
  const H = 150
  const max = Math.max(...pts)
  const min = Math.min(...pts)
  const rng = max - min || 1
  const xy = (p: number, i: number): [number, number] => [
    (i / (pts.length - 1)) * W,
    H - ((p - min) / rng) * (H - 16) - 8,
  ]
  let line = ''
  let area = 'M 0 ' + H
  pts.forEach((p, i) => {
    const [x, y] = xy(p, i)
    line += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '
    area += ' L ' + x.toFixed(1) + ' ' + y.toFixed(1)
  })
  area += ` L ${W} ${H} Z`
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="block h-[150px] w-full"
    >
      <path d={area} fill="rgba(30,72,65,.07)" />
      <path d={line} fill="none" stroke="var(--color-green-900)" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  )
}

export function InvestmentsCard() {
  return (
    <div className="rounded-[18px] border border-line bg-white p-[var(--cardpad)]">
      <div className="mb-[18px] flex flex-wrap items-center justify-between gap-3">
        <h3 className="m-0 text-[19px] font-bold text-ink-900">Investments</h3>
        <Select label="6 Months" />
      </div>
      <div className="grid grid-cols-[1.35fr_1fr] items-start gap-7 max-lap:grid-cols-1 max-lap:gap-[22px]">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[.5px] text-ink-500">
            Portfolio Value
          </div>
          <div className="m-[4px_0_2px] flex items-center gap-3">
            <span className="text-[32px] font-extrabold tracking-[-.5px] text-ink-900">
              $349,256
              <span className="text-[18px] font-bold text-ink-500">.45</span>
            </span>
            <Pct dir="up">5.64%</Pct>
          </div>
          <div className="mb-[14px] text-[13px] text-ink-500">
            <b className="font-bold text-green-900">+$19,698</b> over 12 months
          </div>
          <PortfolioArea />
          <div className="mt-2 flex justify-between">
            {PORTFOLIO_MONTHS.filter((_, i) => i % 2 === 0).map((m) => (
              <span key={m} className="text-[11px] text-ink-500">
                {m}
              </span>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-[6px] text-[10px] font-semibold uppercase tracking-[.5px] text-ink-500">
            Top Movers · Today
          </div>
          {MOVERS.map((m) => (
            <div
              className="flex items-center gap-[13px] border-t border-line py-[13px] first:border-t-0 first:pt-1"
              key={m.sym}
            >
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-surface-2 text-[14px] font-bold text-ink-800">
                {m.sym[0]}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-ink-900">{m.sym}</div>
                <div className="mt-px text-[12px] text-ink-500 max-[640px]:hidden">
                  {m.name}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13.5px] font-bold text-ink-900">{m.price}</div>
                <div className="mt-[3px]">
                  <Pct dir={m.dir}>{m.chg.replace(/[+−-]/, '')}</Pct>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
