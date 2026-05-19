import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

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
}

export default function Episodes() {
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [sortBy, setSortBy] = useState('publish_date')
  const [order, setOrder] = useState('desc')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/episodes?sort_by=${sortBy}&order=${order}`).then((r) => setEpisodes(r.data))
  }, [sortBy, order])

  const filtered = episodes.filter((ep) =>
    ep.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">单集分析</h1>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="搜索单集名称..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 bg-dark-700 rounded-lg border border-dark-600 text-sm w-64"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2 bg-dark-700 rounded-lg border border-dark-600 text-sm"
        >
          <option value="publish_date">发布日期</option>
          <option value="play_count">播放量</option>
          <option value="completion_rate">完播率</option>
          <option value="comments">评论数</option>
        </select>
        <button
          onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
          className="px-3 py-2 bg-dark-700 rounded-lg border border-dark-600 text-sm hover:bg-dark-600"
        >
          {order === 'desc' ? '↓ 降序' : '↑ 升序'}
        </button>
      </div>

      <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-dark-700 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">集数</th>
              <th className="px-4 py-3 text-left">名称</th>
              <th className="px-4 py-3 text-left">发布日期</th>
              <th className="px-4 py-3 text-right">播放量</th>
              <th className="px-4 py-3 text-right">完播率</th>
              <th className="px-4 py-3 text-right">点赞</th>
              <th className="px-4 py-3 text-right">评论</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ep) => (
              <tr
                key={ep.id}
                onClick={() => navigate(`/episodes/${ep.id}`)}
                className="border-t border-dark-700 hover:bg-dark-700/50 cursor-pointer"
              >
                <td className="px-4 py-3">{ep.episode_number}</td>
                <td className="px-4 py-3 font-medium">{ep.title}</td>
                <td className="px-4 py-3 text-slate-400">{ep.publish_date}</td>
                <td className="px-4 py-3 text-right">{ep.play_count.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{ep.completion_rate}%</td>
                <td className="px-4 py-3 text-right">{ep.likes.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{ep.comments.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
