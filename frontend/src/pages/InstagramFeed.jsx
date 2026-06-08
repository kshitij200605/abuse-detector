/**
 * Instagram Feed — High-Fidelity Clone
 * Mimics real Instagram's mobile-first UI:
 *   • Stories row at the top
 *   • Square post images (picsum.photos deterministic URLs)
 *   • Reels section
 *   • Heart/comment/share/bookmark action bar
 *   • AI moderation overlays that match Instagram's aesthetic
 *   • Interactive comments drawer with real-time safety analysis
 *   • Interactive DMs (inbox, chat threads, and live moderation)
 */
import { useState, useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  Volume2, VolumeX, Play, Zap, Shield, ArrowLeft, X
} from 'lucide-react'
import { useSentinelStore } from '../store/sentinelStore'
import { SEVERITY_COLORS, toxicityColor } from '../utils/helpers'

// ── Deterministic image from picsum using seed ──────────────────────────────
function postImageUrl(seed, w = 600, h = 600) {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`
}

function reelImageUrl(seed) {
  return `https://picsum.photos/seed/reel${seed}/400/700`
}

function avatarUrl(username) {
  // Use DiceBear avatars for realistic profile pictures
  const styles = ['avataaars', 'bottts', 'identicon']
  const style = styles[username.charCodeAt(0) % styles.length]
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${username}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`
}

// ── Instagram gradient IG logo ───────────────────────────────────────────────
const IG_GRADIENT = 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'

// ── Story Ring Component ─────────────────────────────────────────────────────
const STORY_USERS = [
  { name: 'priya.sharma_official', seen: false },
  { name: 'aesthetic_rahul', seen: true },
  { name: 'wanderlust_sneha', seen: false },
  { name: 'travel_blogger_aditya', seen: false },
  { name: 'fitness_sam23', seen: true },
  { name: 'foodie_ananya', seen: false },
  { name: 'sunset_seeker', seen: false },
  { name: 'guitar_guy_arjun', seen: true },
  { name: 'mumbai_diaries', seen: false },
]

function StoryRing({ user, isYours = false }) {
  const [viewed, setViewed] = useState(user.seen)
  return (
    <button
      onClick={() => setViewed(true)}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16"
    >
      <div
        className="p-[2px] rounded-full"
        style={{
          background: viewed ? '#d1d5db' : IG_GRADIENT,
        }}
      >
        <div className="bg-white p-[2px] rounded-full">
          <img
            src={avatarUrl(user.name)}
            alt={user.name}
            className="w-14 h-14 rounded-full object-cover bg-gray-100"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.parentElement.innerHTML = `<div class="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-lg font-bold">${user.name[0].toUpperCase()}</div>`
            }}
          />
        </div>
      </div>
      <span className="text-[10px] text-gray-800 truncate w-full text-center">
        {isYours ? 'Your story' : user.name.split('.')[0]}
      </span>
    </button>
  )
}

// ── Reel Card ────────────────────────────────────────────────────────────────
function ReelCard({ seed, username, views, caption }) {
  const [muted, setMuted] = useState(true)
  const [liked, setLiked] = useState(false)
  return (
    <div className="relative flex-shrink-0 w-32 rounded-xl overflow-hidden cursor-pointer group">
      <img
        src={reelImageUrl(seed)}
        alt="reel"
        className="w-32 h-52 object-cover"
        loading="lazy"
      />
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
      {/* Play icon */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-80 group-hover:opacity-100 transition-opacity">
        <Play className="w-7 h-7 text-white fill-white drop-shadow-lg" />
      </div>
      {/* Mute */}
      <button
        onClick={(e) => { e.stopPropagation(); setMuted(!muted) }}
        className="absolute top-2 right-2 text-white"
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>
      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 p-2">
        <p className="text-white text-[10px] font-semibold truncate">{username}</p>
        <p className="text-white/80 text-[9px]">{views} views</p>
      </div>
      {/* Like */}
      <button
        onClick={(e) => { e.stopPropagation(); setLiked(!liked) }}
        className="absolute right-2 bottom-8 text-white"
      >
        <Heart className={`w-5 h-5 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
      </button>
    </div>
  )
}

