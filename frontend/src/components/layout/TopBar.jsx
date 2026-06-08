import { useLocation } from 'react-router-dom'
import { Bell, Search, Shield } from 'lucide-react'
import { useSentinelStore } from '../../store/sentinelStore'

const PAGE_TITLES = {
  '/':          { title: 'SOC Dashboard',      subtitle: 'Real-time moderation monitoring center' },
  '/instagram': { title: 'Instagram Monitor',  subtitle: 'AI-powered feed moderation' },
  '/whatsapp':  { title: 'WhatsApp Monitor',   subtitle: 'Live chat harassment detection' },
  '/offenders': { title: 'Offender Profiles',  subtitle: 'Reputation tracking & risk scoring' },
  '/evidence':  { title: 'Evidence Locker',    subtitle: 'Forensic chain-of-custody records' },
  '/forensics': { title: 'Forensics Center',   subtitle: 'Digital forensic investigation suite' },
}

export default function TopBar() {
  const location = useLocation()
  const { alerts, analytics } = useSentinelStore()
  const page = PAGE_TITLES[location.pathname] || { title: 'SentinelAI', subtitle: '' }
  const criticalCount = analytics.by_severity?.CRITICAL || 0

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-slate-100 z-30 flex items-center px-6 gap-4">
      {/* Page info */}
      <div className="flex-1">
        <h2 className="text-base font-bold text-slate-900 leading-none">{page.title}</h2>
        <p className="text-xs text-slate-400 mt-0.5">{page.subtitle}</p>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 bg-cyber-50 border border-cyber-200 rounded-full px-3 py-1.5">
        <span className="live-dot" />
        <span className="text-xs font-semibold text-cyber-700">LIVE</span>
      </div>

      {/* Alert bell */}
      <button
        id="alert-bell-btn"
        className="relative p-2.5 rounded-xl hover:bg-slate-100 transition-colors"
        title="Critical Alerts"
      >
        <Bell className="w-4.5 h-4.5 text-slate-500" />
        {criticalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {criticalCount > 9 ? '9+' : criticalCount}
          </span>
        )}
      </button>

      {/* User avatar */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sentinel-400 to-sentinel-600 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-slate-900 leading-none">SOC Analyst</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Admin</p>
        </div>
      </div>
    </header>
  )
}
