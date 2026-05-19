import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || '登录失败')
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="w-full max-w-sm bg-dark-800 rounded-xl p-8 border border-dark-700">
        <h1 className="text-2xl font-bold text-accent mb-2">保持含人量</h1>
        <p className="text-slate-400 text-sm mb-6">数据看板登录</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 rounded-lg border border-dark-600 text-sm focus:outline-none focus:border-accent"
              placeholder="输入用户名"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 rounded-lg border border-dark-600 text-sm focus:outline-none focus:border-accent"
              placeholder="输入密码"
              required
            />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 bg-accent text-dark-900 font-semibold rounded-lg hover:bg-accent/90 text-sm"
          >
            登录
          </button>
        </form>
      </div>
    </div>
  )
}