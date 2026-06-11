export const API_BASE_URL = (() => {
  const viteUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : '';
  const reactUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_API_URL : '';
  const configured = viteUrl || reactUrl;
  if (configured) return configured.replace(/\/$/, '');

  if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)) {
    return 'http://localhost:5000';
  }

  return 'https://sahomeschooling-services-4.onrender.com';
})();

const request = async (method, endpoint, body = null, token = null) => {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = isForm ? body : JSON.stringify(body);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || data.error || 'Request failed');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth
  login: (data) => request('POST', '/api/auth/login', data),
  register: (data) => request('POST', '/api/auth/register', data),
  getUsers: (token) => request('GET', '/api/auth/users', null, token),

  // Providers
  getProviders: () => request('GET', '/api/providers'),
  getProviderById: (id) => request('GET', `/api/providers/${id}`),
  createProvider: (data) => request('POST', '/api/providers', data),
  updateProvider: (id, data, token) => request('PATCH', `/api/providers/${id}`, data, token),
  updateProviderStatus: (id, status, token) => request('PATCH', `/api/providers/${id}/status`, { status }, token),
  approveProvider: (id, token) => request('POST', `/api/providers/${id}/approve`, null, token),
  rejectProvider: (id, token) => request('POST', `/api/providers/${id}/reject`, null, token),

  // Stats & Reviews
  getStats: (token) => request('GET', '/api/stats', null, token),
  getReviews: (token) => request('GET', '/api/reviews', null, token),
  getFeaturedSlots: (token) => request('GET', '/api/featured-slots', null, token),
  assignFeaturedSlot: (data, token) => request('POST', '/api/featured-slots/assign', data, token),
  removeFeaturedSlot: (slotId, token) => request('POST', `/api/featured-slots/${slotId}/remove`, null, token),
  rotateFeaturedSlot: (slotId, token) => request('POST', `/api/featured-slots/${slotId}/rotate`, null, token),
};
