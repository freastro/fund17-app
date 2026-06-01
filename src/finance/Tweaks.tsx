// Fund17 dashboard — Tweaks panel.
// The prototype shipped a design-tool "Tweaks" panel wired to a host postMessage
// protocol; here it's a real, self-contained settings popover backed by local
// state: alert style, shell (light/dark), density, and restore-dismissed.
import { useState } from 'react'

export interface Tweaks {
  alertStyle: 'Cards' | 'List'
  shell: 'Light' | 'Dark'
  density: 'Comfortable' | 'Compact'
}

export const TWEAK_DEFAULTS: Tweaks = {
  alertStyle: 'Cards',
  shell: 'Light',
  density: 'Comfortable',
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  onChange: (v: T) => void
}) {
  const idx = Math.max(0, options.indexOf(value))
  const n = options.length
  return (
    <div className="flex flex-col gap-[5px]">
      <span className="text-[10px] font-semibold uppercase tracking-[.06em] text-ink-500">
        {label}
      </span>
      <div className="relative flex rounded-lg bg-surface-2 p-[2px]">
        <span
          className="absolute inset-y-[2px] rounded-md bg-white shadow-xs transition-[left] duration-150"
          style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`, width: `calc((100% - 4px) / ${n})` }}
        />
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className="relative z-[1] min-h-[26px] flex-1 rounded-md border-0 bg-transparent text-[12px] font-medium text-ink-800"
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

export function TweaksPanel({
  tweaks,
  setTweak,
  onRestore,
}: {
  tweaks: Tweaks
  setTweak: <K extends keyof Tweaks>(key: K, value: Tweaks[K]) => void
  onRestore: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[260px] rounded-[14px] border border-line bg-surface p-4 shadow-lg">
          <div className="mb-3 flex items-center justify-between">
            <b className="text-[13px] font-semibold text-ink-900">Tweaks</b>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close tweaks"
              className="flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent text-ink-500 hover:bg-surface-2 hover:text-ink-900"
            >
              <i className="ph ph-x" />
            </button>
          </div>
          <div className="flex flex-col gap-[14px]">
            <div className="text-[10px] font-semibold uppercase tracking-[.06em] text-ink-400">
              Alerts
            </div>
            <Segmented
              label="Alert style"
              value={tweaks.alertStyle}
              options={['Cards', 'List'] as const}
              onChange={(v) => setTweak('alertStyle', v)}
            />
            <button
              onClick={onRestore}
              className="h-[30px] rounded-lg border-0 bg-green-900 px-3 text-[12px] font-semibold text-white hover:bg-green-700"
            >
              Restore dismissed
            </button>
            <div className="text-[10px] font-semibold uppercase tracking-[.06em] text-ink-400">
              Appearance
            </div>
            <Segmented
              label="Shell"
              value={tweaks.shell}
              options={['Light', 'Dark'] as const}
              onChange={(v) => setTweak('shell', v)}
            />
            <Segmented
              label="Density"
              value={tweaks.density}
              options={['Comfortable', 'Compact'] as const}
              onChange={(v) => setTweak('density', v)}
            />
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle tweaks"
        className="flex h-12 w-12 items-center justify-center rounded-full border-0 bg-green-900 text-[22px] text-lime-400 shadow-green"
      >
        <i className={'ph ' + (open ? 'ph-x' : 'ph-sliders-horizontal')} />
      </button>
    </div>
  )
}