// ── Instagram Post ────────────────────────────────────────────────────────────
function InstagramPost({ event, imgSeed, index, onOpenComments, onOpenDMChat }) {
  const [liked, setLiked] = useState(false)
  const [saved, setSaved] = useState(false)
  const [doubleTapLike, setDoubleTapLike] = useState(false)
  const [showFullCaption, setShowFullCaption] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [likes] = useState(() => Math.floor(Math.abs(Math.sin(imgSeed * 9301)) * 4900) + 50)
  const [commentsCount] = useState(() => Math.floor(Math.abs(Math.sin(imgSeed * 4321)) * 12) + 3)
  const lastTap = useRef(0)

  const sev = event.severity || 'NONE'
  const isHarmful = sev !== 'NONE' && sev !== 'CLEAN'
  const colors = SEVERITY_COLORS[sev] || SEVERITY_COLORS.NONE

  const timeAgo = () => {
    const opts = ['2 minutes ago', '5 minutes ago', '12 minutes ago', '23 minutes ago', '1 hour ago', '2 hours ago', '3 hours ago']
    return opts[index % opts.length]
  }

  function handleImageTap() {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      setLiked(true)
      setDoubleTapLike(true)
      setTimeout(() => setDoubleTapLike(false), 1000)
    }
    lastTap.current = now
  }

  // Realistic caption based on severity
  const captions = isHarmful
    ? [`⚠️ ${event.message?.slice(0, 80)}${event.message?.length > 80 ? '...' : ''}`,]
    : [
        'Golden hour 🌅 #photography #travel',
        'Good vibes only ✨ #lifestyle',
        'Weekend adventures 🏕️ #explore',
        'Coffee and sunsets ☕ #cozy',
        'Making memories 📸 #friends',
        'New day, new beginnings 🌸',
      ]

  const caption = isHarmful 
    ? (sev === 'CRITICAL' && !revealed ? "🚫 Content hidden due to critical safety guidelines." : event.message)
    : captions[index % captions.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white border-b border-gray-100"
    >
      {/* ── Post header ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar with story ring if harmful */}
        <div
          className="p-[2px] rounded-full flex-shrink-0"
          style={{ background: isHarmful ? '#ef4444' : IG_GRADIENT }}
        >
          <div className="bg-white p-[2px] rounded-full">
            <img
              src={avatarUrl(event.username || 'user')}
              alt={event.username}
              className="w-9 h-9 rounded-full object-cover bg-gray-100"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.parentElement.innerHTML = `<div class="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold">${(event.username || '?')[0].toUpperCase()}</div>`
              }}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-gray-900">{event.username}</p>
            {isHarmful && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: sev === 'CRITICAL' ? '#ef4444' : sev === 'HIGH' ? '#f97316' : '#f59e0b' }}
              >
                {sev}
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500">
            {event.original_language && event.original_language !== 'English'
              ? `${event.original_language} • ${timeAgo()}`
              : timeAgo()
            }
          </p>
        </div>
        <button className="text-gray-400 p-1">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* ── Post image ── */}
      <div className="relative w-full" onClick={handleImageTap}>
        <img
          src={postImageUrl(imgSeed)}
          alt="post"
          className="w-full aspect-square object-cover"
          loading="lazy"
        />
        {/* Double-tap heart animation */}
        <AnimatePresence>
          {doubleTapLike && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 1.4, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-20 h-20 text-white fill-white drop-shadow-2xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI moderation overlay on image for CRITICAL */}
        {sev === 'CRITICAL' && !revealed && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 z-10">
            <Shield className="w-10 h-10 text-red-400" />
            <p className="text-white text-xs font-bold text-center px-4">Content hidden by SentinelAI</p>
            <p className="text-white/70 text-[10px] text-center px-6">This post violated community safety guidelines</p>
            <button 
              onClick={(e) => { e.stopPropagation(); setRevealed(true) }}
              className="mt-2 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-white/25 transition-colors"
            >
              Reveal Message
            </button>
          </div>
        )}
      </div>

      {/* ── Actions bar ── */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => setLiked(!liked)}
            className="transition-transform active:scale-90"
          >
            <Heart
              className={`w-6 h-6 transition-all duration-200 ${liked ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-800 hover:text-gray-500'}`}
            />
          </button>
          <button onClick={() => onOpenComments(event)} className="text-gray-800 hover:text-gray-500">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button onClick={() => onOpenDMChat(event.username)} className="text-gray-800 hover:text-gray-500">
            <Send className="w-6 h-6" />
          </button>
          <button onClick={() => setSaved(!saved)} className="ml-auto text-gray-800 hover:text-gray-500">
            <Bookmark className={`w-6 h-6 ${saved ? 'fill-gray-800' : ''}`} />
          </button>
        </div>

        {/* Likes count */}
        <p className="text-sm font-semibold text-gray-900 mb-1">
          {(likes + (liked ? 1 : 0)).toLocaleString()} likes
        </p>

        {/* Caption */}
        <div className="text-sm text-gray-900 leading-snug">
          <span className="font-semibold mr-1">{event.username}</span>
          {showFullCaption || caption.length <= 80
            ? caption
            : (
                <>
                  {caption.slice(0, 80)}
                  <button
                    className="text-gray-400 ml-1"
                    onClick={() => setShowFullCaption(true)}
                  >
                    more
                  </button>
                </>
              )
          }
        </div>

        {/* View comments + Toggle for Critical post */}
        <div className="flex items-center justify-between mt-1 flex-wrap gap-2">
          <button 
            onClick={() => onOpenComments(event)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors block text-left"
          >
            View all {commentsCount} comments
          </button>

          {sev === 'CRITICAL' && (
            <button
              onClick={() => setRevealed(!revealed)}
              className="text-xs text-blue-500 hover:text-blue-700 font-semibold transition-colors"
            >
              {revealed ? "Hide Message" : "View Message"}
            </button>
          )}
        </div>

        {/* AI Moderation card for HIGH/MEDIUM */}
        {isHarmful && sev !== 'CRITICAL' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mt-3 rounded-xl overflow-hidden border border-orange-100 bg-orange-50"
          >
            <div className="p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: IG_GRADIENT }}
                >
                  <Shield className="w-3 h-3 text-white" />
                </div>
                <span className="text-[11px] font-bold text-gray-700">SentinelAI flagged this comment</span>
                <span
                  className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: sev === 'HIGH' ? '#f97316' : '#f59e0b' }}
                >
                  {sev}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{event.ai_explanation}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
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
                  {Math.round((event.toxicity_score || 0) * 100)}%
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Timestamp */}
        <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-1.5">
          {timeAgo().toUpperCase()}
        </p>
      </div>
    </motion.div>
  )
}

