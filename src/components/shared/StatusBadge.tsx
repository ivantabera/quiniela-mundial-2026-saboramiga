import type { QuinielaStatus } from '@/lib/utils/quiniela-status'

interface Props {
  status: QuinielaStatus
  label: string
  large?: boolean
}

const CONFIG: Record<QuinielaStatus, { dot: string; badge: string; icon: string }> = {
  open:         { dot: 'bg-pitch-400',  badge: 'badge-open',    icon: '🟢' },
  warning:      { dot: 'bg-orange-400', badge: 'badge-warning', icon: '🟡' },
  closing_soon: { dot: 'bg-red-400',    badge: 'badge-closing', icon: '🔴' },
  closed:       { dot: 'bg-gray-500',   badge: 'badge-closed',  icon: '🔒' },
}

export default function StatusBadge({ status, label, large = false }: Props) {
  const c = CONFIG[status]
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider border ${c.badge} ${large ? 'text-sm px-5 py-2' : ''}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} ${status !== 'closed' ? 'animate-pulse' : ''}`} />
      {label}
    </span>
  )
}
