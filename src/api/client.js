import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

let accessToken = null

export const setAccessToken = (token) => {
  accessToken = token
}
export const clearAccessToken = () => {
  accessToken = null
}

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let refreshing = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }
    original._retry = true

    try {
      if (!refreshing) {
        refreshing = axios
          .post(`${API_URL}/auth/refresh/`, null, { withCredentials: true })
          .then((res) => {
            setAccessToken(res.data.access)
            return res.data.access
          })
          .finally(() => {
            refreshing = null
          })
      }
      const newAccess = await refreshing
      original.headers.Authorization = `Bearer ${newAccess}`
      return api(original)
    } catch (refreshError) {
      clearAccessToken()
      window.dispatchEvent(new CustomEvent('auth:logout'))
      return Promise.reject(refreshError)
    }
  },
)

export default api