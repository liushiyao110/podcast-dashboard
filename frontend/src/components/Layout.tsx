import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { to: '/dashboard', label: '概览' },
    { to: '/episodes', label: '单集' },
    { to: '/compare', label: '对比' },
    { to: '/audience', label: '画像' },
    { to: '/reports', label: '简报' },
    { to: '/settings', label: '设置' },
    ...(user?.role === 'admin' ? [{ to: '/input', label: '录入' }] : []),
  ]

  return (
    <div className="min-h-screen bg-dark-900 text-slate-200 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex w-56 bg-dark-800 border-r border-dark-700 flex-col py-6 px-4 fixed h-full">
        <div className="text-accent font-bold text-xl mb-8 tracking-tight">保持含人量</div>
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({isActive}) => `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-accent/20 text-accent' : 'hover:bg-dark-700'}`}>
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="mt-auto">
          <div className="text-xs text-slate-500 mb-2">{user?.username} ({user?.role})</div>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white">退出</button>
        </div>
      </nav>

      {/* Mobile Header + Bottom Nav */}
      <div className="md:hidden">
        <div className="bg-dark-800 border-b border-dark-700 px-4 py-3 flex items-center justify-between">
          <div className="text-accent font-bold text-lg">保持含人量</div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="text-slate-400">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
        {menuOpen && (
          <div className="bg-dark-800 border-b border-dark-700 px-4 py-2 space-y-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)} className={({isActive}) => `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-accent/20 text-accent' : 'hover:bg-dark-700'}`}>
                {item.label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-dark-700">
              <div className="text-xs text-slate-500 px-3">{user?.username} ({user?.role})</div>
              <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white px-3 py-2">退出</button>
            </div>
          </div>
        )}
      </div>

      {/* Main */}
      <main className="flex-1 md:ml-56 p-4 md:p-8 pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Tab Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-800 border-t border-dark-700 flex justify-around py-2 z-50">
        {navItems.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to} className={({isActive}) => `px-2 py-1 text-xs ${isActive ? 'text-accent' : 'text-slate-500'}`}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
