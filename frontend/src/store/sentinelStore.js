import { create } from 'zustand'

const MAX_FEED = 200

export const useSentinelStore = create((set, get) => ({
  // Live feed events
  events: [],
  // Analytics
  analytics: {
    total_incidents: 0,
    by_severity: { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
    total_offenders: 0,
    total_evidence: 0,
    by_platform: {},
    by_language: {},
  },
  // WebSocket status
  wsStatus: 'connecting', // connecting | connected | disconnected
  // Recent alerts (CRITICAL + HIGH only)
  alerts: [],

  setWsStatus: (status) => set({ wsStatus: status }),

  addEvent: (event) => set((state) => {
    const newEvents = [event, ...state.events].slice(0, MAX_FEED)

    // Update analytics
    const analytics = { ...state.analytics }
    analytics.total_incidents += 1

    if (event.severity && event.severity !== 'NONE') {
      analytics.by_severity = {
        ...analytics.by_severity,
        [event.severity]: (analytics.by_severity[event.severity] || 0) + 1,
      }
    }

    if (event.platform) {
      analytics.by_platform = {
        ...analytics.by_platform,
        [event.platform]: (analytics.by_platform[event.platform] || 0) + 1,
      }
    }

    if (event.original_language) {
      analytics.by_language = {
        ...analytics.by_language,
        [event.original_language]: (analytics.by_language[event.original_language] || 0) + 1,
      }
    }

    // Add to alerts for CRITICAL/HIGH
    let alerts = state.alerts
    if (event.severity === 'CRITICAL' || event.severity === 'HIGH') {
      alerts = [event, ...alerts].slice(0, 20)
    }

    return { events: newEvents, analytics, alerts }
  }),

  setAnalytics: (data) => set({ analytics: data }),

  clearEvents: () => set({ events: [], alerts: [] }),
}))
