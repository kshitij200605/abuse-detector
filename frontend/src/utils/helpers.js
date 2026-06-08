export const SEVERITY_COLORS = {
  CRITICAL: { bg: 'bg-danger-50',  border: 'border-danger-200',  text: 'text-danger-700',  badge: 'badge-critical', dot: 'bg-danger-500',  bar: 'bg-danger-500'  },
  HIGH:     { bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700',  badge: 'badge-high',     dot: 'bg-orange-500', bar: 'bg-orange-500'  },
  MEDIUM:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   badge: 'badge-medium',   dot: 'bg-amber-400', bar: 'bg-amber-400' },
  LOW:      { bg: 'bg-cyber-50',   border: 'border-cyber-200',   text: 'text-cyber-700',   badge: 'badge-low',      dot: 'bg-cyber-500',  bar: 'bg-cyber-500'   },
  NONE:     { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-500',   badge: 'badge-none',     dot: 'bg-slate-400',  bar: 'bg-slate-400'   },
  CLEAN:    { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-500',   badge: 'badge-clean',    dot: 'bg-slate-400',  bar: 'bg-slate-300'   },
}

export const PLATFORM_ICONS = {
  Reddit:    '🔴',
  Discord:   '💬',
  Instagram: '📸',
  WhatsApp:  '💚',
  manual:    '⌨️',
}

export const PLATFORM_COLORS = {
  Reddit:    'bg-orange-100 text-orange-700 border-orange-200',
  Discord:   'bg-indigo-100 text-indigo-700 border-indigo-200',
  Instagram: 'bg-pink-100 text-pink-700 border-pink-200',
  WhatsApp:  'bg-green-100 text-green-700 border-green-200',
  manual:    'bg-slate-100 text-slate-600 border-slate-200',
}

export function formatTimestamp(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN')
}

export function severityLabel(sev) {
  return sev || 'NONE'
}

export function truncate(str, n = 80) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function toxicityColor(score) {
  if (score >= 0.85) return '#f43f5e'
  if (score >= 0.70) return '#f97316'
  if (score >= 0.45) return '#f59e0b'
  if (score >= 0.20) return '#10b981'
  return '#94a3b8'
}
