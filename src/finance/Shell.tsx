// Fund17 dashboard shell — Sidebar, MobileBar, TopBar + small primitives.
// Responsive states mirror the prototype:
//   desktop (>=1181px): full 256px sidebar with wordmark + labels
//   tablet  (721–1180): 80px icon-only rail
//   phone   (<=720px):  off-canvas drawer + sticky app bar
import { NAV } from './data'

export function Sidebar({
  active,
  onNav,
  open,
  onClose,
}: {
  active: string
  onNav: (id: string) => void
  open: boolean
  onClose: () => void
}) {
  return (
    <>
      {/* drawer backdrop (phone only) */}
      <div
        onClick={onClose}
        className={
          'fixed inset-0 z-[55] bg-[rgba(26,22,21,.42)] transition-opacity duration-[260ms] tab:hidden ' +
          (open ? 'opacity-100' : 'pointer-events-none opacity-0')
        }
      />
      <aside
        className={
          'z-[60] flex flex-col gap-[26px] bg-sage-100 transition-transform duration-[260ms] ' +
          // phone: fixed off-canvas drawer
          'fixed inset-y-0 left-0 h-screen w-[262px] p-[22px_18px] ' +
          (open ? 'translate-x-0 shadow-lg' : '-translate-x-full ') +
          // tablet: static icon rail
          'tab:sticky tab:top-0 tab:h-screen tab:w-20 tab:translate-x-0 tab:gap-[22px] tab:p-[26px_14px] tab:shadow-none ' +
          // desktop: full sidebar
          'wide:w-64 wide:gap-[26px] wide:p-[26px_20px]'
        }
      >
        <div className="flex items-center gap-[10px] px-2 tab:justify-center tab:px-0 wide:justify-start wide:px-2">
          <img src="/fund17-mark.svg" width={30} height={30} alt="Fund17" />
          <span className="text-2xl font-bold tracking-[-.5px] text-green-900 tab:hidden wide:inline">
            Fund17
          </span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV.map((n) => {
            const isActive = active === n.id
            return (
              <button
                key={n.id}
                title={n.label}
                onClick={() => {
                  onNav(n.id)
                  onClose()
                }}
                className={
                  'relative flex w-full items-center gap-[14px] rounded-xl border-0 px-4 py-3 text-left text-[15px] transition-colors duration-150 ' +
                  'tab:justify-center tab:gap-0 tab:px-0 tab:py-[13px] wide:justify-start wide:gap-[14px] wide:px-4 ' +
                  (isActive
                    ? 'bg-lime-400 font-semibold text-green-900 hover:bg-lime-400'
                    : 'bg-transparent font-medium text-ink-500 hover:bg-[rgba(187,244,156,.18)] hover:text-green-900')
                }
              >
                <i className={'ph text-[20px] ' + n.icon} />
                <span className="flex-1 tab:hidden wide:block">{n.label}</span>
                {n.badge && (
                  <span className="ml-auto inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-[5px] text-[11px] font-bold text-white tab:absolute tab:right-[13px] tab:top-[7px] tab:ml-0 tab:h-4 tab:min-w-4 tab:border-2 tab:border-sage-100 tab:px-1 wide:static wide:ml-auto wide:border-0">
                    {n.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}

export function MobileBar({ title, onMenu }: { title: string; onMenu: () => void }) {
  return (
    <div className="sticky top-0 z-40 flex items-center gap-3 bg-sage-100 px-4 py-3 tab:hidden">
      <img src="/fund17-mark.svg" width={26} height={26} alt="Fund17" />
      <span className="flex-1 text-center text-[17px] font-bold tracking-[-.3px] text-green-900">
        {title}
      </span>
      <button
        onClick={onMenu}
        aria-label="Open menu"
        className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-xl border-0 bg-mint-200 text-[23px] text-green-900"
      >
        <i className="ph ph-list" />
      </button>
    </div>
  )
}

export function TopBar({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-[18px] max-lap:flex-wrap">
      <div className="flex-none max-lap:flex-[1_1_auto]">
        <h1 className="m-0 text-[28px] font-bold leading-[1.1] tracking-[-.5px] text-ink-900 max-[640px]:text-[23px]">
          {title}
        </h1>
      </div>
      <div className="ml-auto flex max-w-[440px] flex-1 items-center gap-[10px] rounded-[20px] bg-surface-2 px-[18px] py-3 max-lap:order-5 max-lap:ml-0 max-lap:max-w-none max-lap:flex-[1_1_100%]">
        <i className="ph ph-magnifying-glass text-[19px] text-ink-500" />
        <input
          placeholder="Search accounts, transactions…"
          className="min-w-0 flex-1 border-0 bg-transparent text-[14px] text-ink-900 outline-0 placeholder:text-ink-400"
        />
      </div>
      <div className="relative flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full bg-mint-200">
        <i className="ph ph-chat-circle-dots text-[19px] text-ink-500" />
      </div>
      <div className="relative flex h-[46px] w-[46px] cursor-pointer items-center justify-center rounded-full bg-mint-200">
        <i className="ph ph-bell text-[19px] text-ink-500" />
        <span className="absolute right-[12px] top-[11px] h-2 w-2 rounded-full border-2 border-mint-200 bg-danger" />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-lime-300 text-[16px] font-bold text-green-900 group-data-[shell=dark]/app:bg-lime-400">
          MO
        </div>
      </div>
    </div>
  )
}

export function Select({ label = 'This Month' }: { label?: string }) {
  return (
    <span className="inline-flex cursor-pointer items-center gap-[10px] rounded-[11px] border border-line bg-white px-[14px] py-[9px] text-[13px] font-semibold text-ink-800">
      {label} <i className="ph ph-caret-down text-[14px] text-ink-500" />
    </span>
  )
}

export function Pct({ dir = 'up', children }: { dir?: 'up' | 'dn'; children: React.ReactNode }) {
  return (
    <span
      className={
        'inline-flex items-center gap-[3px] rounded-full px-[9px] py-[3px] text-[11px] font-bold ' +
        (dir === 'up' ? 'bg-success-bg text-green-900' : 'bg-danger-bg text-danger')
      }
    >
      <i className={'ph ' + (dir === 'up' ? 'ph-trend-up' : 'ph-trend-down')} />
      {children}
    </span>
  )
}
