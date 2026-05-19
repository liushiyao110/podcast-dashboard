import axios from 'axios'

// 生产环境用环境变量或当前域名，开发环境用 localhost
const isProduction = import.meta.env.PROD
const baseURL = isProduction 
  ? (import.meta.env.VITE_API_URL || '/api')  // 生产环境：同域 /api 或指定地址
  : 'http://localhost:8000/api'  // 开发环境

const api = axios.create({
  baseURL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
