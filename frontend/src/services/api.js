// SmartEvent web API client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('smartevent_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = { ...options, headers: { ...getAuthHeaders(), ...(options.headers || {}) } };

  let res;
  try {
    res = await fetch(url, config);
  } catch (networkErr) {
    throw new Error('Cannot reach the SmartEvent server. Check that the backend is running.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  // Session expired / token invalid while logged in -> tell the app to sign out
  if (res.status === 401 && localStorage.getItem('smartevent_token') && !endpoint.startsWith('/auth/login')) {
    window.dispatchEvent(new CustomEvent('smartevent:unauthorized'));
  }

  if (!res.ok || !data || data.success === false) {
    const err = new Error((data && data.error) || `Request failed (HTTP ${res.status})`);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

const qs = (params = {}) => {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
  const q = new URLSearchParams(clean).toString();
  return q ? `?${q}` : '';
};
const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const authApi = {
  login: (credentials) => apiRequest('/auth/login', json('POST', credentials)),
  signup: (userData) => apiRequest('/auth/signup', json('POST', userData)),
  googleConfig: () => apiRequest('/auth/google/config'),
  googleLogin: (googleData) => apiRequest('/auth/google', json('POST', googleData)),
  me: () => apiRequest('/auth/me'),
  changePassword: (currentPassword, newPassword) => apiRequest('/auth/password', json('PUT', { currentPassword, newPassword }))
};

export const eventsApi = {
  getAll: (params) => apiRequest(`/events${qs(params)}`),
  mine: () => apiRequest('/events/mine'),
  getById: (id) => apiRequest(`/events/${id}`),
  create: (data) => apiRequest('/events', json('POST', data)),
  update: (id, data) => apiRequest(`/events/${id}`, json('PUT', data)),
  delete: (id) => apiRequest(`/events/${id}`, { method: 'DELETE' }),
  getAttendees: (id) => apiRequest(`/events/${id}/attendees`)
};

export const categoriesApi = {
  getAll: () => apiRequest('/categories'),
  create: (data) => apiRequest('/categories', json('POST', data)),
  update: (id, data) => apiRequest(`/categories/${id}`, json('PUT', data)),
  delete: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' })
};

export const venuesApi = {
  getAll: () => apiRequest('/venues'),
  create: (data) => apiRequest('/venues', json('POST', data)),
  update: (id, data) => apiRequest(`/venues/${id}`, json('PUT', data)),
  delete: (id) => apiRequest(`/venues/${id}`, { method: 'DELETE' })
};

export const registrationsApi = {
  getAll: (params) => apiRequest(`/registrations${qs(params)}`),
  mine: () => apiRequest('/registrations/mine'),
  register: (eventId) => apiRequest('/registrations', json('POST', { eventId })),
  cancel: (registrationId) => apiRequest(`/registrations/${registrationId}`, { method: 'DELETE' }),
  cancelForEvent: (eventId) => apiRequest(`/registrations/event/${eventId}`, { method: 'DELETE' })
};

export const favoritesApi = {
  getAll: () => apiRequest('/favorites'),
  toggle: (eventId) => apiRequest(`/favorites/${eventId}`, { method: 'POST' })
};

export const notificationsApi = {
  getAll: () => apiRequest('/notifications'),
  markRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllRead: () => apiRequest('/notifications/read-all', { method: 'PUT' }),
  remove: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' })
};

export const smsApi = {
  getStatus: () => apiRequest('/sms/status'),
  getLogs: (params) => apiRequest(`/sms/logs${qs(params)}`),
  preview: (payload) => apiRequest('/sms/preview', json('POST', payload)),
  send: (payload) => apiRequest('/sms/send', json('POST', payload))
};

export const predictApi = {
  forecast: (payload) => apiRequest('/predict', json('POST', payload)),
  forEvent: (eventId) => apiRequest('/predict', json('POST', { eventId }))
};

export const analyticsApi = {
  get: () => apiRequest('/analytics')
};

export const adminApi = {
  getOverview: () => apiRequest('/admin/overview'),
  getActivity: (limit = 50) => apiRequest(`/admin/activity${qs({ limit })}`),
  getUsers: (params) => apiRequest(`/users${qs(params)}`),
  createUser: (data) => apiRequest('/users', json('POST', data)),
  updateUser: (id, data) => apiRequest(`/users/${id}`, json('PUT', data)),
  deleteUser: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' })
};

export const usersApi = {
  update: (id, data) => apiRequest(`/users/${id}`, json('PUT', data))
};
