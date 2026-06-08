/**
 * WhatsApp Android Dark Theme Clone
 * High-fidelity simulation with contacts, groups, and AI moderation overlays.
 * Color palette matches the official WhatsApp Android dark mode exactly.
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search, MoreVertical, Phone, Video, ArrowLeft,
  Send, Smile, Paperclip, Mic, Shield, AlertTriangle,
  CheckCheck, Check, Users, Camera, ChevronDown,
} from 'lucide-react'
import { useSentinelStore } from '../store/sentinelStore'
import { toxicityColor } from '../utils/helpers'

// ─── WA Dark Theme Palette ───────────────────────────────────────────────────
const WA = {
  bg:           '#0b141a',   // outermost background
  panel:        '#111b21',   // chat list background
  header:       '#202c33',   // action bars & input bars
  bubble_sent:  '#005c4b',   // sent message bubble
  bubble_recv:  '#202c33',   // received message bubble
  accent:       '#00a884',   // green ticks, icons, active states
  text_primary: '#e9edef',   // primary text (white-ish)
  text_muted:   '#8696a0',   // timestamps, secondary text
  text_green:   '#00a884',   // sender name in groups
  divider:      '#222d34',   // divider lines
  unread_bg:    '#00a884',   // unread badge
  search_bg:    '#2a3942',   // search input background
  hover:        '#2a3942',   // hover highlight on list items
  alert_bg:     '#1a1a2e',   // AI alert card background
  alert_border: '#f43f5e',   // critical border
}

// ─── Static Chat Roster ───────────────────────────────────────────────────────
const CONTACTS = [
  {
    id: 'college_group',
    name: 'College Group 🎓',
    avatar: '🎓',
    type: 'group',
    members: ['Amit Sharma', 'Neha Gupta', 'Karan Malhotra', 'Class Monitor Riya', 'toxic_chat_user'],
    description: 'CS Batch 2026 – 34 members',
    platforms: ['WhatsApp'],
  },
  {
    id: 'gossip_club',
    name: 'Gossip Club 🗣️',
    avatar: '🗣️',
    type: 'group',
    members: ['toxic_chat_user', 'troll_member', 'repeat_offender_wa', 'harasser_bot_wa'],
    description: 'Private group – 12 members',
    platforms: ['WhatsApp'],
  },
  {
    id: 'rahul_sharma',
    name: 'Amit Sharma',
    avatar: '👦',
    type: 'dm',
    members: ['Amit Sharma'],
    description: 'Hey there! I am using WhatsApp.',
    platforms: ['WhatsApp'],
  },
  {
    id: 'priya_mehta',
    name: 'Sunita Sharma',
    avatar: '👧',
    type: 'dm',
    members: ['Sunita Sharma'],
    description: 'Busy right now 🔕',
    platforms: ['WhatsApp'],
  },
  {
    id: 'gaming_squad',
    name: 'Office Cricket Group 🏏',
    avatar: '🏏',
    type: 'group',
    members: ['Sanjay Kumar', 'Vikram Malhotra', 'Pooja Verma', 'Sales Lead Vivek'],
    description: 'Corporate tournament team – 8 members',
    platforms: ['WhatsApp'],
  },
  {
    id: 'anon_x',
    name: 'Unknown Sender ❓',
    avatar: '💀',
    type: 'dm',
    members: ['harasser_bot_wa', 'anonymous_sender'],
    description: '',
    platforms: ['WhatsApp'],
  },
  {
    id: 'music_lovers',
    name: 'Music Lovers 🎵',
    avatar: '🎵',
    type: 'group',
    members: ['Marie Dubois', 'Yuki Tanaka', 'Juan Carlos', 'Abdur Rahman'],
    description: 'Share songs & vibes – 22 members',
    platforms: ['WhatsApp'],
  },
]

// Statically pre-seeded history per chat (to populate immediately)
const SEED_MESSAGES = {
  college_group: [
    { id: 's1', username: 'Neha Gupta',    text: 'Hey guys, anyone done the DSA assignment?',                  time: '10:12', isOwn: false, isClean: true },
    { id: 's2', username: 'Karan Malhotra', text: 'Yeah I submitted it last night 😅',                          time: '10:13', isOwn: false, isClean: true },
    { id: 's3', username: 'You',           text: 'Still on it. What was the last question about?',             time: '10:14', isOwn: true,  isClean: true },
    { id: 's4', username: 'Amit Sharma',    text: 'Graph traversal bro, DFS + BFS 😭',                          time: '10:15', isOwn: false, isClean: true },
  ],
  gossip_club: [
    { id: 's1', username: 'toxic_chat_user',     text: 'tu 6000 mai aayegi idhar, slut',             time: '09:45', isOwn: false, isClean: false, severity: 'CRITICAL' },
    { id: 's2', username: 'repeat_offender_wa',  text: 'nobody wants you here, just leave',          time: '09:47', isOwn: false, isClean: false, severity: 'MEDIUM' },
    { id: 's3', username: 'You',                 text: '(AI Moderation Active – monitoring chat)',   time: '09:48', isOwn: true,  isClean: true },
  ],
  rahul_sharma: [
    { id: 's1', username: 'Amit Sharma', text: 'Hey! Are you free this evening?',              time: '11:02', isOwn: false, isClean: true },
    { id: 's2', username: 'You',         text: 'Yeah should be, what\'s up?',                  time: '11:03', isOwn: true,  isClean: true },
    { id: 's3', username: 'Amit Sharma', text: 'Let\'s catch the IPL match tonight 🏏',        time: '11:04', isOwn: false, isClean: true },
    { id: 's4', username: 'You',         text: 'Absolutely! CSK vs MI?',                       time: '11:04', isOwn: true,  isClean: true },
    { id: 's5', username: 'Amit Sharma', text: 'Yep! It\'s going to be insane 🔥',             time: '11:05', isOwn: false, isClean: true },
  ],
  priya_mehta: [
    { id: 's1', username: 'Sunita Sharma', text: 'Just finished reading that book you recommended! Loved it 🥰', time: '08:30', isOwn: false, isClean: true },
    { id: 's2', username: 'You',           text: 'Right?! The ending hits different the second time.',            time: '08:31', isOwn: true,  isClean: true },
    { id: 's3', username: 'Sunita Sharma', text: 'Studying for finals now, wish me luck!',                       time: '09:00', isOwn: false, isClean: true },
  ],
  gaming_squad: [
    { id: 's1', username: 'Sales Lead Vivek', text: 'I\'ll make you regret this in the next match, mark my words', time: '07:20', isOwn: false, isClean: false, severity: 'HIGH' },
    { id: 's2', username: 'Vikram Malhotra',   text: 'great game today bro! that clutch was insane 🔥',             time: '07:22', isOwn: false, isClean: true },
    { id: 's3', username: 'You',               text: 'GG everyone! Same time tomorrow?',                            time: '07:23', isOwn: true,  isClean: true },
    { id: 's4', username: 'Pooja Verma',       text: 'you\'re pathetic and worthless at this game',                time: '07:24', isOwn: false, isClean: false, severity: 'MEDIUM' },
  ],
  anon_x: [
    { id: 's1', username: 'anonymous_sender', text: 'I know where you live, I\'ll find you tonight',        time: '02:11', isOwn: false, isClean: false, severity: 'CRITICAL' },
    { id: 's2', username: 'harasser_bot_wa',  text: 'go kill yourself you worthless piece of trash',        time: '02:13', isOwn: false, isClean: false, severity: 'CRITICAL' },
  ],
  music_lovers: [
    { id: 's1', username: 'Yuki Tanaka', text: 'anyone else watching the IPL match tonight?',          time: '19:00', isOwn: false, isClean: true },
    { id: 's2', username: 'Juan Carlos', text: 'new coffee shop opened near my place, pretty good vibes ☕', time: '19:02', isOwn: false, isClean: true },
    { id: 's3', username: 'You',         text: 'Bhai tu pagal hai 😂 love you yaar',                   time: '19:03', isOwn: true,  isClean: true },
    { id: 's4', username: 'Marie Dubois',text: 'what time is the meeting tomorrow?',                   time: '19:10', isOwn: false, isClean: true },
  ],
}

// ─── Avatar Component ─────────────────────────────────────────────────────────
function Avatar({ name, emoji, size = 40, isGroup = false }) {
  const colors = [
    '#25d366', '#128c7e', '#075e54', '#34b7f1',
    '#00a884', '#667eea', '#f59e0b', '#f43f5e',
  ]
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      backgroundColor: isGroup ? '#2a3942' : color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: isGroup ? size * 0.45 : size * 0.42,
      flexShrink: 0, color: '#fff', fontWeight: 700,
      fontFamily: 'system-ui',
    }}>
      {emoji || name?.[0]?.toUpperCase() || '?'}
    </div>
  )
}

// ─── Severity Config ──────────────────────────────────────────────────────────
function getSeverityStyle(sev) {
  switch (sev) {
    case 'CRITICAL': return { border: '#f43f5e', label: '🚨 CRITICAL', labelColor: '#f43f5e', barColor: '#f43f5e' }
    case 'HIGH':     return { border: '#f97316', label: '⚠️ HIGH',    labelColor: '#f97316', barColor: '#f97316' }
    case 'MEDIUM':   return { border: '#f59e0b', label: '🟡 MEDIUM',  labelColor: '#f59e0b', barColor: '#f59e0b' }
    default:         return { border: '#8696a0', label: 'LOW',        labelColor: '#8696a0', barColor: '#8696a0' }
  }
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg, isGroupChat }) {
  const [expanded, setExpanded] = useState(false)
  const isOwn = msg.isOwn
  const isClean = msg.isClean !== false && !msg.severity && msg.severity !== 'NONE'
  const sev = msg.severity
  const sevStyle = sev ? getSeverityStyle(sev) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: isOwn ? 'row-reverse' : 'row',
               alignItems: 'flex-end', gap: 6, marginBottom: 4, paddingInline: 8 }}
    >
      {/* Avatar only for received group messages */}
      {!isOwn && isGroupChat && (
        <Avatar name={msg.username} size={28} />
      )}

      <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column',
                    alignItems: isOwn ? 'flex-end' : 'flex-start', gap: 2 }}>
        {/* Sender name in group received messages */}
        {!isOwn && isGroupChat && (
          <span style={{ fontSize: 11, color: WA.text_green, fontWeight: 600, paddingLeft: 4 }}>
            {msg.username}
          </span>
        )}

        {/* Bubble */}
        <div style={{
          backgroundColor: isOwn ? WA.bubble_sent : WA.bubble_recv,
          borderRadius: isOwn ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
          padding: '7px 11px 5px',
          position: 'relative',
          border: sev ? `1px solid ${sevStyle.border}44` : 'none',
          boxShadow: sev ? `0 0 12px ${sevStyle.border}22` : 'none',
        }}>
          {/* Blocked content overlay for very toxic messages */}
          {sev === 'CRITICAL' ? (
            <div>
              {!expanded ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Shield size={12} color={sevStyle.border} />
                    <span style={{ fontSize: 11, color: sevStyle.border, fontWeight: 700 }}>
                      BLOCKED BY SENTINELAI
                    </span>
                  </div>
                  <p style={{ fontSize: 12.5, color: WA.text_muted, fontStyle: 'italic', margin: '0 0 4px 0' }}>
                    Message hidden due to safety guidelines.
                  </p>
                  <button 
                    onClick={() => setExpanded(true)}
                    style={{ background: 'transparent', border: 'none', color: WA.accent, fontSize: 11,
                             fontWeight: 'bold', padding: 0, cursor: 'pointer', textDecoration: 'underline', outline: 'none' }}
                  >
                    View Message
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 13.5, color: WA.text_primary, margin: '0 0 4px 0', lineHeight: 1.45,
                              wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                    {msg.text}
                  </p>
                  <button 
                    onClick={() => setExpanded(false)}
                    style={{ background: 'transparent', border: 'none', color: WA.text_muted, fontSize: 11,
                             padding: 0, cursor: 'pointer', textDecoration: 'underline', outline: 'none' }}
                  >
                    Hide Message
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ fontSize: 13.5, color: WA.text_primary, margin: 0, lineHeight: 1.45,
                        wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
              {msg.text}
            </p>
          )}

          {/* Time + tick */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                        gap: 3, marginTop: 3, marginBottom: -1 }}>
            <span style={{ fontSize: 10.5, color: WA.text_muted }}>{msg.time}</span>
            {isOwn && <CheckCheck size={14} color={WA.accent} />}
          </div>
        </div>

        {/* AI Alert Panel (for toxic non-critical, or expanded critical) */}
        {sev && (sev !== 'CRITICAL' || expanded) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{
              backgroundColor: '#12232a', border: `1px solid ${sevStyle.border}`,
              borderRadius: 8, padding: '8px 10px', width: '100%',
              marginTop: 2,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <AlertTriangle size={11} color={sevStyle.border} />
              <span style={{ fontSize: 10.5, fontWeight: 700, color: sevStyle.labelColor, letterSpacing: 0.5 }}>
                AI ALERT • {sevStyle.label}
              </span>
            </div>
            {msg.ai_explanation && (
              <p style={{ fontSize: 11, color: WA.text_muted, margin: '0 0 5px', lineHeight: 1.4 }}>
                {msg.ai_explanation}
              </p>
            )}
            {msg.toxicity_score != null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ flex: 1, height: 3, backgroundColor: '#2a3942', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    width: `${Math.round(msg.toxicity_score * 100)}%`,
                    backgroundColor: toxicityColor(msg.toxicity_score),
                  }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: toxicityColor(msg.toxicity_score) }}>
                  {Math.round(msg.toxicity_score * 100)}%
                </span>
              </div>
            )}
            {msg.moderation_action && (
              <div style={{ marginTop: 5, fontSize: 10, color: sevStyle.labelColor, fontWeight: 600 }}>
                Action: {msg.moderation_action}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Chat List Item ───────────────────────────────────────────────────────────
function ChatListItem({ contact, isActive, lastMsg, unreadCount, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 16px', cursor: 'pointer',
        backgroundColor: isActive ? WA.hover : hover ? '#1f2e36' : 'transparent',
        borderBottom: `1px solid ${WA.divider}`,
        transition: 'background-color 0.15s',
        position: 'relative',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Avatar name={contact.name} emoji={contact.avatar} size={50} isGroup={contact.type === 'group'} />
        {contact.type === 'group' && (
          <div style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 18, height: 18, borderRadius: '50%',
            backgroundColor: WA.search_bg, border: `2px solid ${WA.panel}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={9} color={WA.text_muted} />
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <span style={{ fontSize: 15, fontWeight: 500, color: WA.text_primary,
                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
            {contact.name}
          </span>
          <span style={{ fontSize: 11.5, color: unreadCount > 0 ? WA.accent : WA.text_muted, flexShrink: 0 }}>
            {lastMsg?.time || ''}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, color: WA.text_muted, margin: 0,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
            {lastMsg?.text || contact.description}
          </p>
          {unreadCount > 0 && (
            <span style={{
              backgroundColor: WA.unread_bg, color: '#fff',
              fontSize: 11, fontWeight: 700, borderRadius: 10,
              padding: '1px 6px', flexShrink: 0, minWidth: 18, textAlign: 'center',
            }}>
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function WhatsAppChat() {
  const { events } = useSentinelStore()
  const [activeId, setActiveId] = useState('college_group')
  const [search, setSearch] = useState('')
  const [showList, setShowList] = useState(true) // for mobile-like toggle
  const messagesEndRef = useRef(null)

  // Per-chat message history (seeded + live incoming)
  const [chatHistories, setChatHistories] = useState(
    Object.fromEntries(CONTACTS.map(c => [c.id, SEED_MESSAGES[c.id] || []]))
  )
  // Unread counts
  const [unread, setUnread] = useState({ gossip_club: 2, gaming_squad: 1, anon_x: 2 })

  // Route new WebSocket events to appropriate chats
  const prevEventsLen = useRef(0)
  useEffect(() => {
    if (events.length <= prevEventsLen.current) return
    const newEvents = events.slice(0, events.length - prevEventsLen.current)
    prevEventsLen.current = events.length

    newEvents.forEach(evt => {
      if (evt.platform !== 'WhatsApp') return
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false })

      // Route to a relevant chat based on severity
      let targetId
      if (evt.severity === 'CRITICAL' || evt.severity === 'HIGH') {
        // Assign to gossip_club or anon_x randomly
        targetId = Math.random() > 0.5 ? 'gossip_club' : 'anon_x'
      } else if (evt.severity === 'MEDIUM') {
        targetId = Math.random() > 0.5 ? 'gaming_squad' : 'gossip_club'
      } else {
        // Clean messages go to friendly chats
        const cleanChats = ['college_group', 'rahul_sharma', 'priya_mehta', 'music_lovers']
        targetId = cleanChats[Math.floor(Math.random() * cleanChats.length)]
      }

      const newMsg = {
        id: `live_${Date.now()}_${Math.random()}`,
        username: evt.username,
        text: evt.message,
        time: timeStr,
        isOwn: false,
        isClean: !evt.severity || evt.severity === 'NONE' || evt.severity === 'CLEAN',
        severity: evt.severity !== 'NONE' && evt.severity !== 'CLEAN' ? evt.severity : null,
        toxicity_score: evt.toxicity_score,
        ai_explanation: evt.ai_explanation,
        moderation_action: evt.moderation_action,
      }

      setChatHistories(prev => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), newMsg],
      }))

      // Bump unread if this chat is not active
      if (targetId !== activeId && newMsg.severity) {
        setUnread(prev => ({ ...prev, [targetId]: (prev[targetId] || 0) + 1 }))
      }
    })
  }, [events, activeId])

  // Auto-scroll to bottom in active chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistories[activeId]])

  // Clear unread on switch
  const handleSelectChat = (id) => {
    setActiveId(id)
    setUnread(prev => ({ ...prev, [id]: 0 }))
    setShowList(false)
  }

  const activeContact = CONTACTS.find(c => c.id === activeId)
  const activeMessages = chatHistories[activeId] || []
  const filteredContacts = CONTACTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  // Last message per chat for the preview
  const lastMessages = useMemo(() => {
    const map = {}
    CONTACTS.forEach(c => {
      const hist = chatHistories[c.id] || []
      if (hist.length > 0) map[c.id] = hist[hist.length - 1]
    })
    return map
  }, [chatHistories])

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 80px)',
      backgroundColor: WA.bg, borderRadius: 12, overflow: 'hidden',
      border: '1px solid #1f2c34', fontFamily: "'Segoe UI', system-ui, sans-serif",
      boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
    }}>

      {/* ── LEFT: Chat List Panel ──────────────────────────────────────── */}
      <div style={{
        width: 360, flexShrink: 0, backgroundColor: WA.panel,
        display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${WA.divider}`,
      }}>

        {/* Header */}
        <div style={{
          backgroundColor: WA.header, padding: '10px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              backgroundColor: WA.accent, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 18,
            }}>🛡️</div>
            <div>
              <span style={{ fontSize: 18, fontWeight: 600, color: WA.text_primary }}>WhatsApp</span>
              <div style={{ fontSize: 11, color: WA.accent, fontWeight: 500 }}>SentinelAI Monitor</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18 }}>
            <Camera size={20} color={WA.text_muted} style={{ cursor: 'pointer' }} />
            <Search size={20} color={WA.text_muted} style={{ cursor: 'pointer' }} />
            <MoreVertical size={20} color={WA.text_muted} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {/* Search bar */}
        <div style={{ padding: '8px 12px', backgroundColor: WA.panel }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: WA.search_bg, borderRadius: 8, padding: '7px 14px',
          }}>
            <Search size={14} color={WA.text_muted} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search or start new chat"
              style={{
                border: 'none', background: 'transparent', outline: 'none',
                color: WA.text_primary, fontSize: 14, flex: 1,
              }}
            />
          </div>
        </div>

        {/* Contacts + Groups list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredContacts.map(contact => (
            <ChatListItem
              key={contact.id}
              contact={contact}
              isActive={activeId === contact.id}
              lastMsg={lastMessages[contact.id]}
              unreadCount={unread[contact.id] || 0}
              onClick={() => handleSelectChat(contact.id)}
            />
          ))}
        </div>
      </div>

      {/* ── RIGHT: Chat Window ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Wallpaper-like background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          backgroundColor: WA.bg,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23182229' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />

        {/* Chat header */}
        <div style={{
          backgroundColor: WA.header, padding: '8px 16px',
          display: 'flex', alignItems: 'center', gap: 12, zIndex: 1,
          borderBottom: `1px solid ${WA.divider}`,
        }}>
          <Avatar name={activeContact?.name} emoji={activeContact?.avatar}
                  size={42} isGroup={activeContact?.type === 'group'} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15.5, fontWeight: 600, color: WA.text_primary }}>
              {activeContact?.name}
            </div>
            <div style={{ fontSize: 12, color: WA.text_muted }}>
              {activeContact?.type === 'group'
                ? activeContact.description
                : 'online'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            {/* AI badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              backgroundColor: '#00a88422', border: '1px solid #00a88444',
              borderRadius: 20, padding: '3px 10px',
            }}>
              <Shield size={11} color={WA.accent} />
              <span style={{ fontSize: 10.5, color: WA.accent, fontWeight: 700 }}>AI MONITORING</span>
            </div>
            <Video size={20} color={WA.text_muted} style={{ cursor: 'pointer' }} />
            <Phone size={20} color={WA.text_muted} style={{ cursor: 'pointer' }} />
            <MoreVertical size={20} color={WA.text_muted} style={{ cursor: 'pointer' }} />
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '12px 0', zIndex: 1,
          display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          <AnimatePresence initial={false}>
            {activeMessages.map((msg) => (
              <ChatBubble
                key={msg.id}
                msg={msg}
                isGroupChat={activeContact?.type === 'group'}
              />
            ))}
          </AnimatePresence>
          {activeMessages.length === 0 && (
            <div style={{ textAlign: 'center', marginTop: 60, color: WA.text_muted }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>💬</div>
              <p style={{ fontSize: 14 }}>No messages yet. Waiting for live data…</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar (display only — this is a monitor, not a real chat) */}
        <div style={{
          backgroundColor: WA.header, padding: '8px 12px',
          display: 'flex', alignItems: 'center', gap: 10, zIndex: 1,
          borderTop: `1px solid ${WA.divider}`,
        }}>
          <Smile size={26} color={WA.text_muted} style={{ cursor: 'pointer' }} />
          <Paperclip size={22} color={WA.text_muted} style={{ cursor: 'pointer' }} />
          <div style={{
            flex: 1, backgroundColor: WA.search_bg, borderRadius: 24,
            padding: '10px 18px', display: 'flex', alignItems: 'center',
          }}>
            <span style={{ fontSize: 14, color: WA.text_muted }}>
              🔒 Read-only monitor — SentinelAI is watching this chat
            </span>
          </div>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            backgroundColor: WA.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>
            <Mic size={22} color="#fff" />
          </div>
        </div>
      </div>
    </div>
  )
}
