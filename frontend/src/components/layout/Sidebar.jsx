import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Camera, MessageCircle, Shield, Users,
  Database, FileSearch, Cpu, MessageSquare, Radio
} from 'lucide-react'
import { useSentinelStore } from '../../store/sentinelStore'

const NAV = [
  { path: '/',          icon: LayoutDashboard, label: 'SOC Dashboard',    group: 'MONITORING' },
  { path: '/instagram', icon: Camera,          label: 'Instagram Feed',   group: 'MONITORING' },
  { path: '/whatsapp',  icon: MessageCircle,   label: 'WhatsApp Chat',    group: 'MONITORING' },
  { path: '/reddit',    icon: MessageSquare,   label: 'Reddit Monitor',   group: 'MONITORING' },
  { path: '/discord',   icon: Radio,           label: 'Discord Bot',      group: 'MONITORING' },
  { path: '/offenders', icon: Users,           label: 'Offender Profiles',group: 'INVESTIGATION' },
  { path: '/evidence',  icon: Database,        label: 'Evidence Locker',  group: 'INVESTIGATION' },
  { path: '/forensics', icon: FileSearch,      label: 'Forensics Center', group: 'INVESTIGATION' },
]

const GROUPS = ['MONITORING', 'INVESTIGATION']

// Severity badge colors using plain Tailwind (no custom palette classes)
const SEV_STYLES = {
  Critical: 'text-red-600 bg-red-50',
  High:     'text-orange-600 bg-orange-50',
  Medium:   'text-amber-600 bg-amber-50',
  Low:      'text-emerald-600 bg-emerald-50',
}

export default function Sidebar() {
  const { wsStatus, analytics } = useSentinelStore()

  const statusColor =
    wsStatus === 'connected'    ? 'bg-emerald-500' :
    wsStatus === 'connecting'   ? 'bg-amber-400'   : 'bg-red-500'
  const statusLabel =
    wsStatus === 'connected'    ? 'Live' :
    wsStatus === 'connecting'   ? 'Connecting…' : 'Disconnected'

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 shadow-sm z-40 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sentinel-500 to-sentinel-700 flex items-center justify-center shadow-glow-sentinel">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">SentinelAI</h1>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium tracking-wide uppercase">Cyber Moderation</p>
          </div>
        </div>

        {/* Connection status */}
        <div className="mt-4 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
          <span className={`w-2 h-2 rounded-full ${statusColor} animate-pulse`} />
          <span className="text-xs text-slate-600 font-medium">{statusLabel}</span>
          <span className="ml-auto text-xs text-slate-400">{analytics.total_incidents} events</span>
        </div>

        {/* Level badge */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-sentinel-600 bg-sentinel-50 rounded-lg px-3 py-1.5">
          <Cpu className="w-3 h-3" />
          <span className="font-semibold">AI Engine v2.0 · Level 2</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-5">
        {GROUPS.map(group => (
          <div key={group}>
            <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-2 px-2 uppercase">{group}</p>
            <div className="space-y-0.5">
              {NAV.filter(n => n.group === group).map(({ path, icon: Icon, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-4 h-4 ${isActive ? 'text-sentinel-600' : 'text-slate-400'}`} />
                      <span>{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Severity quick stats */}
      <div className="p-4 border-t border-slate-100">
        <p className="text-[10px] font-bold text-slate-400 tracking-widest mb-3 uppercase">Severity Overview</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: 'Critical', val: analytics.by_severity?.CRITICAL || 0, style: SEV_STYLES.Critical },
            { label: 'High',     val: analytics.by_severity?.HIGH     || 0, style: SEV_STYLES.High },
            { label: 'Medium',   val: analytics.by_severity?.MEDIUM   || 0, style: SEV_STYLES.Medium },
            { label: 'Low',      val: analytics.by_severity?.LOW      || 0, style: SEV_STYLES.Low },
          ].map(({ label, val, style }) => (
            <div key={label} className={`rounded-lg px-2 py-1.5 text-center ${style}`}>
              <div className="text-lg font-bold leading-none">{val}</div>
              <div className="text-[10px] font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
