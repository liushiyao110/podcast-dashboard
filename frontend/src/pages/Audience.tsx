import { useEffect, useState } from 'react'
import api from '../utils/api'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts'

interface AudienceData {
  record_date: string
  male_pct: number
  female_pct: number
  age_under_18: number
  age_18_22: number
  age_23_28: number
  age_29_35: number
  age_36_40: number
  age_over_40: number
}

export default function Audience() {
  const [data, setData] = useState<AudienceData[]>([])
  const [latest, setLatest] = useState<AudienceData | null>(null)

  useEffect(() => {
    api.get('/audience').then((r) => {
      const records = r.data || []
      setData(records.reverse())
      setLatest(records[records.length - 1])
    })
  }, [])

  const genderData = latest ? [
    { name: '男', value: latest.male_pct, color: '#00B4FF' },
    { name: '女', value: latest.female_pct, color: '#F472B6' },
  ] : []

  const ageData = latest ? [
    { name: '<18', value: latest.age_under_18 },
    { name: '18-22', value: latest.age_18_22 },
    { name: '23-28', value: latest.age_23_28 },
    { name: '29-35', value: latest.age_29_35 },
    { name: '36-40', value: latest.age_36_40 },
    { name: '>40', value: latest.age_over_40 },
  ] : []

  const genderTrend = data.map((d) => ({
    date: d.record_date,
    male: d.male_pct,
    female: d.female_pct,
  }))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">听众画像</h1>

      {/* Summary */}
      {latest && (
        <div className="bg-dark-800/50 rounded-xl p-4 border border-dark-700 border-l-4 border-l-accent">
          <div className="text-sm text-accent font-medium mb-1">画像诊断</div>
          <div className="text-sm text-slate-300">
            当前听众以{latest.male_pct > latest.female_pct ? '男性' : '女性'}为主（{Math.max(latest.male_pct, latest.female_pct)}%），
            黄金人群（23-35岁）占比 {(latest.age_23_28 + latest.age_29_35).toFixed(1)}%
          </div>
        </div>
      )}

      {/* Gender + Age Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">性别分布</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`${value}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs">
            {genderData.map((g) => (
              <span key={g.name} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                {g.name} {g.value}%
              </span>
            ))}
          </div>
        </div>

        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">年龄分布</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(value: number) => [`${value}%`]}
                />
                <Bar dataKey="value" fill="#00B4FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gender Trend */}
      {genderTrend.length > 1 && (
        <div className="bg-dark-800 rounded-xl p-6 border border-dark-700">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">性别趋势</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={genderTrend}>
                <defs>
                  <linearGradient id="maleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B4FF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00B4FF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="femaleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F472B6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F472B6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#e2e8f0' }}
                />
                <Area type="monotone" dataKey="male" stroke="#00B4FF" fill="url(#maleGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="female" stroke="#F472B6" fill="url(#femaleGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
