import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  AlertTriangle, Shield, Users, Database, Activity,
  TrendingUp, Zap, Globe, Eye, Lock
} from 'lucide-react'
import { useSentinelStore } from '../store/sentinelStore'
import { EventCard } from '../components/common/EventCard'
import { SEVERITY_COLORS, PLATFORM_ICONS, toxicityColor } from '../utils/helpers'

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color, gradient }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="stat-card"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
          <p className={`text-3xl font-extrabold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${gradient}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </motion.div>
  )
}

const SEV_COLORS = ['#f43f5e', '#f97316', '#f59e0b', '#10b981']
const PLATFORM_CHART_COLORS = ['#f97316', '#6366f1', '#ec4899', '#22c55e']

// Build toxicity timeline from last 20 events
function buildTimeline(events) {
  return events.slice(0, 20).reverse().map((e, i) => ({
    name: i + 1,
    score: Math.round((e.toxicity_score || 0) * 100),
  }))
}

export default function Dashboard() {
  const { events, analytics, alerts, wsStatus } = useSentinelStore()

  const sevData = [
    { name: 'CRITICAL', value: analytics.by_severity?.CRITICAL || 0 },
    { name: 'HIGH',     value: analytics.by_severity?.HIGH || 0 },
    { name: 'MEDIUM',   value: analytics.by_severity?.MEDIUM || 0 },
    { name: 'LOW',      value: analytics.by_severity?.LOW || 0 },
  ]

  const platformData = Object.entries(analytics.by_platform || {}).map(([k, v]) => ({
    name: k, count: v
  }))

  const langData = Object.entries(analytics.by_language || {}).map(([k, v]) => ({
    name: k, count: v
  }))

  const timelineData = buildTimeline(events)

  // Top offenders from recent events
  const offenderMap = {}
  events.forEach(e => {
    if (!e.username) return
    offenderMap[e.username] = (offenderMap[e.username] || 0) + 1
  })
  const topOffenders = Object.entries(offenderMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="live-dot" />
          <h2 className="text-xl font-bold text-slate-900">Security Operations Center</h2>
        </div>
        <p className="text-sm text-slate-500">Real-time AI harassment detection across all platforms</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity} label="Total Incidents" value={analytics.total_incidents}
          sub="All platforms combined"
          color="text-sentinel-700" gradient="bg-gradient-to-br from-sentinel-400 to-sentinel-600"
        />
        <StatCard
          icon={AlertTriangle} label="Critical Alerts" value={analytics.by_severity?.CRITICAL || 0}
          sub="Requires immediate action"
          color="text-danger-600" gradient="bg-gradient-to-br from-danger-400 to-danger-600"
        />
        <StatCard
          icon={Users} label="Offenders Tracked" value={analytics.total_offenders}
          sub="Active risk profiles"
          color="text-orange-600" gradient="bg-gradient-to-br from-orange-400 to-orange-600"
        />
        <StatCard
          icon={Database} label="Evidence Stored" value={analytics.total_evidence}
          sub="Forensic records"
          color="text-cyber-600" gradient="bg-gradient-to-br from-cyber-400 to-cyber-600"
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Live Feed — 2/3 width */}
        <div className="xl:col-span-2 space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <h3 className="font-bold text-slate-800">Live Moderation Feed</h3>
              </div>
              <span className="text-xs text-slate-400">{events.length} events captured</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {events.slice(0, 25).map((evt, idx) => (
                  <EventCard key={evt.evidence_hash || idx} event={evt} compact />
                ))}
              </AnimatePresence>
              {events.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">Waiting for live events…</p>
                  <p className="text-xs mt-1">
                    {wsStatus === 'disconnected' ? '⚠️ Backend not connected' : 'Connecting to stream…'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Toxicity Timeline */}
          {timelineData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sentinel-500" />
                Toxicity Timeline
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="toxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" hide />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Toxicity']}
                    contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} fill="url(#toxGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Right panel — 1/3 width */}
        <div className="space-y-4">

          {/* Critical Alerts */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-danger-500" />
              Critical Alerts
              {alerts.length > 0 && (
                <span className="ml-auto bg-danger-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {alerts.length}
                </span>
              )}
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.slice(0, 5).map((a, i) => (
                <div key={i} className="bg-danger-50 border border-danger-100 rounded-lg p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-danger-700">@{a.username}</span>
                    <span className={`badge-${a.severity?.toLowerCase() || 'none'}`}>{a.severity}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1">{a.message}</p>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">No critical alerts yet</p>
              )}
            </div>
          </div>

          {/* Severity Breakdown Pie */}
          <div className="glass-card p-5">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-sentinel-500" />
              Severity Breakdown
            </h3>
            {sevData.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={sevData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {sevData.map((_, i) => <Cell key={i} fill={SEV_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-36 flex items-center justify-center text-slate-300 text-sm">No data yet</div>
            )}
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {sevData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SEV_COLORS[i] }} />
                  <span className="text-slate-600">{d.name}</span>
                  <span className="ml-auto font-bold text-slate-800">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Platform breakdown */}
          {platformData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-sentinel-500" />
                Platform Activity
              </h3>
              <div className="space-y-2">
                {platformData.map((p, i) => {
                  const total = platformData.reduce((s, x) => s + x.count, 0)
                  const pct = total ? Math.round(p.count / total * 100) : 0
                  return (
                    <div key={p.name}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-slate-600">{PLATFORM_ICONS[p.name]} {p.name}</span>
                        <span className="font-bold text-slate-800">{p.count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, backgroundColor: PLATFORM_CHART_COLORS[i % 4] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Top Offenders */}
          {topOffenders.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-danger-500" />
                Top Offenders
              </h3>
              <div className="space-y-2">
                {topOffenders.map(([username, count], i) => (
                  <div key={username} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <span className="flex-1 text-xs font-semibold text-slate-700">@{username}</span>
                    <span className="bg-danger-50 border border-danger-100 text-danger-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {count} events
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
