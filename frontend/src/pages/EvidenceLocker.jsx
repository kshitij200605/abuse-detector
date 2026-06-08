import { motion } from 'framer-motion'
import { Database, Lock, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react'
import { useSentinelStore } from '../store/sentinelStore'
import { SEVERITY_COLORS, PLATFORM_ICONS, formatDate, toxicityColor } from '../utils/helpers'

function EvidenceRow({ evidence, index }) {
  const sev = evidence.severity || evidence.legal_risk_level || 'LOW'
  const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.LOW

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="border-b border-slate-100 hover:bg-sentinel-50/30 transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <span className="text-xs">{PLATFORM_ICONS[evidence.platform] || '📡'}</span>
          <span className="text-xs font-medium text-slate-700">{evidence.platform}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className="text-xs font-bold text-slate-800">@{evidence.username}</span>
      </td>
      <td className="py-3 px-4 max-w-xs">
        <p className="text-xs text-slate-600 truncate">{evidence.original_message}</p>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.round((evidence.toxicity_score || 0) * 100)}%`, backgroundColor: toxicityColor(evidence.toxicity_score) }} />
          </div>
          <span className="text-xs font-semibold tabular-nums" style={{ color: toxicityColor(evidence.toxicity_score) }}>
            {Math.round((evidence.toxicity_score || 0) * 100)}%
          </span>
        </div>
      </td>
      <td className="py-3 px-4">
        <span className={colors.badge}>{evidence.legal_risk_level || 'LOW'}</span>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle className="w-3 h-3 text-cyber-500" />
          <span className="font-mono text-[10px] text-slate-500">{(evidence.evidence_hash || '').slice(0, 16)}…</span>
        </div>
      </td>
      <td className="py-3 px-4 text-xs text-slate-400">{formatDate(evidence.timestamp)}</td>
    </motion.tr>
  )
}

export default function EvidenceLocker() {
  const { events } = useSentinelStore()

  // Use events as evidence (in production, fetch from /api/evidence)
  const toxicEvents = events.filter(e => e.severity && e.severity !== 'NONE' && e.severity !== 'CLEAN')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-sentinel-600" />
            Evidence Locker
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Forensic chain-of-custody records with SHA-256 verification</p>
        </div>
        <div className="flex items-center gap-2 bg-cyber-50 border border-cyber-200 rounded-xl px-4 py-2">
          <Lock className="w-4 h-4 text-cyber-600" />
          <span className="text-sm font-semibold text-cyber-700">{toxicEvents.length} Records Secured</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Evidence', value: toxicEvents.length, icon: Database, color: 'text-sentinel-600 bg-sentinel-50 border-sentinel-200' },
          { label: 'Hash Verified', value: toxicEvents.length, icon: CheckCircle, color: 'text-cyber-600 bg-cyber-50 border-cyber-200' },
          { label: 'Legal Escalations', value: toxicEvents.filter(e => e.legal_risk_level === 'CRITICAL' || e.legal_risk_level === 'HIGH').length, icon: AlertTriangle, color: 'text-danger-600 bg-danger-50 border-danger-200' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className={`glass-card p-4 border ${color.split(' ')[2]}`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color.split(' ')[1]}`}>
                <Icon className={`w-4 h-4 ${color.split(' ')[0]}`} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500">{label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                {['Platform', 'Username', 'Message', 'Toxicity', 'Legal Risk', 'Evidence Hash', 'Timestamp'].map(h => (
                  <th key={h} className="py-3 px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {toxicEvents.map((e, i) => (
                <EvidenceRow key={e.evidence_hash || i} evidence={e} index={i} />
              ))}
            </tbody>
          </table>

          {toxicEvents.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Database className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-sm">No evidence records yet</p>
              <p className="text-xs mt-1">Records will appear as harmful content is detected</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
