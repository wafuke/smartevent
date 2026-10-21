// SmartEvent Frontend API Service Client
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('smartevent_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {})
    }
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `HTTP ${res.status}: Request failed`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

// Auth API
export const authApi = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  signup: (userData) => apiRequest('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  googleLogin: (googleData) => apiRequest('/auth/google', { method: 'POST', body: JSON.stringify(googleData) }),
  me: () => apiRequest('/auth/me'),
  getUsers: () => apiRequest('/users')
};

// Events API
export const eventsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/events${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiRequest(`/events/${id}`),
  create: (eventData) => apiRequest('/events', { method: 'POST', body: JSON.stringify(eventData) }),
  update: (id, eventData) => apiRequest(`/events/${id}`, { method: 'PUT', body: JSON.stringify(eventData) }),
  delete: (id) => apiRequest(`/events/${id}`, { method: 'DELETE' }),
  getAttendees: (id) => apiRequest(`/events/${id}/attendees`)
};

// Categories API
export const categoriesApi = {
  getAll: () => apiRequest('/categories'),
  create: (categoryData) => apiRequest('/categories', { method: 'POST', body: JSON.stringify(categoryData) }),
  update: (id, categoryData) => apiRequest(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(categoryData) }),
  delete: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' })
};

// Registrations API
export const registrationsApi = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/registrations${query ? `?${query}` : ''}`);
  },
  register: (registrationData) => apiRequest('/registrations', { method: 'POST', body: JSON.stringify(registrationData) }),
  cancel: (id) => apiRequest(`/registrations/${id}`, { method: 'DELETE' })
};

// Favorites API
export const favoritesApi = {
  getAll: () => apiRequest('/favorites'),
  toggle: (eventId) => apiRequest(`/favorites/${eventId}`, { method: 'POST' })
};

// Africa's Talking Priority SMS API
export const smsApi = {
  getStatus: () => apiRequest('/sms/status'),
  getLogs: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/sms/logs${query ? `?${query}` : ''}`);
  },
  send: (smsPayload) => apiRequest('/sms/send', { method: 'POST', body: JSON.stringify(smsPayload) })
};

// ML Turnout Prediction API
export const predictApi = {
  forecast: (payload) => apiRequest('/predict', { method: 'POST', body: JSON.stringify(payload) })
};

// Admin & Users CRUD API
export const adminApi = {
  getOverview: () => apiRequest('/admin/overview'),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/users${query ? `?${query}` : ''}`);
  },
  createUser: (userData) => apiRequest('/users', { method: 'POST', body: JSON.stringify(userData) }),
  updateUser: (id, userData) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteUser: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' })
};