// ── Reels section ────────────────────────────────────────────────────────────
const REEL_DATA = [
  { seed: 'reel1', username: 'priya.sharma_official', views: '1.2M', caption: 'Dance challenge 🔥' },
  { seed: 'reel2', username: 'aesthetic_rahul', views: '843K', caption: 'Travel vlog' },
  { seed: 'reel3', username: 'wanderlust_sneha', views: '2.1M', caption: 'Song cover ♫' },
  { seed: 'reel4', username: 'travel_blogger_aditya', views: '512K', caption: 'Quick recipe' },
  { seed: 'reel5', username: 'fitness_sam23', views: '1.7M', caption: 'Workout tip' },
  { seed: 'reel6', username: 'guitar_guy_arjun', views: '3.4M', caption: 'Too relatable 😂' },
]

// ── Mock Initial DMs ──────────────────────────────────────────────────────────
const INITIAL_DMS = {
  "priya.sharma_official": [
    { id: '1', sender: 'them', text: 'Hey, did you see the new SentinelAI features?', time: '10:00 AM' },
    { id: '2', sender: 'you', text: 'Yes, looking extremely good!', time: '10:01 AM' },
    { id: '3', sender: 'them', text: 'Awesome, talk later! 😊', time: '10:02 AM' },
  ],
  "aesthetic_rahul": [
    { id: '1', sender: 'them', text: 'Bro, check out my latest vlog reel!', time: 'Yesterday' },
    { id: '2', sender: 'you', text: 'Nice edits man! 🔥', time: 'Yesterday' },
  ],
  "toxic_insta_troll": [
    { id: '1', sender: 'them', text: 'delete your page right now or else...', time: '11:30 AM', severity: 'HIGH', toxicity_score: 0.89, ai_explanation: 'Threat and harassment.' },
    { id: '2', sender: 'you', text: 'Stop messaging me.', time: '11:31 AM' },
  ]
}

