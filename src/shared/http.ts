import axios from 'axios'

// Các prefix proxy đã được khai báo trong vite.config.ts
// Vite server sẽ tự forward request tới đúng backend, tránh CORS
const CONTRACT_PROXY = '/contract-api'   // → api-contract-nhom2contract-student-api.onrender.com
const ROOM_PROXY     = '/room-api'        // → roombuildingservice-1ijx.onrender.com
const BILLING_PROXY  = '/billing-api'     // → billing-maintenance-backend.onrender.com

export const http = axios.create({
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — định tuyến đúng API server và attach JWT
http.interceptors.request.use((config) => {
  const url = config.url || ''

  // Chỉ xử lý nếu URL chưa phải là full URL hoặc proxy path
  if (!url.startsWith('http') && !url.startsWith('/contract-api') && !url.startsWith('/room-api') && !url.startsWith('/billing-api')) {
    // Room API (Nhóm 1)
    const roomPrefixes    = ['/api/rooms', '/api/buildings', '/api/roomtypes', '/api/beds', '/api/equipments']
    // Billing & Auth API (Nhóm 3)
    const billingPrefixes = ['/api/auth', '/api/users', '/api/invoices', '/api/payments', '/api/maintenance', '/api/debts']
    // Contract & Student API (Nhóm 2)
    const contractPrefixes = ['/api/students', '/api/contracts', '/api/applications', '/api/occupancies']

    if (roomPrefixes.some(p => url.startsWith(p))) {
      config.url = ROOM_PROXY + url
    } else if (billingPrefixes.some(p => url.startsWith(p))) {
      config.url = BILLING_PROXY + url
    } else if (contractPrefixes.some(p => url.startsWith(p))) {
      config.url = CONTRACT_PROXY + url
    }
  }

  // Xóa baseURL để tránh bị ghép đôi với proxy path
  config.baseURL = ''

  const token = localStorage.getItem('ktx_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — xử lý lỗi toàn cục
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('ktx_token')
      localStorage.removeItem('ktx_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

export default http
