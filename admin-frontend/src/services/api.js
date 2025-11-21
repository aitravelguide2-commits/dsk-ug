import axios from 'axios'
import supabase from './supabase.js'
const baseURL = import.meta.env.VITE_API_URL ?? 'https://backend-dsk.tripvega.com/api'
const api = axios.create({ baseURL })
const disableAuth = String(import.meta.env.VITE_DISABLE_AUTH || '').toLowerCase() === 'true'

api.interceptors.request.use(async cfg => {
  let t = null
  try { t = (await supabase.auth.getSession()).data.session?.access_token } catch (e) { /* ignore */ }
  t = t || localStorage.token
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})
api.interceptors.response.use(null, err => {
  if (err.response?.status === 401 && !disableAuth) { localStorage.clear(); location.href = '/login' }
  return Promise.reject(err)
})
export default api
