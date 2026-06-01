// Fund17 Personal Finance Dashboard — root composition.
// Overview = alerts hero + (net worth / spending) + investments.
import { useState } from 'react'
import { NAV, ALERTS, type Alert } from './data'
import { Sidebar, MobileBar, TopBar } from './Shell'
import { AlertsCards, AlertsList } from './Alerts'
import { NetWorthCard, SpendingDonut, InvestmentsCard } from './Modules'
import { TweaksPanel, TWEAK_DEFAULTS, type Tweaks } from './Tweaks'

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-[14px] rounded-[18px] border border-line bg-white p-[90px_24px] text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-mint-200 text-[30px] text-green-900">
        <i className="ph ph-squares-four" />
      </div>
      <h3 className="m-0 text-[20px] text-ink-900">{label}</h3>
      <p className="m-0 max-w-[360px] text-[14px] leading-[1.5] text-ink-500">
        This section isn't part of the demo. The Overview tab holds the live
        dashboard — alerts, net worth, investments, and spending.
      </p>
    </div>
  )
}

function Overview({
  alerts,
  setAlerts,
  alertStyle,
  compact,
}: {
  alerts: Alert[]
  setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>
  alertStyle: Tweaks['alertStyle']
  compact: boolean
}) {
  const dismiss = (id: string) => setAlerts((a) => a.filter((x) => x.id !== id))
  const clear = () => setAlerts([])
  const AlertsView = alertStyle === 'List' ? AlertsList : AlertsCards
  return (
    <>
      <AlertsView alerts={alerts} onDismiss={dismiss} onClear={clear} />
      <div className="grid grid-cols-[1.5fr_1fr] items-start gap-[var(--stack)] max-desk:grid-cols-1">
        <NetWorthCard compact={compact} />
        <SpendingDonut />
      </div>
      <InvestmentsCard />
    </>
  )
}

export function Dashboard() {
  const [tweaks, setTweaks] = useState<Tweaks>(TWEAK_DEFAULTS)
  const [active, setActive] = useState('overview')
  const [alerts, setAlerts] = useState<Alert[]>(ALERTS)
  const [navOpen, setNavOpen] = useState(false)

  const setTweak = <K extends keyof Tweaks>(key: K, value: Tweaks[K]) =>
    setTweaks((t) => ({ ...t, [key]: value }))

  const title = NAV.find((n) => n.id === active)?.label || 'Overview'
  const compact = tweaks.density === 'Compact'

  return (
    <div
      data-shell={tweaks.shell === 'Dark' ? 'dark' : 'light'}
      data-density={compact ? 'compact' : 'comfortable'}
      className="group/app flex min-h-screen bg-sage-100 font-display max-tab:flex-col"
    >
      <Sidebar
        active={active}
        onNav={setActive}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />
      <MobileBar title={title} onMenu={() => setNavOpen(true)} />

      <main
        className={
          'flex min-w-0 flex-1 flex-col gap-[var(--stack)] bg-surface ' +
          'rounded-[28px_28px_0_0] tab:rounded-[32px_0_0_32px] ' +
          (compact ? 'p-[20px_24px_24px]' : 'p-[24px_30px_30px] max-[640px]:p-[18px_16px_24px]')
        }
      >
        <TopBar title={active === 'overview' ? 'Good evening, Maya' : title} />

        {active === 'overview' ? (
          <Overview
            alerts={alerts}
            setAlerts={setAlerts}
            alertStyle={tweaks.alertStyle}
            compact={compact}
          />
        ) : (
          <Placeholder label={title} />
        )}

        <footer className="flex items-center gap-5 pt-1 text-[13px] text-ink-400 max-[640px]:flex-wrap max-[640px]:gap-y-2">
          <span className="cursor-default">© 2026 Fund17</span>
          <span className="cursor-pointer">Privacy</span>
          <span className="cursor-pointer">Security</span>
          <span className="ml-auto cursor-default text-ink-500 max-[640px]:ml-0 max-[640px]:basis-full">
            Synced 2 min ago
          </span>
        </footer>
      </main>

      <TweaksPanel
        tweaks={tweaks}
        setTweak={setTweak}
        onRestore={() => setAlerts(ALERTS)}
      />
    </div>
  )
}
