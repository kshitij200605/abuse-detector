/**
 * Discord Monitor — High-Fidelity Dark Theme Clone
 * Mimics Discord's actual desktop layout:
 *   • Dark server sidebar (icon pills) on far left
 *   • Channel list sidebar on left
 *   • Main message area with clustered messages
 *   • Bot message for AI flagging (SentinelAI Bot#0001)
 *   • Reaction bar on flagged messages
 *   • Discord timestamps (Today at HH:MM AM/PM)
 *   • User roles/tags
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Hash, Volume2, Shield, Bell, Pin, Users, Search,
  Inbox, HelpCircle, Settings, Mic, Headphones, Video,
  ChevronDown, ChevronRight, Plus, Gift, Sticker,
  SmilePlus, Zap, AlertTriangle
} from 'lucide-react'
import { useSentinelStore } from '../store/sentinelStore'
import { SEVERITY_COLORS, toxicityColor, truncate } from '../utils/helpers'

// ── Discord design tokens ────────────────────────────────────────────────────
const DC = {
  bg:          '#313338',   // main background
  sidebar:     '#2b2d31',   // channel sidebar
  serverBar:   '#1e1f22',   // server list far left
  input:       '#383a40',   // message input
  hover:       '#35373c',   // hover state
  selected:    '#404249',   // selected channel
  border:      '#1e1f22',   // dividers
  text:        '#dbdee1',   // primary text
  textMuted:   '#80848e',   // muted text
  textLink:    '#00a8fc',   // link blue
  blurple:     '#5865f2',   // Discord blurple
  green:       '#23a55a',   // online dot
  yellow:      '#f0b232',   // idle dot
  red:         '#f23f43',   // dnd dot
  mentionBg:   '#3d3a23',   // mention highlight background
  mentionBorder: '#f0b232', // mention border
  botBg:       '#2b2d31',   // bot message background
}

// ── Server list (far left icons) ─────────────────────────────────────────────
const SERVERS = [
  { id: 'home',    emoji: '🏠', name: 'Home',          color: DC.blurple },
  { id: 'ig',      emoji: '🇮🇳', name: 'Indian Gamers', color: '#FF9933' },
  { id: 'study',   emoji: '📚', name: 'Study Together', color: '#5865f2' },
  { id: 'cricket', emoji: '🏏', name: 'Cricket Nation', color: '#23a55a' },
  { id: 'anime',   emoji: '🎌', name: 'Anime Central',  color: '#eb459e' },
  { id: 'bwood',   emoji: '🎬', name: 'Bollywood Fans', color: '#f0b232' },
  { id: 'tech',    emoji: '💻', name: 'Tech India',     color: '#00a8fc' },
]

// ── Channels per server ───────────────────────────────────────────────────────
const CHANNELS = {
  INFORMATION: ['rules', 'announcements', 'welcome'],
  TEXT_CHANNELS: ['general', 'memes', 'off-topic', 'help', 'rant', 'politics', 'gaming', 'music', 'study-room'],
  VOICE_CHANNELS: ['General VC', 'Study Room', 'Gaming Lounge'],
}

// ── User colors (deterministic) ───────────────────────────────────────────────
const USER_COLORS = [
  '#5865f2', '#57f287', '#fee75c', '#eb459e', '#ed4245',
  '#00a8fc', '#f0b232', '#23a55a', '#3ba55c', '#faa61a',
]

function getUserColor(username) {
  const hash = (username || 'user').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return USER_COLORS[hash % USER_COLORS.length]
}

function getAvatarInitials(username) {
  return (username || '?')[0].toUpperCase()
}

function formatDiscordTime(isoOrNull) {
  const d = isoOrNull ? new Date(isoOrNull) : new Date()
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  return isToday ? `Today at ${time}` : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' + time
}

// ── Discord Avatar ────────────────────────────────────────────────────────────
function DiscordAvatar({ username, size = 40, color }) {
  const c = color || getUserColor(username)
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold flex-shrink-0 relative"
      style={{ width: size, height: size, backgroundColor: c, fontSize: size * 0.36, color: '#fff' }}
    >
      {getAvatarInitials(username)}
    </div>
  )
}

// ── Bot Avatar ────────────────────────────────────────────────────────────────
function BotAvatar({ size = 40 }) {
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: DC.blurple }}
    >
      <Shield className="text-white" style={{ width: size * 0.5, height: size * 0.5 }} />
    </div>
  )
}

// ── Message Cluster ───────────────────────────────────────────────────────────
function MessageCluster({ event, index, channel }) {
  const [reactions, setReactions] = useState({ '👍': 0, '⚠️': 0, '😡': 0 })

  const sev = event.severity || 'NONE'
  const isHarmful = sev !== 'NONE' && sev !== 'CLEAN'
  const isCritical = sev === 'CRITICAL'
  const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.NONE
  const userColor = getUserColor(event.username)
  const timeStr = formatDiscordTime(event.timestamp)

  // Bot severity roles
  const roles = {
    CRITICAL: { label: 'FLAGGED', color: '#ed4245' },
    HIGH:     { label: 'MONITORED', color: '#f0b232' },
    MEDIUM:   { label: 'REVIEWED', color: '#fee75c' },
    LOW:      { label: 'TRACKED', color: '#57f287' },
  }

  const role = isHarmful ? roles[sev] : null

  return (
    <div className="group">
      {/* ── User message ── */}
      <div
        className="flex gap-4 px-4 py-0.5 rounded-sm transition-colors cursor-default"
        style={{
          backgroundColor: isHarmful
            ? `${sev === 'CRITICAL' ? '#3d1a1a' : sev === 'HIGH' ? '#2d2010' : DC.bg}` 
            : 'transparent',
          borderLeft: isHarmful ? `3px solid ${role?.color || DC.blurple}` : '3px solid transparent',
        }}
      >
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 mt-0.5">
          <DiscordAvatar username={event.username} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Username + role badge + timestamp */}
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-sm font-semibold hover:underline cursor-pointer" style={{ color: userColor }}>
              {event.username}
            </span>
            {/* BOT tag or role */}
            {role && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded text-white"
                style={{ backgroundColor: role.color }}
              >
                {role.label}
              </span>
            )}
            <span className="text-[11px]" style={{ color: DC.textMuted }}>{timeStr}</span>
            {event.original_language && event.original_language !== 'English' && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: '#5865f220', color: DC.blurple, border: `1px solid ${DC.blurple}40` }}
              >
                {event.original_language}
              </span>
            )}
          </div>

          {/* Message text */}
          <p
            className="text-sm leading-relaxed break-words"
            style={{ color: isCritical ? '#fca5a5' : DC.text }}
          >
            {event.message}
          </p>

          {/* Translation */}
          {event.was_translated && event.translated_message !== event.message && (
            <div
              className="mt-1.5 px-3 py-2 rounded text-xs border-l-2"
              style={{ background: '#3d4270', borderColor: DC.blurple, color: '#a5b4fc' }}
            >
              <span style={{ color: DC.textMuted }}>🌐 Translated from {event.original_language}: </span>
              {event.translated_message}
            </div>
          )}

          {/* Reactions row */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {Object.entries(reactions).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => setReactions(r => ({ ...r, [emoji]: r[emoji] + 1 }))}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors"
                style={{
                  background: count > 0 ? '#5865f225' : '#2e3035',
                  border: count > 0 ? `1px solid ${DC.blurple}50` : '1px solid transparent',
                  color: count > 0 ? DC.blurple : DC.textMuted,
                }}
              >
                {emoji} {count > 0 && <span className="font-semibold">{count}</span>}
              </button>
            ))}
            {isHarmful && (
              <button
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: '#2e3035', border: '1px solid transparent', color: DC.textMuted }}
              >
                <SmilePlus className="w-3 h-3" /> Add
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── SentinelAI Bot reply ── */}
      {isHarmful && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="flex gap-4 px-4 py-2 ml-0"
          style={{ background: '#2a2c31', borderLeft: `3px solid ${DC.blurple}` }}
        >
          <div className="flex-shrink-0 w-10 mt-0.5">
            <BotAvatar />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold" style={{ color: DC.blurple }}>SentinelAI</span>
              <span
                className="text-[9px] font-black px-1 py-0.5 rounded"
                style={{ background: DC.blurple, color: '#fff' }}
              >
                BOT
              </span>
              <span className="text-[11px]" style={{ color: DC.textMuted }}>{timeStr}</span>
              {event.detection_source && (
                <span className="text-[9px] ml-auto" style={{ color: DC.textMuted }}>
                  {event.detection_source.replace('huggingface:', 'HF ')}
                </span>
              )}
            </div>

            {/* Embed-style card */}
            <div
              className="rounded-md overflow-hidden border-l-4"
              style={{
                background: '#1e1f22',
                borderLeftColor: sev === 'CRITICAL' ? '#ed4245' : sev === 'HIGH' ? '#f0b232' : '#fee75c',
              }}
            >
              <div className="px-3 py-2">
                <div className="flex items-center gap-2 mb-1.5">
                  <AlertTriangle
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: sev === 'CRITICAL' ? '#ed4245' : '#f0b232' }}
                  />
                  <span
                    className="text-xs font-bold"
                    style={{ color: sev === 'CRITICAL' ? '#ed4245' : '#f0b232' }}
                  >
                    {sev} Severity Detected
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#b5bac1' }}>
                  {event.ai_explanation}
                </p>
                {/* Toxicity bar */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px]" style={{ color: DC.textMuted }}>Toxicity</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#313338' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((event.toxicity_score || 0) * 100)}%`,
                        backgroundColor: toxicityColor(event.toxicity_score || 0)
                      }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold w-8 text-right"
                    style={{ color: toxicityColor(event.toxicity_score || 0) }}
                  >
                    {Math.round((event.toxicity_score || 0) * 100)}%
                  </span>
                </div>
                {event.moderation_action && (
                  <p className="text-[10px] font-semibold mt-1.5" style={{ color: DC.blurple }}>
                    ⚡ Action: {event.moderation_action.split('+')[0].trim()}
                  </p>
                )}
                {event.legal_categories?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {event.legal_categories.slice(0, 2).map((cat, i) => (
                      <span
                        key={i}
                        className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: '#3d1a1a', color: '#fca5a5', border: '1px solid #ed424530' }}
                      >
                        ⚖️ {cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

// ── Main Discord page ─────────────────────────────────────────────────────────
export default function DiscordMonitor() {
  const { events } = useSentinelStore()
  const [activeServer, setActiveServer] = useState('ig')
  const [activeChannel, setActiveChannel] = useState('general')
  const [filter, setFilter] = useState('ALL')
  const [expandedCategories, setExpandedCategories] = useState({ INFORMATION: false, TEXT_CHANNELS: true, VOICE_CHANNELS: false })

  const discordEvents = events.filter(e => e.platform === 'Discord')
  const filtered = filter === 'ALL'
    ? discordEvents
    : discordEvents.filter(e => e.severity === filter)

  const stats = {
    total:    discordEvents.length,
    flagged:  discordEvents.filter(e => e.severity && e.severity !== 'NONE' && e.severity !== 'CLEAN').length,
    servers:  [...new Set(discordEvents.map(e => e.server).filter(Boolean))].length,
    channels: [...new Set(discordEvents.map(e => e.channel).filter(Boolean))].length,
  }

  const currentServer = SERVERS.find(s => s.id === activeServer) || SERVERS[1]

  // Get events for active channel
  const channelEvents = filtered.filter(e =>
    !e.channel || e.channel === activeChannel || e.channel === `#${activeChannel}`
  )

  // If no events for this channel, show all
  const displayEvents = channelEvents.length > 0 ? channelEvents : filtered.slice(0, 20)

  return (
    <div
      className="rounded-2xl overflow-hidden flex"
      style={{ background: DC.bg, minHeight: '70vh', fontFamily: '"gg sans", system-ui, sans-serif' }}
    >
      {/* ── Server list (far left) ── */}
      <div
        className="flex flex-col items-center py-3 gap-2 flex-shrink-0"
        style={{ width: 72, background: DC.serverBar, borderRight: `1px solid ${DC.border}` }}
      >
        {/* Home button */}
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center transition-all text-white text-xl mb-1"
          style={{ background: DC.blurple }}
        >
          🛡️
        </button>
        {/* Divider */}
        <div className="w-8 h-0.5 rounded-full" style={{ background: DC.border }} />
        {/* Server icons */}
        {SERVERS.slice(1).map(server => (
          <div key={server.id} className="relative group">
            <button
              onClick={() => setActiveServer(server.id)}
              className="w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all"
              style={{
                background: activeServer === server.id ? server.color : DC.sidebar,
                borderRadius: activeServer === server.id ? '30%' : '50%',
              }}
              title={server.name}
            >
              {server.emoji}
            </button>
            {/* Active indicator pill */}
            {activeServer === server.id && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 w-1 h-8 rounded-full"
                style={{ background: '#fff' }}
              />
            )}
            {/* Tooltip */}
            <div
              className="absolute left-14 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs font-semibold px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50"
              style={{ background: DC.serverBar, color: DC.text }}
            >
              {server.name}
            </div>
          </div>
        ))}
        <button
          className="w-12 h-12 rounded-full flex items-center justify-center text-xl mt-1"
          style={{ background: DC.sidebar, color: '#23a55a' }}
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* ── Channel list sidebar ── */}
      <div
        className="flex flex-col flex-shrink-0"
        style={{ width: 240, background: DC.sidebar, borderRight: `1px solid ${DC.border}` }}
      >
        {/* Server name header */}
        <div
          className="px-4 py-3 flex items-center justify-between border-b cursor-pointer hover:bg-black/10 transition-colors"
          style={{ borderColor: DC.border }}
        >
          <span className="font-bold text-sm" style={{ color: DC.text }}>{currentServer.name}</span>
          <ChevronDown className="w-4 h-4" style={{ color: DC.textMuted }} />
        </div>

        {/* Channel categories */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {Object.entries(CHANNELS).map(([category, channels]) => (
            <div key={category} className="mb-4">
              <button
                onClick={() => setExpandedCategories(s => ({ ...s, [category]: !s[category] }))}
                className="flex items-center gap-1 w-full px-1 mb-1"
                style={{ color: DC.textMuted }}
              >
                <ChevronRight
                  className="w-3 h-3 transition-transform"
                  style={{ transform: expandedCategories[category] ? 'rotate(90deg)' : 'rotate(0)' }}
                />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {category.replace('_', ' ')}
                </span>
              </button>

              {expandedCategories[category] && channels.map(ch => {
                const isVoice = category === 'VOICE_CHANNELS'
                const isActive = activeChannel === ch && !isVoice
                const channelEventCount = discordEvents.filter(e =>
                  e.channel === ch || e.channel === `#${ch}`
                ).length

                return (
                  <button
                    key={ch}
                    onClick={() => !isVoice && setActiveChannel(ch)}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md text-sm transition-colors text-left"
                    style={{
                      background: isActive ? DC.selected : 'transparent',
                      color: isActive ? DC.text : DC.textMuted,
                    }}
                  >
                    {isVoice
                      ? <Volume2 className="w-4 h-4 flex-shrink-0" />
                      : <Hash className="w-4 h-4 flex-shrink-0" />
                    }
                    <span className="flex-1 truncate">{ch}</span>
                    {channelEventCount > 0 && !isVoice && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                        style={{ background: '#ed4245' }}
                      >
                        {channelEventCount}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* User bar */}
        <div
          className="flex items-center gap-2 px-2 py-2 border-t"
          style={{ background: '#232428', borderColor: DC.border }}
        >
          <div className="relative">
            <DiscordAvatar username="SentinelBot" size={32} color={DC.blurple} />
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
              style={{ background: DC.green, borderColor: '#232428' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: DC.text }}>SentinelAI</p>
            <p className="text-[10px] truncate" style={{ color: DC.textMuted }}>Bot · Monitoring</p>
          </div>
          <div className="flex gap-1">
            <button><Mic className="w-4 h-4" style={{ color: DC.textMuted }} /></button>
            <button><Headphones className="w-4 h-4" style={{ color: DC.textMuted }} /></button>
            <button><Settings className="w-4 h-4" style={{ color: DC.textMuted }} /></button>
          </div>
        </div>
      </div>

      {/* ── Main message area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b flex-shrink-0"
          style={{ background: DC.bg, borderColor: DC.border }}
        >
          <Hash className="w-5 h-5 flex-shrink-0" style={{ color: DC.textMuted }} />
          <span className="font-bold" style={{ color: DC.text }}>{activeChannel}</span>
          <div className="w-px h-5 mx-1" style={{ background: DC.border }} />
          <span className="text-xs" style={{ color: DC.textMuted }}>
            AI-moderated channel · {displayEvents.length} messages
          </span>

          {/* Header icons */}
          <div className="ml-auto flex items-center gap-3">
            {/* Severity filter pills */}
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-[10px] font-bold px-2 py-1 rounded-full transition-all"
                style={{
                  background: filter === f
                    ? f === 'CRITICAL' ? '#ed4245' : f === 'HIGH' ? '#f0b232' : f === 'MEDIUM' ? '#fee75c' : DC.blurple
                    : DC.input,
                  color: filter === f ? '#fff' : DC.textMuted,
                }}
              >
                {f}
              </button>
            ))}
            <button><Bell className="w-5 h-5" style={{ color: DC.textMuted }} /></button>
            <button><Pin className="w-5 h-5" style={{ color: DC.textMuted }} /></button>
            <button><Users className="w-5 h-5" style={{ color: DC.textMuted }} /></button>
            <div
              className="flex items-center gap-2 bg-opacity-50 rounded-md px-2 py-1"
              style={{ background: DC.input }}
            >
              <Search className="w-3.5 h-3.5" style={{ color: DC.textMuted }} />
              <span className="text-xs" style={{ color: DC.textMuted }}>Search</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-1">
          {/* Channel welcome banner */}
          <div className="px-4 mb-6">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{ background: DC.blurple }}
            >
              <Hash className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black mb-1" style={{ color: DC.text }}>
              Welcome to #{activeChannel}!
            </h2>
            <p className="text-sm" style={{ color: DC.textMuted }}>
              This is the beginning of the #{activeChannel} channel. SentinelAI is monitoring all messages in real-time.
            </p>
            <div
              className="mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-md border"
              style={{ background: DC.botBg, borderColor: DC.blurple + '40', color: DC.textMuted }}
            >
              <Shield className="w-3.5 h-3.5 flex-shrink-0" style={{ color: DC.blurple }} />
              <span><strong style={{ color: DC.blurple }}>SentinelAI Bot</strong> is active — detecting harassment, threats, and harmful content in real-time using toxic-bert AI.</span>
            </div>
          </div>

          <AnimatePresence initial={false}>
            {displayEvents.length === 0 ? (
              <div className="px-4 py-16 text-center">
                <Zap className="w-12 h-12 mx-auto mb-4" style={{ color: DC.textMuted }} />
                <p style={{ color: DC.textMuted }} className="text-sm">
                  {discordEvents.length === 0
                    ? 'Waiting for Discord messages…'
                    : `No ${filter !== 'ALL' ? filter : ''} messages in #${activeChannel}`}
                </p>
                <p className="text-xs mt-1" style={{ color: DC.textMuted }}>
                  {discordEvents.length === 0 && 'Simulator is generating content…'}
                </p>
              </div>
            ) : (
              displayEvents.map((evt, idx) => (
                <MessageCluster
                  key={evt.evidence_hash || idx}
                  event={evt}
                  index={idx}
                  channel={activeChannel}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Message input bar */}
        <div className="px-4 pb-4 flex-shrink-0">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ background: DC.input }}
          >
            <Plus className="w-5 h-5 flex-shrink-0" style={{ color: DC.textMuted }} />
            <span className="flex-1 text-sm" style={{ color: DC.textMuted }}>
              Message #{activeChannel}
            </span>
            <div className="flex items-center gap-2" style={{ color: DC.textMuted }}>
              <Gift className="w-5 h-5" />
              <Sticker className="w-5 h-5" />
              <SmilePlus className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[10px] mt-1 text-center" style={{ color: DC.textMuted }}>
            Read-only · SentinelAI monitoring mode
          </p>
        </div>
      </div>
    </div>
  )
}