// ── Comments Generator ────────────────────────────────────────────────────────
const generateMockCommentsForPost = (post, index) => {
  const cleanEnglish = [
    "Amazing photo! 😍",
    "Wow, this looks incredible!",
    "Where was this taken?",
    "Great shot! Keep it up.",
    "This is so beautiful! ❤️",
    "Absolutely stunning!"
  ]
  const cleanHindi = [
    "बहुत ही सुंदर तस्वीर है 👌",
    "भाई कमाल कर दिया! 🔥",
    "कहाँ की है ये फ़ोटो?",
    "बहुत बढ़िया भाई",
    "शानदार!"
  ]
  const cleanSpanish = [
    "¡Qué hermosa foto! 😍",
    "¡Increíble! Me encanta.",
    "¿Dónde es esto?",
    "¡Buenísima foto!"
  ]
  const cleanJapanese = [
    "素晴らしい写真ですね！✨",
    "とても綺麗です！🏯",
    "ここはどこですか？",
    "お見事です！"
  ]
  const toxicComments = [
    { text: "you are so ugly, go delete your account", severity: "LOW", toxicity: 0.72, explanation: "Insulting or demeaning remark targeting user's appearance." },
    { text: "shut up you stupid loser nobody cares", severity: "MEDIUM", toxicity: 0.81, explanation: "Ad hominem attacks and harassment." },
    { text: "marr ja jaakar, teri koi zarurat nahi hai", severity: "HIGH", toxicity: 0.92, explanation: "Encouragement of self-harm in Hindi/Hinglish." },
    { text: "I will find you and make you regret posting this", severity: "CRITICAL", toxicity: 0.98, explanation: "Physical threat and intimidation." }
  ]

  const lang = post.original_language || "English"
  let pool = cleanEnglish
  if (lang === "Hindi" || lang === "Hinglish") pool = cleanHindi
  else if (lang === "Spanish") pool = pool = cleanSpanish
  else if (lang === "Japanese") pool = cleanJapanese

  const results = []
  const commentCount = Math.floor(Math.abs(Math.sin((index || 1) * 4321)) * 5) + 2

  const commenters = [
    "aesthetic_girl", "travel_blogger_xyz", "insta_warrior", "fitness_coach_sam",
    "foodie_ananya", "sunset_seeker", "guitar_guy_arjun", "mumbai_diaries"
  ]

  for (let i = 0; i < commentCount; i++) {
    // 30% chance of containing a toxic comment to demonstrate AI moderation
    const isToxic = i === 0 && Math.abs(Math.sin(index * 999 + i)) > 0.60
    if (isToxic) {
      const tc = toxicComments[i % toxicComments.length]
      results.push({
        id: `c_${post.evidence_hash || index}_${i}`,
        username: "toxic_insta_troll",
        avatar: avatarUrl("toxic_insta_troll"),
        text: tc.text,
        time: `${i + 1}m ago`,
        severity: tc.severity,
        toxicity_score: tc.toxicity,
        ai_explanation: tc.explanation
      })
    } else {
      const commenter = commenters[(index + i) % commenters.length]
      const text = pool[(index + i) % pool.length]
      results.push({
        id: `c_${post.evidence_hash || index}_${i}`,
        username: commenter,
        avatar: avatarUrl(commenter),
        text: text,
        time: `${i + 2}m ago`,
        severity: "NONE"
      })
    }
  }

  return results
}

