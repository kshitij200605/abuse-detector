import { motion } from 'framer-motion'
import { Users, TrendingUp, Shield, AlertTriangle, Eye } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useSentinelStore } from '../store/sentinelStore'
import { PLATFORM_ICONS, toxicityColor, SEVERITY_COLORS } from '../utils/helpers'

function RiskMeter({ score }) {
  const pct = Math.round(score * 100)
  const color = toxicityColor(score)
  const label = score >= 0.7 ? 'CRITICAL' : score >= 0.5 ? 'HIGH' : score >= 0.3 ? 'MEDIUM' : 'LOW'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">Risk Score</span>
        <span className="font-bold" style={{ color }}>{pct}% · {label}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function OffenderCard({ username, events, index }) {
  const incidents = events.filter(e => e.username === username)
  const avgToxicity = incidents.reduce((s, e) => s + (e.toxicity_score || 0), 0) / (incidents.length || 1)
  const maxSev = incidents.reduce((max, e) => {
    const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, NONE: 0, CLEAN: 0 }
    return (order[e.severity] || 0) > (order[max] || 0) ? e.severity : max
  }, 'NONE')
  const riskScore = Math.min(1, avgToxicity * (1 + incidents.length * 0.05))
  const colors = SEVERITY_COLORS[maxSev] || SEVERITY_COLORS.NONE

  // Chart data from toxicity history
  const chartData = incidents.slice(0, 10).reverse().map((e, i) => ({
    x: i + 1,
    y: Math.round((e.toxicity_score || 0) * 100),
  }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card p-5 border ${colors.border}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-xl flex-shrink-0">
          {username?.[0]?.toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-900">@{username}</span>
            <span className={colors.badge}>{maxSev}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="font-extrabold text-slate-900 text-lg">{incidents.length}</div>
              <div className="text-slate-500">Incidents</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="font-extrabold text-lg" style={{ color: toxicityColor(avgToxicity) }}>
                {Math.round(avgToxicity * 100)}%
              </div>
              <div className="text-slate-500">Avg Toxicity</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2 text-center">
              <div className="font-extrabold text-slate-900 text-lg">
                {[...new Set(incidents.map(e => e.platform))].length}
              </div>
              <div className="text-slate-500">Platforms</div>
            </div>
          </div>

          <RiskMeter score={riskScore} />

          {/* Behavior trend */}
          {chartData.length >= 3 && (
            <div className="mt-3">
              <p className="text-[10px] text-slate-400 mb-1">Toxicity Trend</p>
              <ResponsiveContainer width="100%" height={50}>
                <LineChart data={chartData}>
                  <Line type="monotone" dataKey="y" stroke={toxicityColor(avgToxicity)} strokeWidth={2} dot={false} />
                  <Tooltip contentStyle={{ fontSize: 10 }} formatter={v => [`${v}%`]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Platforms */}
          <div className="mt-2 flex gap-1 flex-wrap">
            {[...new Set(incidents.map(e => e.platform))].map(p => (
              <span key={p} className="text-[10px] bg-slate-100 rounded px-1.5 py-0.5 text-slate-500">
                {PLATFORM_ICONS[p]} {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function OffenderProfiles() {
  const { events } = useSentinelStore()

  // Build unique offender list from events
  const offenderMap = {}
  events.forEach(e => {
    if (!e.username || e.severity === 'NONE' || e.severity === 'CLEAN') return
    if (!offenderMap[e.username]) offenderMap[e.username] = 0
    offenderMap[e.username]++
  })

  const offenders = Object.keys(offenderMap).sort((a, b) => offenderMap[b] - offenderMap[a])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sentinel-600" />
            Offender Profiles
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">Reputation tracking, risk scoring & behavior analysis</p>
        </div>
        <div className="flex items-center gap-2 bg-danger-50 border border-danger-200 rounded-xl px-4 py-2">
          <Eye className="w-4 h-4 text-danger-600" />
          <span className="text-sm font-semibold text-danger-700">{offenders.length} Active Profiles</span>
        </div>
      </div>

      {offenders.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {offenders.map((username, idx) => (
            <OffenderCard key={username} username={username} events={events} index={idx} />
          ))}
        </div>
      ) : (
        <div className="glass-card p-16 text-center text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm">No offender profiles yet</p>
          <p className="text-xs mt-1">Profiles are created as harmful content is detected</p>
        </div>
      )}
    </div>
  )
}
