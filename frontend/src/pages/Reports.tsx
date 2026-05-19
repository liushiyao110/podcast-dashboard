import { useEffect, useState } from 'react'
import api from '../utils/api'

interface Report {
  title: string
  generated_at: string
  summary: string
  diagnosis: string
  key_metrics: {
    total_plays: number
    avg_completion_rate: number
    best_episode: {
      id: number | null
      title: string | null
      play_count: number
    }
    recent_updates: number
  }
}

export default function Reports() {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/reports/weekly').then((r) => {
      setReport(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-slate-400">加载中...</div>
  if (!report) return <div className="text-slate-400">暂无报告数据</div>

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">分析简报</h1>

      {/* Weekly Report Card */}
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-accent">{report.title}</h2>
          <div className="text-xs text-slate-500">
            生成时间：{new Date(report.generated_at).toLocaleString('zh-CN')}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-dark-700/50 rounded-lg p-4 mb-4">
          <div className="text-sm font-medium text-slate-300 mb-2">数据摘要</div>
          <pre className="text-sm text-slate-400 whitespace-pre-wrap font-sans">{report.summary}</pre>
        </div>

        {/* Diagnosis */}
        <div className="bg-dark-700/50 rounded-lg p-4 mb-4 border-l-4 border-l-accent">
          <div className="text-sm font-medium text-accent mb-2">内容诊断</div>
          <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans">{report.diagnosis}</pre>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="总播放量" value={report.key_metrics.total_plays.toLocaleString()} />
          <MetricCard label="平均完播率" value={`${report.key_metrics.avg_completion_rate}%`} />
          <MetricCard
            label="最佳单集"
            value={report.key_metrics.best_episode.title || '—'}
            sub={`${report.key_metrics.best_episode.play_count.toLocaleString()} 播放`}
          />
          <MetricCard label="近14天更新" value={`${report.key_metrics.recent_updates} 次`} />
        </div>
      </div>

      {/* Export Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 border border-dark-600"
        >
          🖨️ 打印 / 导出 PDF
        </button>
        <button
          onClick={() => {
            const text = `${report.title}\n\n${report.summary}\n\n内容诊断：\n${report.diagnosis}`
            navigator.clipboard.writeText(text)
            alert('报告内容已复制到剪贴板')
          }}
          className="px-4 py-2 bg-dark-700 rounded-lg text-sm hover:bg-dark-600 border border-dark-600"
        >
          📋 复制文本
        </button>
      </div>
    </div>
  )
}

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-dark-700/50 rounded-lg p-4">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className="text-lg font-semibold text-slate-200">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  )
}