// ── Comments Drawer ──────────────────────────────────────────────────────────
function CommentsDrawer({ post, onClose, commentsList, onAddComment }) {
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [revealedComments, setRevealedComments] = useState({})
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [commentsList])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || posting) return
    const text = commentText
    setCommentText('')
    setPosting(true)
    await onAddComment(text)
    setPosting(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center">
      {/* Dismiss overlay */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="bg-white w-full max-w-[470px] rounded-t-3xl flex flex-col h-[80vh] shadow-2xl relative overflow-hidden z-10 animate-slide-up">
        {/* Pull handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto my-3 cursor-pointer" onClick={onClose} />
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b border-gray-100">
          <span className="font-bold text-gray-900">Comments</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable comments list */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {/* Post Caption (pinned at top) */}
          <div className="flex gap-3 items-start pb-4 border-b border-gray-200">
            <img src={avatarUrl(post.username || 'user')} alt="avatar" className="w-9 h-9 rounded-full object-cover bg-gray-100" />
            <div className="text-sm">
              <span className="font-bold text-gray-900 mr-2">{post.username}</span>
              <span className="text-gray-800 whitespace-pre-wrap">{post.message}</span>
              <p className="text-[10px] text-gray-400 mt-1">Author Post</p>
            </div>
          </div>

          {/* User comments */}
          {commentsList.map((c) => {
            const isCommentHarmful = c.severity && c.severity !== 'NONE' && c.severity !== 'CLEAN'
            const isCommentRevealed = revealedComments[c.id]
            return (
              <div key={c.id} className="flex gap-3 items-start">
                <img src={c.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover bg-gray-100" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    <span className="font-bold text-gray-900 mr-2">{c.username}</span>
                    {c.severity === 'CRITICAL' ? (
                      isCommentRevealed ? (
                        <span className="text-gray-800 bg-red-50/50 border border-red-100 rounded-lg px-2 py-1.5 inline-block">{c.text}</span>
                      ) : (
                        <span className="text-red-500 italic bg-red-50 border border-red-100 rounded-lg px-2 py-1 inline-block">🚫 Comment hidden by SentinelAI</span>
                      )
                    ) : (
                      <span className="text-gray-800">{c.text}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400">
                    <span>{c.time}</span>
                    {isCommentHarmful && (
                      <span className="text-red-500 font-semibold uppercase">{c.severity} flagged</span>
                    )}
                    {c.severity === 'CRITICAL' && (
                      <button
                        onClick={() => setRevealedComments(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                        className="text-blue-500 hover:text-blue-700 font-semibold transition-colors"
                      >
                        {isCommentRevealed ? "Hide Comment" : "View Comment"}
                      </button>
                    )}
                  </div>

                  {/* Comment moderation card */}
                  {isCommentHarmful && c.severity !== 'CRITICAL' && (
                    <div className="mt-2 bg-orange-50 border border-orange-100 rounded-xl p-3 text-xs text-gray-600 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1 font-semibold text-gray-700">
                        <Shield className="w-4 h-4 text-orange-500" />
                        <span>SentinelAI flagged this comment</span>
                        <span className="ml-auto text-[9px] bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                          {Math.round(c.toxicity_score * 100)}% toxic
                        </span>
                      </div>
                      <p className="text-[10px] leading-relaxed text-gray-500">{c.ai_explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 bg-white flex items-center gap-3">
          <img src={avatarUrl('you')} alt="your avatar" className="w-8 h-8 rounded-full object-cover" />
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={`Add a comment for ${post.username}...`}
            className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            disabled={posting}
          />
          <button
            type="submit"
            disabled={!commentText.trim() || posting}
            className="text-sm font-semibold text-blue-500 hover:text-blue-700 disabled:opacity-50"
          >
            {posting ? 'Posting...' : 'Post'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── DM Inbox View ────────────────────────────────────────────────────────────
function InstagramDMInbox({ onBack, onSelectChat }) {
  const contacts = [
    { username: 'priya.sharma_official', active: 'Active now', msg: 'Awesome, talk later! 😊', online: true },
    { username: 'aesthetic_rahul', active: 'Active 2h ago', msg: 'Nice edits man! 🔥', online: false },
    { username: 'toxic_insta_troll', active: 'Active now', msg: 'delete your page or else...', online: true },
    { username: 'travel_blogger_aditya', active: 'Active 1d ago', msg: 'Hey, did you see that post?', online: false },
    { username: 'fitness_sam23', active: 'Active 5m ago', msg: 'Let\'s workout tomorrow!', online: true }
  ]

  return (
    <div className="max-w-[470px] mx-auto bg-white min-h-screen rounded-2xl overflow-hidden shadow-card flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-4">
        <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-800" />
        </button>
        <span className="font-bold text-lg text-gray-900">Direct Messages</span>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-gray-50">
        <input 
          type="text" 
          placeholder="Search" 
          className="w-full text-sm bg-gray-100 rounded-lg px-3 py-1.5 focus:outline-none text-gray-900"
        />
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {contacts.map((c) => (
          <div 
            key={c.username}
            onClick={() => onSelectChat(c.username)}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50/50"
          >
            <div className="relative flex-shrink-0">
              <img src={avatarUrl(c.username)} alt="avatar" className="w-12 h-12 rounded-full bg-gray-100 object-cover" />
              {c.online && (
                <div className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{c.username}</p>
              <p className="text-xs text-gray-500 truncate">{c.msg}</p>
            </div>
            <div className="text-[10px] text-gray-400 flex-shrink-0">
              {c.active}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── DM Chat View ──────────────────────────────────────────────────────────────
function InstagramDMChat({ contactName, onBack, dmHistory, setDmHistory }) {
  const [inputText, setInputText] = useState('')
  const [sending, setSending] = useState(false)
  const [revealedMessages, setRevealedMessages] = useState({})
  const chatEndRef = useRef(null)

  const messages = dmHistory[contactName] || [
    { id: 'init_1', sender: 'them', text: 'Hey there! How is it going?', time: '10:00 AM' }
  ]

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!inputText.trim() || sending) return
    const text = inputText
    setInputText('')
    setSending(true)

    // Add user message locally first
    const userMsg = { id: `m_${Date.now()}`, sender: 'you', text, time: 'Just now' }
    
    // Call real-time moderation API
    let severity = 'NONE'
    let toxicityScore = 0.0
    let aiExplanation = ''
    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, platform: 'Instagram', username: 'you' })
      })
      if (response.ok) {
        const result = await response.json()
        severity = result.severity
        toxicityScore = result.toxicity_score
        aiExplanation = result.ai_explanation
      }
    } catch (err) {
      console.warn("Moderation API check failed: ", err)
      // Fallback local checks if offline
      if (text.toLowerCase().includes('kill') || text.toLowerCase().includes('die') || text.toLowerCase().includes('slut')) {
        severity = 'CRITICAL'
        toxicityScore = 0.98
        aiExplanation = "Self-harm recommendation or hate speech."
      }
    }

    const updatedUserMsg = {
      ...userMsg,
      severity,
      toxicity_score: toxicityScore,
      ai_explanation: aiExplanation
    }

    setDmHistory(prev => {
      const list = prev[contactName] || []
      return { ...prev, [contactName]: [...list, updatedUserMsg] }
    })

    setSending(false)

    // Simulate reply after 1.5s
    setTimeout(async () => {
      let replyText = "Hey! Yes, let's catch up later today."
      
      if (contactName === 'toxic_insta_troll') {
        replyText = "go kill yourself you worthless piece of trash"
      } else {
        const replies = [
          "Haha true! 😂",
          "That sounds amazing!",
          "I will check it out, thanks!",
          "Let's catch up tomorrow.",
          "Awesome! 👍"
        ]
        replyText = replies[Math.floor(Math.random() * replies.length)]
      }

      // Check moderation of reply too
      let replySeverity = 'NONE'
      let replyToxicity = 0.0
      let replyExplanation = ''
      try {
        const replyResponse = await fetch('http://localhost:8000/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: replyText, platform: 'Instagram', username: contactName })
        })
        if (replyResponse.ok) {
          const result = await replyResponse.json()
          replySeverity = result.severity
          replyToxicity = result.toxicity_score
          replyExplanation = result.ai_explanation
        }
      } catch (err) {
        if (replyText.toLowerCase().includes('kill')) {
          replySeverity = 'CRITICAL'
          replyToxicity = 0.95
          replyExplanation = "Encouragement of self-harm."
        }
      }

      const replyMsg = {
        id: `m_${Date.now() + 1}`,
        sender: 'them',
        text: replyText,
        time: 'Just now',
        severity: replySeverity,
        toxicity_score: replyToxicity,
        ai_explanation: replyExplanation
      }

      setDmHistory(prev => {
        const list = prev[contactName] || []
        return { ...prev, [contactName]: [...list, replyMsg] }
      })
    }, 1500)
  }

  return (
    <div className="max-w-[470px] mx-auto bg-white min-h-screen rounded-2xl overflow-hidden shadow-card flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-800" />
          </button>
          <img src={avatarUrl(contactName)} alt="avatar" className="w-9 h-9 rounded-full object-cover bg-gray-100" />
          <div>
            <p className="text-sm font-semibold text-gray-900 leading-none">{contactName}</p>
            <p className="text-[10px] text-green-500 mt-1 font-medium">Active now</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.map((m) => {
          const isOwn = m.sender === 'you'
          const isHarmful = m.severity && m.severity !== 'NONE' && m.severity !== 'CLEAN'
          const isMsgRevealed = revealedMessages[m.id]
          return (
            <div key={m.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
              <div className="max-w-[80%] flex flex-col gap-1">
                {/* Bubble */}
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isOwn 
                      ? 'bg-blue-500 text-white rounded-tr-none' 
                      : 'bg-white text-gray-900 border border-gray-100 rounded-tl-none'
                  }`}
                >
                  {m.severity === 'CRITICAL' ? (
                    isMsgRevealed ? (
                      <span>{m.text}</span>
                    ) : (
                      <span className="italic opacity-85">🚫 Message blocked by SentinelAI</span>
                    )
                  ) : (
                    <span>{m.text}</span>
                  )}
                </div>

                {/* View Message button for critical message */}
                {m.severity === 'CRITICAL' && (
                  <button
                    onClick={() => setRevealedMessages(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                    className={`text-[9px] font-semibold hover:underline mt-0.5 self-start ${
                      isOwn ? 'text-blue-500 hover:text-blue-700' : 'text-blue-500 hover:text-blue-700'
                    }`}
                  >
                    {isMsgRevealed ? "Hide Message" : "View Message"}
                  </button>
                )}

                {/* Moderation note under the bubble if flagged */}
                {isHarmful && m.severity !== 'CRITICAL' && (
                  <div className="mt-1 bg-orange-50 border border-orange-100 rounded-xl p-2.5 text-[10px] text-gray-600 max-w-xs shadow-sm">
                    <div className="flex items-center gap-1.5 mb-1 font-semibold text-gray-700">
                      <Shield className="w-3 h-3 text-orange-500" />
                      <span>Flagged: {m.severity}</span>
                      <span className="ml-auto text-[8px] bg-orange-200 text-orange-800 px-1.5 rounded">
                        {Math.round(m.toxicity_score * 100)}% toxic
                      </span>
                    </div>
                    <p className="leading-relaxed text-gray-500 text-[9px]">{m.ai_explanation}</p>
                  </div>
                )}

                <span className="text-[9px] text-gray-400 mt-0.5 px-1">{m.time}</span>
              </div>
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Bottom Input */}
      <form onSubmit={handleSend} className="border-t border-gray-100 p-3 bg-white flex items-center gap-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message..."
          className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="text-sm font-semibold text-blue-500 hover:text-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function InstagramFeed() {
  const { events } = useSentinelStore()
  
  // Navigation views: 'feed' | 'dm_inbox' | 'dm_chat'
  const [view, setView] = useState('feed')
  const [activeChatUser, setActiveChatUser] = useState(null)
  
  // Comments Drawer
  const [activeCommentPost, setActiveCommentPost] = useState(null)
  const [postCommentsMap, setPostCommentsMap] = useState({})
  
  // DM History state
  const [dmHistory, setDmHistory] = useState(INITIAL_DMS)

  // Get Instagram events, fallback to all events
  const igEvents = events.filter(e => e.platform === 'Instagram')
  const displayEvents = igEvents.length >= 2 ? igEvents : events.slice(0, 12)

  // Generate stable seeds based on evidence hash or index
  const getImgSeed = (evt, idx) => {
    if (evt.evidence_hash) return parseInt(evt.evidence_hash.slice(0, 8), 16) % 1000 + idx
    return (idx + 1) * 17
  }

  // Comments handlers
  const handleOpenComments = (post) => {
    setActiveCommentPost(post)
    const postId = post.evidence_hash || post.username
    if (!postCommentsMap[postId]) {
      const idx = displayEvents.findIndex(e => (e.evidence_hash && e.evidence_hash === post.evidence_hash) || e.username === post.username)
      const seeded = generateMockCommentsForPost(post, idx >= 0 ? idx : 4)
      setPostCommentsMap(prev => ({ ...prev, [postId]: seeded }))
    }
  }

  const handleAddComment = async (text) => {
    if (!activeCommentPost) return
    const postId = activeCommentPost.evidence_hash || activeCommentPost.username
    
    // Call real-time moderation API
    let severity = 'NONE'
    let toxicityScore = 0.0
    let aiExplanation = ''
    try {
      const response = await fetch('http://localhost:8000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, platform: 'Instagram', username: 'you' })
      })
      if (response.ok) {
        const result = await response.json()
        severity = result.severity
        toxicityScore = result.toxicity_score
        aiExplanation = result.ai_explanation
      }
    } catch (err) {
      console.warn("Moderation API check failed: ", err)
      // Fallback local checks if offline
      if (text.toLowerCase().includes('kill') || text.toLowerCase().includes('die') || text.toLowerCase().includes('slut')) {
        severity = 'CRITICAL'
        toxicityScore = 0.98
        aiExplanation = "Self-harm recommendation or hate speech."
      }
    }

    const newComment = {
      id: `c_user_${Date.now()}`,
      username: 'you',
      avatar: avatarUrl('you'),
      text: text,
      time: 'Just now',
      severity,
      toxicity_score: toxicityScore,
      ai_explanation: aiExplanation
    }

    setPostCommentsMap(prev => {
      const list = prev[postId] || []
      return { ...prev, [postId]: [...list, newComment] }
    })
  }

  const handleOpenDMChat = (username) => {
    setActiveChatUser(username)
    setView('dm_chat')
  }

  if (view === 'dm_inbox') {
    return (
      <InstagramDMInbox 
        onBack={() => setView('feed')} 
        onSelectChat={(user) => {
          setActiveChatUser(user)
          setView('dm_chat')
        }}
      />
    )
  }

  if (view === 'dm_chat') {
    return (
      <InstagramDMChat 
        contactName={activeChatUser} 
        onBack={() => setView('dm_inbox')}
        dmHistory={dmHistory}
        setDmHistory={setDmHistory}
      />
    )
  }

  return (
    <div className="max-w-[470px] mx-auto bg-white min-h-screen rounded-2xl overflow-hidden shadow-card relative">
      {/* ── Instagram Header ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Instagram wordmark style */}
          <span className="text-2xl font-bold" style={{
            fontFamily: 'Billabong, cursive, sans-serif',
            background: IG_GRADIENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.5px',
          }}>
            Instagram
          </span>
          {/* Live monitoring badge */}
          <span className="flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            AI LIVE
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-gray-800">
            <Heart className="w-6 h-6" />
          </button>
          <button onClick={() => setView('dm_inbox')} className="text-gray-800 hover:text-gray-600 transition-colors">
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* ── Stories Row ── */}
      <div className="border-b border-gray-100 py-4">
        <div className="flex gap-4 px-4 overflow-x-auto scrollbar-hide">
          {/* Your story */}
          <StoryRing user={{ name: 'you', seen: false }} isYours />
          {/* Other users */}
          {STORY_USERS.map((u, i) => (
            <StoryRing key={u.name} user={u} />
          ))}
        </div>
      </div>

      {/* ── Reels Row ── */}
      <div className="border-b border-gray-100 py-3">
        <div className="flex items-center justify-between px-4 mb-3">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-gray-900" />
            <span className="text-sm font-semibold text-gray-900">Reels</span>
          </div>
          <button className="text-xs text-blue-500 font-semibold">See all</button>
        </div>
        <div className="flex gap-2.5 px-4 overflow-x-auto scrollbar-hide pb-1">
          {REEL_DATA.map((r, i) => (
            <ReelCard key={r.seed} {...r} />
          ))}
        </div>
      </div>

      {/* ── Post Feed ── */}
      <AnimatePresence>
        {displayEvents.map((evt, idx) => (
          <InstagramPost
            key={evt.evidence_hash || idx}
            event={evt}
            imgSeed={getImgSeed(evt, idx)}
            index={idx}
            onOpenComments={handleOpenComments}
            onOpenDMChat={handleOpenDMChat}
          />
        ))}
      </AnimatePresence>

      {displayEvents.length === 0 && (
        <div className="py-20 text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: IG_GRADIENT }}
          >
            <Play className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 text-sm">Waiting for Instagram activity…</p>
          <p className="text-gray-400 text-xs mt-1">Live stream will populate this feed</p>
        </div>
      )}

      {/* Bottom padding */}
      <div className="h-10" />

      {/* Comments Drawer Overlay */}
      {activeCommentPost && (
        <CommentsDrawer 
          post={activeCommentPost} 
          onClose={() => setActiveCommentPost(null)}
          commentsList={postCommentsMap[activeCommentPost.evidence_hash || activeCommentPost.username] || []}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  )
}
