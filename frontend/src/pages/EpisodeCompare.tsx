import { useState, useEffect } from 'react'
import api from '../utils/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
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
}

interface RetentionData {
  episode_id: number
  full_retention_data: number[]
}

export default function EpisodeCompare() {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [selected, setSelected] = useState<number[]>([])
  const [retentionData, setRetentionData] = useState<Record<number, number[]>>({})

  useEffect(() => {
    api.get('/episodes?sort_by=publish_date&order=desc').then((r) => setEpisodes(r.data))
  }, [])

  useEffect(() => {
    if (selected.length === 0) return
    selected.forEach((id) => {
      if (retentionData[id]) return
      api.get(`/episodes/${id}/retention`).then((r) => {
        setRetentionData((prev) => ({ ...prev, [id]: r.data.full_retention_data || [] }))
      }).catch(() => {})
    })
  }, [selected])

  const toggleSelect = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id))
    } else if (selected.length < 3) {
      setSelected([...selected, id])
    }
  }

  const chartData = buildCompareChart(selected, retentionData, episodes)
  const colors = ['#00B4FF', '#F472B6', '#34D399']

  const selectedEps = episodes.filter((ep) => selected.includes(ep.id))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">单集对比</h1>

      {/* Selection */}
      <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
        <div className="text-sm text-slate-400 mb-3">选择 2-3 集进行对比（点击选中）</div>
        <div className="flex flex-wrap gap-2">
          {episodes.map((ep) => (
            <button
              key={ep.id}
              onClick={() => toggleSelect(ep.id)}
              className={`px-3 py-2 rounded-lg text-sm border transition ${
                selected.includes(ep.id)
                  ? 'bg-accent/20 border-accent text-accent'
                  : 'bg-dark-700 border-dark-600 hover:bg-dark-600'
              } ${selected.length >= 3 && !selected.includes(ep.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={selected.length >= 3 && !selected.includes(ep.id)}
            >
              第{ep.episode_number}期 · {ep.title}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison Stats */}
      {selectedEps.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 overflow-x-auto">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">数据对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="text-slate-400">
                <tr>
                  <th className="px-4 py-2 text-left">指标</th>
                  {selectedEps.map((ep, i) => (
                    <th key={ep.id} className="px-4 py-2 text-right" style={{ color: colors[i] }}>
                      第{ep.episode_number}期
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="播放量" values={selectedEps.map((ep) => ep.play_count.toLocaleString())} />
                <CompareRow label="完播率" values={selectedEps.map((ep) => `${ep.completion_rate}%`)} />
                <CompareRow label="点赞" values={selectedEps.map((ep) => ep.likes.toLocaleString())} />
                <CompareRow label="评论" values={selectedEps.map((ep) => ep.comments.toLocaleString())} />
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Retention Comparison Chart */}
      {chartData.length > 0 && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">留存曲线对比</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="minute" stroke="#64748b" fontSize={12} label={{ value: '时间(分钟)', position: 'insideBottom', offset: -5, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Legend />
                {selected.map((id, i) => {
                  const ep = episodes.find((e) => e.id === id)
                  return (
                    <Line
                      key={id}
                      type="monotone"
                      dataKey={`ep_${id}`}
                      stroke={colors[i]}
                      strokeWidth={2}
                      dot={false}
                      name={`第${ep?.episode_number}期`}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr className="border-t border-dark-700">
      <td className="px-4 py-3 text-slate-400">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-4 py-3 text-right font-medium">{v}</td>
      ))}
    </tr>
  )
}

function buildCompareChart(selected: number[], retentionData: Record<number, number[]>, episodes: Episode[]) {
  if (selected.length < 2) return []

  const maxLen = Math.max(...selected.map((id) => retentionData[id]?.length || 0))
  if (maxLen === 0) return []

  const data = []
  for (let i = 0; i < maxLen; i++) {
    const point: Record<string, number> = { minute: i }
    selected.forEach((id) => {
      const values = retentionData[id] || []
      point[`ep_${id}`] = values[i] ?? null
    })
    data.push(point)
  }
  return data
}
