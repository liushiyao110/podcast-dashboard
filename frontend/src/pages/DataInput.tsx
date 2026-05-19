import { useState, useRef } from 'react'
import api from '../utils/api'

export default function DataInput() {
  const [file, setFile] = useState<File | null>(null)
  const [msg, setMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async () => {
    if (!file) return
    setMsg('上传中...')
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await api.post('/import/csv', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setMsg(`成功导入 ${res.data.imported} 条数据`)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
    } catch (err: any) {
      setMsg(err.response?.data?.detail || '导入失败')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">数据录入</h1>
      <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 max-w-md">
        <h2 className="text-sm font-semibold mb-4">CSV 批量导入</h2>
        <p className="text-xs text-slate-400 mb-4">
          上传小宇宙导出的 CSV 文件，系统会自动解析并录入数据
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-dark-900 hover:file:bg-accent/90 mb-4"
        />
        <button
          onClick={handleUpload}
          disabled={!file}
          className="px-4 py-2 bg-accent text-dark-900 font-semibold rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          开始导入
        </button>
        {msg && <div className="mt-3 text-xs text-slate-300">{msg}</div>}
      </div>
    </div>
  )
}