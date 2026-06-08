import { motion, AnimatePresence } from 'framer-motion'
import { SEVERITY_COLORS, PLATFORM_COLORS, PLATFORM_ICONS, formatTimestamp, truncate, toxicityColor } from '../../utils/helpers'
import { AlertTriangle, Globe, Zap, ShieldCheck } from 'lucide-react'

function SeverityBadge({ severity }) {
  const s = severity || 'NONE'
  return <span className={SEVERITY_COLORS[s]?.badge || 'badge-none'}>{s}</span>
}

function ToxicityBar({ score }) {
  const pct = Math.round((score || 0) * 100)
  const color = toxicityColor(score)
  return (
    <div className="flex items-center gap-2">
      <div className="toxicity-bar flex-1">
        <div
          className="toxicity-fill"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  )
}

export function EventCard({ event, compact = false }) {
  const sev = event.severity || 'NONE'
  const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.NONE
  const platColor = PLATFORM_COLORS[event.platform] || 'bg-slate-100 text-slate-600 border-slate-200'
  const platIcon = PLATFORM_ICONS[event.platform] || '📡'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-xl border p-4 ${colors.bg} ${colors.border} transition-shadow hover:shadow-md`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${platColor}`}>
            {platIcon} {event.platform}
          </span>
          <span className="text-xs font-bold text-slate-700">@{event.username}</span>
          <SeverityBadge severity={sev} />
        </div>
        <span className="text-[10px] text-slate-400 whitespace-nowrap tabular-nums">
          {formatTimestamp(event.timestamp)}
        </span>
      </div>

      {/* Message */}
      <p className="text-sm text-slate-800 font-medium mb-2 leading-relaxed">
        "{truncate(event.message, compact ? 80 : 140)}"
      </p>

      {/* Toxicity bar */}
      {event.toxicity_score > 0 && (
        <div className="mb-2">
          <ToxicityBar score={event.toxicity_score} />
        </div>
      )}

      {/* AI explanation */}
      {!compact && event.ai_explanation && sev !== 'NONE' && (
        <div className="mt-2 flex gap-2 text-xs text-slate-600 bg-white/60 rounded-lg p-2.5 border border-white/80">
          <Zap className="w-3.5 h-3.5 text-sentinel-500 mt-0.5 flex-shrink-0" />
          <span>{event.ai_explanation}</span>
        </div>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center gap-3 flex-wrap text-[10px] text-slate-500">
        {event.original_language && (
          <span className="flex items-center gap-1">
            <Globe className="w-3 h-3" /> {event.original_language}
          </span>
        )}
        {event.confidence > 0 && (
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> {Math.round(event.confidence * 100)}% confidence
          </span>
        )}
        {event.moderation_action && event.moderation_action !== 'NONE' && (
          <span className="flex items-center gap-1 text-sentinel-600 font-medium">
            <AlertTriangle className="w-3 h-3" />
            {event.moderation_action.split('+')[0].trim()}
          </span>
        )}
        {event.evidence_hash && (
          <span className="font-mono text-slate-400">{event.evidence_hash.slice(0, 8)}…</span>
        )}
      </div>
    </motion.div>
  )
}

export { SeverityBadge, ToxicityBar }
