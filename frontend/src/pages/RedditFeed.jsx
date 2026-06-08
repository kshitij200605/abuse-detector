/**
 * Reddit Feed — High-Fidelity Clone
 * Mimics new Reddit's layout:
 *   • Subreddit header bar (orange)
 *   • Vote arrows (upvote/downvote) on left
 *   • Post card with award badges, flair, and action bar
 *   • AutoModerator-style AI flagging as pinned comment
 *   • Dark/light mode header with subreddit icons
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp, ArrowDown, MessageSquare, Share2, Bookmark,
  Shield, Eye, EyeOff, MoreHorizontal, TrendingUp,
  Award, Filter, Hash, Users, Flame
} from 'lucide-react'
import { useSentinelStore } from '../store/sentinelStore'
import { SEVERITY_COLORS, toxicityColor, formatTimestamp, truncate } from '../utils/helpers'

// ── Reddit brand colours ─────────────────────────────────────────────────────
const RD = {
  orange:     '#FF4500',
  orangeLight:'#FF6534',
  upvote:     '#FF4500',
  downvote:   '#7193FF',
  bg:         '#DAE0E6',
  card:       '#FFFFFF',
  sidebar:    '#F6F7F8',
  border:     '#EDEFF1',
  meta:       '#878A8C',
  text:       '#1C1C1C',
}

// Subreddit-specific icons/colors
const SUBREDDIT_COLORS = {
  india:               { bg: '#FF9933', emoji: '🇮🇳' },
  teenagers:           { bg: '#FF4500', emoji: '👦' },
  relationship_advice: { bg: '#E8157C', emoji: '💕' },
  amitheasshole:       { bg: '#FF4500', emoji: '🤔' },
  worldnews:           { bg: '#0DD3BB', emoji: '🌍' },
  gaming:              { bg: '#7193FF', emoji: '🎮' },
  bollywood:           { bg: '#FF9500', emoji: '🎬' },
  cricket:             { bg: '#006400', emoji: '🏏' },
  AskReddit:           { bg: '#FF4500', emoji: '❓' },
  unpopularopinion:    { bg: '#888', emoji: '💬' },
  TwoXChromosomes:     { bg: '#FF69B4', emoji: '♀️' },
  college:             { bg: '#4169E1', emoji: '🎓' },
  memes:               { bg: '#FF4500', emoji: '😂' },
}

function getSubredditStyle(name) {
  return SUBREDDIT_COLORS[name] || { bg: '#FF4500', emoji: '📋' }
}

// ── Award badge ──────────────────────────────────────────────────────────────
const AWARDS = ['🏆', '🥇', '✨', '💎', '🌟']
function AwardBadges({ count = 0 }) {
  if (count === 0) return null
  return (
    <div className="flex items-center gap-0.5">
      {AWARDS.slice(0, Math.min(count, 3)).map((a, i) => (
        <span key={i} className="text-xs leading-none">{a}</span>
      ))}
      {count > 3 && <span className="text-[10px] text-gray-500 font-semibold">+{count - 3}</span>}
    </div>
  )
}

// ── Flair badge ──────────────────────────────────────────────────────────────
function Flair({ text, color = '#0DD3BB' }) {
  return (
    <span
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: color, background: `${color}15` }}
    >
      {text}
    </span>
  )
}

// ── Reddit Post Card ─────────────────────────────────────────────────────────
function RedditPost({ event, index }) {
  const [voteState, setVoteState] = useState(0) // -1, 0, 1
  const [saved, setSaved] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const sev = event.severity || 'NONE'
  const isHarmful = sev !== 'NONE' && sev !== 'CLEAN'
  const isCritical = sev === 'CRITICAL'
  const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.NONE

  const baseScore = Math.floor(Math.abs(Math.sin(index * 9301 + 1)) * 45000) + 12
  const voteScore = baseScore + (voteState === 1 ? 1 : voteState === -1 ? -1 : 0)

  const commentCount = Math.floor(Math.abs(Math.sin(index * 4321)) * 1200) + 3
  const awardCount = Math.floor(Math.abs(Math.sin(index * 1234)) * 5)

  const subreddit = event.subreddit || 'AskReddit'
  const subStyle = getSubredditStyle(subreddit)
  const postTitle = event.post_title || 'Community Discussion Thread'

  const flairs = {
    CRITICAL: { text: '🚨 Removed by AutoMod', color: '#ef4444' },
    HIGH:     { text: '⚠️ Under Review', color: '#f97316' },
    MEDIUM:   { text: '📋 Flagged', color: '#f59e0b' },
    LOW:      { text: '🔍 Monitored', color: '#10b981' },
  }

  const formatScore = (n) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
    return n.toString()
  }

  const timeOptions = ['1h', '2h', '3h', '4h', '5h', '6h', '8h', '12h', '1d', '2d']
  const timeAgo = timeOptions[index % timeOptions.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 transition-colors"
    >
      {/* ── Subreddit header bar ── */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ backgroundColor: `${subStyle.bg}15`, borderBottom: `1px solid ${subStyle.bg}30` }}
      >
        {/* Subreddit icon */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
          style={{ backgroundColor: subStyle.bg }}
        >
          {subStyle.emoji}
        </div>
        <span className="text-xs font-bold text-gray-800">r/{subreddit}</span>
        <span className="text-xs text-gray-400">•</span>
        <span className="text-xs text-gray-500">Posted by u/{event.username} · {timeAgo}</span>
        {isHarmful && flairs[sev] && (
          <div className="ml-auto">
            <Flair text={flairs[sev].text} color={flairs[sev].color} />
          </div>
        )}
        <button className="text-gray-400 ml-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* ── Main content: vote column + body ── */}
      <div className="flex gap-0">
        {/* Vote column */}
        <div
          className="flex flex-col items-center gap-1 px-2 py-3 flex-shrink-0"
          style={{ backgroundColor: '#F8F9FA', borderRight: '1px solid #EDEFF1' }}
        >
          <button
            onClick={() => setVoteState(voteState === 1 ? 0 : 1)}
            className="p-1 rounded hover:bg-orange-50 transition-colors"
          >
            <ArrowUp
              className="w-5 h-5"
              style={{ color: voteState === 1 ? RD.orange : '#878A8C' }}
            />
          </button>
          <span
            className="text-xs font-bold leading-none"
            style={{ color: voteState === 1 ? RD.orange : voteState === -1 ? RD.downvote : '#1C1C1C' }}
          >
            {formatScore(voteScore)}
          </span>
          <button
            onClick={() => setVoteState(voteState === -1 ? 0 : -1)}
            className="p-1 rounded hover:bg-blue-50 transition-colors"
          >
            <ArrowDown
              className="w-5 h-5"
              style={{ color: voteState === -1 ? RD.downvote : '#878A8C' }}
            />
          </button>
        </div>

        {/* Post body */}
        <div className="flex-1 p-3 min-w-0">
          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-2">
            {truncate(postTitle, 120)}
          </h3>

          {/* Awards + language tag */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <AwardBadges count={awardCount} />
            {event.original_language && event.original_language !== 'English' && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
                {event.original_language}
              </span>
            )}
          </div>

          {/* Comment text — blurred/hidden for CRITICAL */}
          {isCritical && !revealed ? (
            <div className="relative mb-2">
              <div className="text-sm text-gray-800 leading-relaxed blur-sm select-none">
                {event.message?.slice(0, 100)}…
              </div>
              <button
                onClick={() => setRevealed(true)}
                className="absolute inset-0 flex items-center justify-center gap-2 text-xs font-semibold text-gray-600 bg-white/80 rounded-lg border border-gray-200"
              >
                <EyeOff className="w-4 h-4" />
                Content hidden by AutoModerator · Click to reveal
              </button>
            </div>
          ) : (
            <p className={`text-sm leading-relaxed mb-2 ${isHarmful ? 'text-gray-800' : 'text-gray-700'}`}>
              {event.message}
            </p>
          )}

          {/* Translation card */}
          {event.was_translated && event.translated_message !== event.message && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-2 text-xs">
              <span className="font-semibold text-indigo-500">🌐 Translated from {event.original_language}: </span>
              <span className="text-indigo-800">{event.translated_message}</span>
            </div>
          )}

          {/* AutoModerator AI panel — styled like Reddit's pinned comment */}
          {isHarmful && (
            <div className="mt-2 border-l-4 border-green-500 bg-green-50 rounded-r-xl pl-3 py-2 pr-3">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                  <Shield className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-[11px] font-bold text-green-800">AutoModerator · Bot</span>
                <span className="text-[10px] text-green-600 bg-green-100 rounded px-1">Pinned</span>
                {event.detection_source && (
                  <span className="text-[9px] text-gray-400 ml-auto">
                    via {event.detection_source.replace('huggingface:', 'HF ')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-green-900 leading-relaxed">{event.ai_explanation}</p>
              {/* Toxicity bar */}
              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex-1 h-1 bg-green-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((event.toxicity_score || 0) * 100)}%`,
                      backgroundColor: toxicityColor(event.toxicity_score || 0)
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-bold"
                  style={{ color: toxicityColor(event.toxicity_score || 0) }}
                >
                  {Math.round((event.toxicity_score || 0) * 100)}% toxicity
                </span>
              </div>
              {event.moderation_action && (
                <p className="text-[10px] text-green-700 font-semibold mt-1">
                  ⚡ Action: {event.moderation_action.split('+')[0].trim()}
                </p>
              )}
              {event.legal_categories?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {event.legal_categories.slice(0, 2).map((cat, i) => (
                    <span key={i} className="text-[9px] bg-red-50 text-red-700 border border-red-200 rounded px-1 py-0.5">
                      ⚖️ {cat}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Action bar ── */}
          <div className="flex items-center gap-1 mt-2 -ml-1">
            <button className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold hover:bg-gray-100 rounded-full px-2 py-1 transition-colors">
              <MessageSquare className="w-3.5 h-3.5" />
              {commentCount.toLocaleString()} Comments
            </button>
            <button className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold hover:bg-gray-100 rounded-full px-2 py-1 transition-colors">
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className={`flex items-center gap-1 text-[11px] font-semibold hover:bg-gray-100 rounded-full px-2 py-1 transition-colors ${saved ? 'text-blue-600' : 'text-gray-500'}`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-blue-600' : ''}`} />
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Reddit page ─────────────────────────────────────────────────────────
export default function RedditFeed() {
  const { events } = useSentinelStore()
  const [filter, setFilter] = useState('ALL')
  const [sort, setSort] = useState('hot')

  const redditEvents = events.filter(e => e.platform === 'Reddit')
  const filtered = filter === 'ALL'
    ? redditEvents
    : redditEvents.filter(e => e.severity === filter)

  const stats = {
    total:      redditEvents.length,
    flagged:    redditEvents.filter(e => e.severity && e.severity !== 'NONE' && e.severity !== 'CLEAN').length,
    critical:   redditEvents.filter(e => e.severity === 'CRITICAL').length,
    subreddits: [...new Set(redditEvents.map(e => e.subreddit).filter(Boolean))].length,
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Reddit-style header ── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Orange top banner */}
        <div
          className="px-6 pt-6 pb-4"
          style={{ background: `linear-gradient(135deg, ${RD.orange} 0%, ${RD.orangeLight} 100%)` }}
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">r/SentinelAI Monitor</h1>
              <p className="text-white/80 text-sm">Real-time AI moderation of Reddit content</p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-white text-xs font-bold">LIVE</span>
            </div>
          </div>

          {/* Community stats */}
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Comments',   val: stats.total,      icon: MessageSquare },
              { label: 'Flagged',    val: stats.flagged,    icon: Shield },
              { label: 'Critical',   val: stats.critical,   icon: Flame },
              { label: 'Subreddits', val: stats.subreddits, icon: Hash },
            ].map(({ label, val, icon: Icon }) => (
              <div key={label} className="bg-white/20 rounded-xl p-2.5 text-center">
                <Icon className="w-4 h-4 text-white mx-auto mb-1" />
                <div className="text-lg font-black text-white">{val}</div>
                <div className="text-[10px] text-white/80">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sort + members bar */}
        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-500">12,847 online</span>
          </div>
          <div className="flex items-center gap-1 ml-3">
            {['hot', 'new', 'top', 'rising'].map(s => (
              <button
                key={s}
                onClick={() => setSort(s)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${
                  sort === s
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {s === 'hot' && <Flame className="w-3 h-3" />}
                {s === 'new' && <TrendingUp className="w-3 h-3" />}
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-400" />
        {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              filter === f
                ? f === 'ALL'
                  ? 'text-white shadow-sm'
                  : 'text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
            style={filter === f ? {
              background: f === 'CRITICAL' ? '#ef4444' : f === 'HIGH' ? '#f97316' :
                          f === 'MEDIUM' ? '#f59e0b' : f === 'LOW' ? '#10b981' : RD.orange
            } : {}}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">{filtered.length} posts</span>
      </div>

      {/* ── Post feed ── */}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {filtered.map((evt, idx) => (
            <RedditPost key={evt.evidence_hash || idx} event={evt} index={idx} />
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 text-sm font-semibold">
              {redditEvents.length === 0
                ? 'Waiting for Reddit comments…'
                : 'No posts match the current filter.'}
            </p>
            <p className="text-gray-400 text-xs mt-1">
              {redditEvents.length === 0 && 'Simulator is generating content…'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
