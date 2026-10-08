// SmartEvent Frontend API Service Client
const API_BASE_URL = '/api';

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
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}: Failed request`);
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

// Admin API
export const adminApi = {
  getOverview: () => apiRequest('/admin/overview'),
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/users${query ? `?${query}` : ''}`);
  },
  updateUser: (id, userData) => apiRequest(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
  deleteUser: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' })
};
