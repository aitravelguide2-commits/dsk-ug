import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_PUBLIC_API_URL || 'https://backend-dsk.tripvega.com/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    console.error('API Error:', err?.response?.data || err.message)
    return Promise.reject(err?.response?.data || err)
  }
)

export const accommodationService = {
  getAll(params = {}) {
    // Public catalog listing
    return api.get('/catalog/accommodations', { params })
  },
  getById(id) {
    return api.get(`/catalog/accommodations/${id}`)
  },
  checkAvailability(id, startDate, endDate) {
    return api.get(`/catalog/accommodations/${id}/availability`, { params: { startDate, endDate } })
  },
  priceEstimate(id, checkIn, checkOut, opts = {}) {
    const params = { checkIn, checkOut, ...opts }
    return api.get(`/catalog/accommodations/${id}/price`, { params })
  }
}

export const contentService = {
  getPageContent(page) {
    return api.get('/content', { params: { page } })
  }
}

export default api

