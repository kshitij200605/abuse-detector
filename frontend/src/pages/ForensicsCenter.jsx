import { motion } from 'framer-motion'
import { FileSearch, Shield, AlertTriangle, CheckCircle, Download, Hash, GitBranch, Search } from 'lucide-react'
import { useSentinelStore } from '../store/sentinelStore'
import { SEVERITY_COLORS, PLATFORM_ICONS, formatDate, toxicityColor } from '../utils/helpers'

function InvestigationCard({ event, index }) {
  const sev = event.severity || 'HIGH'
  const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.HIGH

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`glass-card p-5 border-l-4 ${colors.border}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={colors.badge}>{sev}</span>
            <span className="text-xs text-slate-500">{PLATFORM_ICONS[event.platform]} {event.platform}</span>
            <span className="text-xs font-bold text-slate-700">@{event.username}</span>
          </div>

          <p className="text-sm text-slate-800 font-medium mb-2">"{event.message}"</p>

          {/* Legal mapping */}
          {event.legal_categories?.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
              <p className="text-[10px] font-bold text-red-700 mb-1.5 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> CYBER LAW RISK ASSESSMENT
              </p>
              {event.legal_categories.slice(0, 2).map((cat, i) => (
                <p key={i} className="text-[10px] text-red-600">• {cat}</p>
              ))}
            </div>
          )}

          {/* Evidence hash */}
          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-2.5">
            <Hash className="w-3 h-3 text-slate-400" />
            <span className="font-mono text-[10px] text-slate-500">{event.evidence_hash}</span>
            <CheckCircle className="w-3 h-3 text-cyber-500 ml-auto" />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5">
          <button
            id={`forensics-report-${index}`}
            className="flex items-center gap-1.5 bg-sentinel-50 border border-sentinel-200 text-sentinel-700 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-sentinel-100 transition-colors"
          >
            <Download className="w-3 h-3" />
            Report
          </button>
          <button
            id={`forensics-investigate-${index}`}
            className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Search className="w-3 h-3" />
            Probe
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function ForensicsCenter() {
  const { events } = useSentinelStore()

  const highRisk = events.filter(e =>
    e.severity === 'CRITICAL' || e.severity === 'HIGH'
  )

  const tools = [
    { name: 'Maltego', desc: 'Relationship mapping & investigation graphs', status: 'Ready', icon: GitBranch },
    { name: 'Sherlock', desc: 'Username footprint analysis across platforms', status: 'Ready', icon: Search },
    { name: 'OSINT Engine', desc: 'Automated intelligence gathering', status: 'Active', icon: Shield },
    { name: 'YARA Scanner', desc: 'Harassment pattern signature matching', status: 'Active', icon: FileSearch },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <FileSearch className="w-5 h-5 text-sentinel-600" />
          Digital Forensics & Investigation Center
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">Cybercrime investigation, OSINT tools & forensic evidence analysis</p>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {tools.map(({ name, desc, status, icon: Icon }, i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sentinel-100 to-sentinel-200 flex items-center justify-center mb-3">
              <Icon className="w-4 h-4 text-sentinel-600" />
            </div>
            <p className="text-sm font-bold text-slate-900">{name}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{desc}</p>
            <div className={`mt-3 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${status === 'Active' ? 'bg-cyber-100 text-cyber-700' : 'bg-slate-100 text-slate-600'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'Active' ? 'bg-cyber-500' : 'bg-slate-400'}`} />
              {status}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chain of Custody info */}
      <div className="glass-card p-5 border border-sentinel-100 bg-gradient-to-r from-sentinel-50/50 to-transparent">
        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Hash className="w-4 h-4 text-sentinel-500" />
          Chain of Custody Protocol
        </h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { step: '01', label: 'Detection', desc: 'AI detects harmful content' },
            { step: '02', label: 'Hashing', desc: 'SHA-256 hash generated' },
            { step: '03', label: 'Storage', desc: 'Immutable forensic log' },
            { step: '04', label: 'Verification', desc: 'Tamper detection active' },
          ].map(({ step, label, desc }) => (
            <div key={step} className="text-center">
              <div className="w-8 h-8 bg-sentinel-100 text-sentinel-700 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-2">{step}</div>
              <p className="text-xs font-semibold text-slate-800">{label}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Investigation queue */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger-500" />
            Investigation Queue
            <span className="bg-danger-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{highRisk.length}</span>
          </h3>
        </div>

        <div className="space-y-3">
          {highRisk.slice(0, 10).map((e, i) => (
            <InvestigationCard key={e.evidence_hash || i} event={e} index={i} />
          ))}
          {highRisk.length === 0 && (
            <div className="glass-card p-12 text-center text-slate-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 text-cyber-300" />
              <p className="text-sm">Investigation queue is empty</p>
              <p className="text-xs mt-1">Critical and High severity incidents will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
