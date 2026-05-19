import { useEffect, useState } from 'react'
import api from '../utils/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'

interface Stats {
  total_subscribers: number
  total_plays: number
  avg_completion_rate: number
  days_since_last_publish: number
}

interface TrendPoint {
  date: string
  value: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [playTrend, setPlayTrend] = useState<TrendPoint[]>([])

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setStats(r.data))
    api.get('/dashboard/trends').then((r) => setPlayTrend(r.data.play_trend || []))
  }, [])

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">概览仪表盘</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="总播放量" value={stats?.total_plays?.toLocaleString() || '—'} />
        <KpiCard label="平均完播率" value={stats?.avg_completion_rate ? `${stats.avg_completion_rate}%` : '—'} />
        <KpiCard label="距上次发布" value={stats?.days_since_last_publish != null ? `${stats.days_since_last_publish} 天` : '—'} />
        <KpiCard label="总订阅" value={stats?.total_subscribers?.toLocaleString() || '—'} />
      </div>

      {/* Play Trend Chart */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <h2 className="text-sm font-semibold text-slate-300 mb-4">播放量趋势</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={playTrend}>
              <defs>
                <linearGradient id="playGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00B4FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00B4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="value" stroke="#00B4FF" fill="url(#playGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-dark-800 rounded-xl p-5 border border-dark-700">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-bold text-accent">{value}</div>
    </div>
  )
}
