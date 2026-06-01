// Fund17 Personal Finance Dashboard — static demo data.
// Mirrors the design prototype's data sources (alerts.jsx, modules.jsx, shell.jsx).
import type { ReactNode } from 'react'

/* ---- Navigation ---- */
export interface NavItem {
  id: string
  label: string
  icon: string
  badge?: string
}

export const NAV: NavItem[] = [
  { id: 'overview', label: 'Overview', icon: 'ph-squares-four' },
  { id: 'accounts', label: 'Accounts', icon: 'ph-wallet' },
  { id: 'transactions', label: 'Transactions', icon: 'ph-arrows-left-right' },
  { id: 'budgets', label: 'Budgets', icon: 'ph-chart-pie-slice' },
  { id: 'investments', label: 'Investments', icon: 'ph-chart-line-up' },
  { id: 'goals', label: 'Goals', icon: 'ph-coins' },
  { id: 'bills', label: 'Bills & Taxes', icon: 'ph-receipt', badge: '3' },
  { id: 'reports', label: 'Reports', icon: 'ph-list-bullets' },
]

/* ---- Alerts (the hero feature) ---- */
export type Severity = 'danger' | 'warning' | 'info'

export interface Alert {
  id: string
  sev: Severity
  icon: string
  meta: string
  title: string
  desc: ReactNode
  action: string
}

const B = ({ children }: { children: ReactNode }) => (
  <b className="font-bold text-ink-900">{children}</b>
)

export const ALERTS: Alert[] = [
  {
    id: 'low-balance',
    sev: 'danger',
    icon: 'ph-warning',
    meta: 'Action needed',
    title: 'Checking balance low',
    desc: (
      <>
        <B>Everyday Checking</B> dropped to <B>$312.40</B>, below your $500 safety
        buffer.
      </>
    ),
    action: 'Transfer funds',
  },
  {
    id: 'q2-tax',
    sev: 'warning',
    icon: 'ph-receipt',
    meta: 'Due in 15 days',
    title: 'Quarterly taxes due',
    desc: (
      <>
        Q2 estimated payment of <B>$4,250</B> is due to the IRS on{' '}
        <B>Jun 15, 2026</B>.
      </>
    ),
    action: 'Review estimate',
  },
  {
    id: 'roth-ira',
    sev: 'info',
    icon: 'ph-calendar-dots',
    meta: 'Closes Jul 15',
    title: 'Roth IRA window closing',
    desc: (
      <>
        You're <B>$2,000</B> from maxing your 2025 contribution before the deadline.
      </>
    ),
    action: 'Add contribution',
  },
]

// Accent color + soft background per severity, keyed to the Fund17 tokens.
export const SEV: Record<Severity, { ac: string; bg: string }> = {
  danger: { ac: 'var(--color-danger)', bg: 'var(--color-danger-bg)' },
  warning: { ac: 'var(--color-warning)', bg: 'var(--color-warning-bg)' },
  info: { ac: 'var(--color-info)', bg: 'var(--color-info-bg)' },
}

/* ---- Net worth ---- */
export const NW_TREND = [462, 470, 468, 481, 489, 495, 503, 510, 508, 519, 526, 532]

export interface NetWorthPart {
  nm: string
  vl: string
  n: number
  dot: string
}

export const NW_PARTS: NetWorthPart[] = [
  { nm: 'Cash & Checking', vl: '$48,200', n: 48200, dot: 'var(--color-lime-400)' },
  { nm: 'Investments', vl: '$349,256', n: 349256, dot: 'var(--color-mint-400)' },
  { nm: 'Property', vl: '$420,000', n: 420000, dot: 'var(--color-lime-300)' },
]

export const NW_DEBT = {
  nm: 'Debt (mortgage + cards)',
  vl: '−$285,000',
  dot: 'var(--color-danger)',
}

/* ---- Spending by category (donut) ---- */
export interface SpendSlice {
  nm: string
  pc: number
  vl: string
  c: string
}

export const SPEND: SpendSlice[] = [
  { nm: 'Housing', pc: 38, vl: '$2,090', c: '#1E4841' },
  { nm: 'Groceries', pc: 16, vl: '$880', c: '#2A5F55' },
  { nm: 'Transport', pc: 11, vl: '$605', c: '#9BDABB' },
  { nm: 'Dining Out', pc: 9, vl: '$495', c: '#BBF49C' },
  { nm: 'Subscriptions', pc: 7, vl: '$385', c: '#CDEDDD' },
  { nm: 'Everything Else', pc: 19, vl: '$1,045', c: '#C9D3CE' },
]

/* ---- Investments: top movers ---- */
export interface Mover {
  sym: string
  name: string
  price: string
  chg: string
  dir: 'up' | 'dn'
}

export const MOVERS: Mover[] = [
  { sym: 'NVDA', name: 'NVIDIA Corp.', price: '$1,204.18', chg: '+4.12%', dir: 'up' },
  { sym: 'TWTR', name: 'Twitter Inc.', price: '$899.41', chg: '+2.30%', dir: 'up' },
  { sym: 'AAPL', name: 'Apple Inc.', price: '$145.30', chg: '+1.25%', dir: 'up' },
  { sym: 'AMZN', name: 'Amazon.com', price: '$3,204.50', chg: '−0.45%', dir: 'dn' },
  { sym: 'SPOT', name: 'Spotify', price: '$112.50', chg: '−3.56%', dir: 'dn' },
]

export const PORTFOLIO_PTS = [292, 300, 297, 311, 318, 309, 326, 331, 322, 338, 344, 349]
export const PORTFOLIO_MONTHS = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May']
