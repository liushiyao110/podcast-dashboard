import { useState } from 'react'
import api from '../utils/api'
import { useAuth } from '../hooks/useAuth'

export default function Settings() {
  const { user } = useAuth()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setError('')

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致')
      return
    }
    if (newPassword.length < 6) {
      setError('新密码至少6位')
      return
    }

    try {
      await api.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword,
      })
      setMsg('密码修改成功')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setError(err.response?.data?.detail || '修改失败')
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">设置</h1>

      {/* User Info */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">账号信息</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400">用户名</div>
            <div className="font-medium">{user?.username}</div>
          </div>
          <div>
            <div className="text-slate-400">权限角色</div>
            <div className="font-medium">{user?.role === 'admin' ? '管理员' : '只读'}</div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 max-w-md">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">修改密码</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">旧密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 rounded-lg border border-dark-600 text-sm focus:outline-none focus:border-accent"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 rounded-lg border border-dark-600 text-sm focus:outline-none focus:border-accent"
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-dark-700 rounded-lg border border-dark-600 text-sm focus:outline-none focus:border-accent"
              required
            />
          </div>
          {error && <div className="text-red-400 text-xs">{error}</div>}
          {msg && <div className="text-green-400 text-xs">{msg}</div>}
          <button
            type="submit"
            className="w-full py-2 bg-accent text-dark-900 font-semibold rounded-lg hover:bg-accent/90 text-sm"
          >
            修改密码
          </button>
        </form>
      </div>

      {/* Deploy Info */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">部署信息</h2>
        <div className="text-xs text-slate-400 space-y-1">
          <div>后端地址：http://localhost:8000</div>
          <div>前端构建：dist/ 目录</div>
          <div>数据库：backend/data/dashboard.db</div>
          <div>备份目录：workspace/backup/</div>
        </div>
      </div>
    </div>
  )
}
