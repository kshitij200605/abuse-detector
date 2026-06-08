import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import InstagramFeed from './pages/InstagramFeed'
import WhatsAppChat from './pages/WhatsAppChat'
import RedditFeed from './pages/RedditFeed'
import DiscordMonitor from './pages/DiscordMonitor'
import EvidenceLocker from './pages/EvidenceLocker'
import OffenderProfiles from './pages/OffenderProfiles'
import ForensicsCenter from './pages/ForensicsCenter'
import { useWebSocket } from './hooks/useWebSocket'

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -5 },
}

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function WebSocketInitializer() {
  useWebSocket()
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <WebSocketInitializer />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<AnimatedPage><Dashboard /></AnimatedPage>} />
          <Route path="instagram" element={<AnimatedPage><InstagramFeed /></AnimatedPage>} />
          <Route path="whatsapp" element={<AnimatedPage><WhatsAppChat /></AnimatedPage>} />
          <Route path="reddit" element={<AnimatedPage><RedditFeed /></AnimatedPage>} />
          <Route path="discord" element={<AnimatedPage><DiscordMonitor /></AnimatedPage>} />
          <Route path="offenders" element={<AnimatedPage><OffenderProfiles /></AnimatedPage>} />
          <Route path="evidence" element={<AnimatedPage><EvidenceLocker /></AnimatedPage>} />
          <Route path="forensics" element={<AnimatedPage><ForensicsCenter /></AnimatedPage>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
