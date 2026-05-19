import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'

interface Episode {
  id: number
  episode_number: number
  title: string
  publish_date: string
  play_count: number
  completion_rate: number
  likes: number
  comments: number
  bookmarks: number
  shares: number
  avg_play_duration: number
}

interface Retention {
  retention_90_min: number
  retention_80_min: number
  retention_75_min: number
  retention_50_min: number
  retention_25_min: number
  retention_10_min: number
  full_retention_data: number[]
}

interface CompareData {
  current: { episode_number: number; title: string; retention_50_min: number }
  previous?: { episode_number: number; title: string; retention_50_min: number }
  average?: Record<string, number>
  diagnosis: string
}

export default function EpisodeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [episode, setEpisode] = useState<Episode | null>(null)
  const [retention, setRetention] = useState<Retention | null>(null)
  const [compare, setCompare] = useState<CompareData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      api.get(`/episodes/${id}`),
      api.get(`/episodes/${id}/retention`).catch(() => null),
      api.get(`/episodes/${id}/retention/compare`).catch(() => null)
    ]).then(([epRes, retRes, compRes]) => {
      setEpisode(epRes.data)
      setRetention(retRes?.data || null)
      setCompare(compRes?.data || null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-slate-400">加载中...</div>
  if (!episode) return <div className="text-slate-400">单集不存在</div>

  const chartData = buildRetentionChart(retention)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/episodes')}
          className="px-3 py-1 bg-dark-700 rounded-lg text-sm hover:bg-dark-600"
        >
          ← 返回列表
        </button>
        <h1 className="text-2xl font-bold">第{episode.episode_number}期 · {episode.title}</h1>
      </div>

      {/* Info Card */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 grid grid-cols-2 md:grid-cols-4 gap-6">
        <Stat label="播放量" value={episode.play_count.toLocaleString()} />
        <Stat label="完播率" value={`${episode.completion_rate}%`} />
        <Stat label="点赞" value={episode.likes.toLocaleString()} />
        <Stat label="评论" value={episode.comments.toLocaleString()} />
        <Stat label="收藏" value={episode.bookmarks.toLocaleString()} />
        <Stat label="分享" value={episode.shares.toLocaleString()} />
        <Stat label="平均播放时长" value={`${episode.avg_play_duration}分钟`} />
        <Stat label="发布日期" value={episode.publish_date} />
      </div>

      {/* Diagnosis */}
      {compare?.diagnosis && (
        <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 border-l-4 border-l-accent">
          <div className="text-sm text-accent font-medium mb-1">内容诊断</div>
          <div className="text-sm text-slate-300">{compare.diagnosis}</div>
        </div>
      )}

      {/* Retention Curve */}
      {chartData.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">留存衰减曲线</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="minute" stroke="#64748b" fontSize={12} label={{ value: '时间(分钟)', position: 'insideBottom', offset: -5, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, '留存率']}
                />
                <ReferenceLine y={50} stroke="#475569" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="rate" stroke="#00B4FF" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4 text-xs text-slate-400">
            {retention?.retention_90_min && <span>90%留存: {retention.retention_90_min}min</span>}
            {retention?.retention_80_min && <span>80%留存: {retention.retention_80_min}min</span>}
            {retention?.retention_50_min && <span>50%留存: {retention.retention_50_min}min</span>}
            {retention?.retention_10_min && <span>10%留存: {retention.retention_10_min}min</span>}
          </div>
        </div>
      )}

      {!retention && (
        <div className="bg-dark-800 rounded-xl p-8 border border-dark-700 text-center text-slate-400">
          暂无留存数据 — 等待数据录入
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  )
}

function buildRetentionChart(retention: Retention | null) {
  if (!retention) return []
  if (retention.full_retention_data && retention.full_retention_data.length > 0) {
    return retention.full_retention_data.map((rate, i) => ({ minute: i, rate }))
  }
  // fallback: build from key points
  const points = [
    { pct: 100, min: 0 },
    { pct: 90, min: retention.retention_90_min || 0 },
    { pct: 80, min: retention.retention_80_min || 0 },
    { pct: 75, min: retention.retention_75_min || 0 },
    { pct: 50, min: retention.retention_50_min || 0 },
    { pct: 25, min: retention.retention_25_min || 0 },
    { pct: 10, min: retention.retention_10_min || 0 },
    { pct: 0, min: (retention.retention_10_min || 0) + 5 },
  ].filter(p => p.min !== null && p.min !== undefined)
  
  // interpolate for smooth curve
  const maxMin = Math.max(...points.map(p => p.min)) + 5
  const data = []
  for (let m = 0; m <= maxMin; m++) {
    // simple linear interpolation
    let rate = 0
    for (let i = 0; i < points.length - 1; i++) {
      if (m >= points[i].min && m <= points[i+1].min) {
        const t = (m - points[i].min) / (points[i+1].min - points[i].min || 1)
        rate = points[i].pct + t * (points[i+1].pct - points[i].pct)
        break
      }
    }
    if (m > points[points.length-1].min) rate = 0
    data.push({ minute: m, rate: Math.max(0, rate) })
  }
  return data
}
