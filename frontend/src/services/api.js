import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor: attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: handle token refresh
api.interceptors.response.use(
  res => res,
  async error => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = localStorage.getItem('refresh_token')
        const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh })
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ===== Auth =====
export const authApi = {
  login: (data) => api.post('/auth/login/', data),
  logout: (refresh) => api.post('/auth/logout/', { refresh }),
  me: () => api.get('/users/me/'),
  updateMe: (data) => api.patch('/users/me/', data),
  changePassword: (data) => api.post('/users/change-password/', data),
}

// ===== Users & Departments =====
export const usersApi = {
  list: (params) => api.get('/users/', { params }),
  create: (data) => api.post('/users/', data),
  get: (id) => api.get(`/users/${id}/`),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  stats: () => api.get('/users/dashboard/stats/'),
}

export const departmentsApi = {
  list: () => api.get('/users/departments/'),
  create: (data) => api.post('/users/departments/', data),
  update: (id, data) => api.patch(`/users/departments/${id}/`, data),
  delete: (id) => api.delete(`/users/departments/${id}/`),
}

// ===== Students =====
export const studentsApi = {
  list: (params) => api.get('/students/', { params }),
  create: (data) => api.post('/students/', data),
  get: (id) => api.get(`/students/${id}/`),
  update: (id, data) => api.patch(`/students/${id}/`, data),
  delete: (id) => api.delete(`/students/${id}/`),
  me: () => api.get('/students/me/'),
  weak: () => api.get('/students/weak/'),
  courses: (params) => api.get('/students/courses/', { params }),
  createCourse: (data) => api.post('/students/courses/', data),
  updateCourse: (id, data) => api.patch(`/students/courses/${id}/`, data),
  deleteCourse: (id) => api.delete(`/students/courses/${id}/`),
  academicYears: () => api.get('/students/academic-years/'),
}

// ===== Faculty =====
export const facultyApi = {
  list: (params) => api.get('/faculty/', { params }),
  create: (data) => api.post('/faculty/', data),
  get: (id) => api.get(`/faculty/${id}/`),
  update: (id, data) => api.patch(`/faculty/${id}/`, data),
  delete: (id) => api.delete(`/faculty/${id}/`),
  me: () => api.get('/faculty/me/'),
}

// ===== Attendance =====
export const attendanceApi = {
  sessions: (params) => api.get('/attendance/sessions/', { params }),
  createSession: (data) => api.post('/attendance/sessions/', data),
  getSession: (id) => api.get(`/attendance/sessions/${id}/`),
  markAttendance: (data) => api.post('/attendance/mark/', data),
  mySummary: () => api.get('/attendance/summary/'),
  studentSummary: (id) => api.get(`/attendance/summary/${id}/`),
  stats: (params) => api.get('/attendance/stats/', { params }),
}

// ===== Marks =====
export const marksApi = {
  list: (params) => api.get('/marks/', { params }),
  create: (data) => api.post('/marks/', data),
  bulkEntry: (data) => api.post('/marks/bulk/', data),
  myMarks: () => api.get('/marks/my/'),
  studentMarks: (id) => api.get(`/marks/student/${id}/`),
  analytics: (courseId) => api.get(`/marks/analytics/${courseId}/`),
  examTypes: () => api.get('/marks/exam-types/'),
}

// ===== Timetable =====
export const timetableApi = {
  list: (params) => api.get('/timetable/', { params }),
  create: (data) => api.post('/timetable/', data),
  update: (id, data) => api.patch(`/timetable/${id}/`, data),
  delete: (id) => api.delete(`/timetable/${id}/`),
  slots: () => api.get('/timetable/slots/'),
  my: () => api.get('/timetable/my/'),
}

// ===== Alerts =====
export const alertsApi = {
  list: (params) => api.get('/alerts/', { params }),
  get: (id) => api.get(`/alerts/${id}/`),
  markRead: (id) => api.post(`/alerts/${id}/read/`),
  resolve: (id) => api.post(`/alerts/${id}/resolve/`),
  runAI: () => api.post('/alerts/run-ai/'),
  stats: () => api.get('/alerts/stats/'),
}

export default api
