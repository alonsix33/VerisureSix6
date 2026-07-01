import { Routes, Route } from 'react-router-dom'
import Layout from './pages/Layout'
import Home from './pages/Home'
import TimelinePage from './pages/TimelinePage'
import CamerasPage from './pages/CamerasPage'
import ChatPage from './pages/ChatPage'
import SchedulesPage from './pages/SchedulesPage'
import SettingsPage from './pages/SettingsPage'
import ConfigPage from './pages/ConfigPage'
import UpdatePrompt from './components/UpdatePrompt'
import { useWebSocket } from './hooks/useWebSocket'

export default function App() {
  useWebSocket()

  return (
    <>
      <UpdatePrompt />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"          element={<Home />} />
          <Route path="/timeline"  element={<TimelinePage />} />
          <Route path="/cameras"   element={<CamerasPage />} />
          <Route path="/chat"      element={<ChatPage />} />
          <Route path="/schedules" element={<SchedulesPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
          <Route path="/config"    element={<ConfigPage />} />
        </Route>
      </Routes>
    </>
  )
}
