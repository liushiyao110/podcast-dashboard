import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Episodes from './pages/Episodes'
import EpisodeDetail from './pages/EpisodeDetail'
import EpisodeCompare from './pages/EpisodeCompare'
import Audience from './pages/Audience'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import DataInput from './pages/DataInput'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-dark-900 flex items-center justify-center text-slate-400">加载中...</div>
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/episodes" element={<RequireAuth><Episodes /></RequireAuth>} />
      <Route path="/episodes/:id" element={<RequireAuth><EpisodeDetail /></RequireAuth>} />
      <Route path="/compare" element={<RequireAuth><EpisodeCompare /></RequireAuth>} />
      <Route path="/audience" element={<RequireAuth><Audience /></RequireAuth>} />
      <Route path="/reports" element={<RequireAuth><Reports /></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
      <Route path="/input" element={<RequireAuth><DataInput /></RequireAuth>} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
