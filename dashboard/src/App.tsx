import { Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout'
import Home from './pages/Home'
import TimelinePage from './pages/TimelinePage'
import ConfigPage from './pages/ConfigPage'
import ChatPage from './pages/ChatPage'
import CamerasPage from './pages/CamerasPage'
import { useWebSocket } from './hooks/useWebSocket'

export default function App() {
  useWebSocket()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/config" element={<ConfigPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/cameras" element={<CamerasPage />} />
      </Route>
    </Routes>
  )
}
