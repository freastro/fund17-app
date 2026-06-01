// Fund17 dashboard — Alerts (the feature the user liked from the references).
// Two treatments of one alert set: card row (A) and stacked list (B).
import type { CSSProperties } from 'react'
import { type Alert, SEV } from './data'

function AlertsHead({ count, onClear }: { count: number; onClear: () => void }) {
  return (
    <div className="mb-[2px] flex items-center gap-[10px]">
      <i className="ph ph-bell-ringing text-[18px] text-ink-800" />
      <span className="text-[13px] font-bold text-ink-900">Needs Attention</span>
      <span className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-[5px] text-[11px] font-bold text-white">
        {count}
      </span>
      {count > 0 && (
        <button
          onClick={onClear}
          className="ml-auto flex items-center gap-[6px] border-0 bg-transparent text-[13px] font-semibold text-ink-500 hover:text-green-900"
        >
          <i className="ph ph-check" />
          Dismiss all
        </button>
      )}
    </div>
  )
}

function EmptyAlerts() {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-line bg-success-bg p-[16px_20px] text-[14px] font-semibold text-green-900">
      <i className="ph ph-check-circle text-[22px]" />
      You're all caught up — no alerts need your attention right now.
    </div>
  )
}

// Each card/row sets its accent via two CSS variables consumed by the
// arbitrary-value utilities below (border, icon, meta colour).
const accent = (sev: Alert['sev']): CSSProperties =>
  ({ '--ac': SEV[sev].ac, '--acbg': SEV[sev].bg } as CSSProperties)

interface AlertsProps {
  alerts: Alert[]
  onDismiss: (id: string) => void
  onClear: () => void
}

// ---- Variation A: card row ----
export function AlertsCards({ alerts, onDismiss, onClear }: AlertsProps) {
  return (
    <div className="flex flex-col gap-3">
      <AlertsHead count={alerts.length} onClear={onClear} />
      {alerts.length === 0 ? (
        <EmptyAlerts />
      ) : (
        <div className="grid grid-cols-3 gap-4 max-lap:grid-cols-1">
          {alerts.map((a) => (
            <div
              key={a.id}
              style={accent(a.sev)}
              className="relative flex items-start gap-[14px] rounded-[14px] border border-line border-l-4 border-l-[color:var(--ac)] bg-white p-[16px_18px] shadow-xs transition hover:-translate-y-px hover:shadow-sm"
            >
              <button
                onClick={() => onDismiss(a.id)}
                aria-label="Dismiss"
                className="absolute right-[11px] top-[11px] flex h-6 w-6 items-center justify-center rounded-full border-0 bg-transparent text-[15px] text-ink-300 hover:bg-surface-2 hover:text-ink-800"
              >
                <i className="ph ph-x" />
              </button>
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-[11px] bg-[var(--acbg)] text-[21px] text-[color:var(--ac)]">
                <i className={'ph ' + a.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-bold uppercase tracking-[.3px] text-[color:var(--ac)]">
                  {a.meta}
                </div>
                <div className="flex items-center gap-2 text-[14px] font-bold text-ink-900">
                  {a.title}
                </div>
                <div className="mb-[11px] mt-[5px] text-[12.5px] leading-[1.45] text-ink-500">
                  {a.desc}
                </div>
                <button className="inline-flex items-center gap-[6px] border-0 bg-transparent p-0 text-[12.5px] font-bold text-green-900 transition-[gap] hover:gap-[9px]">
                  {a.action}
                  <i className="ph ph-arrow-right" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ---- Variation B: stacked list in one container ----
export function AlertsList({ alerts, onDismiss, onClear }: AlertsProps) {
  return (
    <div className="flex flex-col gap-3">
      <AlertsHead count={alerts.length} onClear={onClear} />
      {alerts.length === 0 ? (
        <EmptyAlerts />
      ) : (
        <div className="overflow-hidden rounded-[18px] border border-line bg-white">
          {alerts.map((a) => (
            <div
              key={a.id}
              style={accent(a.sev)}
              className="relative flex items-center gap-[14px] border-t border-line p-[15px_20px] first:border-t-0 max-[640px]:flex-wrap max-[640px]:gap-y-1 max-[640px]:p-[14px_16px_14px_20px]"
            >
              <span className="absolute inset-y-0 left-0 w-1 bg-[var(--ac)]" />
              <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[10px] bg-[var(--acbg)] text-[19px] text-[color:var(--ac)]">
                <i className={'ph ' + a.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-ink-900">{a.title}</div>
                <div className="mt-[2px] text-[12.5px] text-ink-500">{a.desc}</div>
              </div>
              <div className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[.3px] text-[color:var(--ac)] max-[640px]:order-2 max-[640px]:ml-auto">
                {a.meta}
              </div>
              <button className="flex items-center gap-[6px] whitespace-nowrap border-0 bg-transparent text-[13px] font-bold text-green-900 transition-[gap] hover:gap-[9px] max-[640px]:order-4 max-[640px]:mt-1 max-[640px]:flex-[1_1_100%] max-[640px]:justify-start">
                {a.action}
                <i className="ph ph-arrow-right" />
              </button>
              <button
                onClick={() => onDismiss(a.id)}
                aria-label="Dismiss"
                className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full border-0 bg-transparent text-[15px] text-ink-300 hover:bg-surface-2 hover:text-ink-800 max-[640px]:order-3"
              >
                <i className="ph ph-x" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
