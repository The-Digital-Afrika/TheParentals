const trimSlash = (url) => String(url || '').replace(/\/$/, '');

const getConfiguredApiUrl = () => {
  const viteUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_API_URL : '';
  const reactUrl = typeof process !== 'undefined' ? process.env?.REACT_APP_API_URL : '';
  return trimSlash(viteUrl || reactUrl);
};

const isLocalBrowser = () => (
  typeof window !== 'undefined'
  && ['localhost', '127.0.0.1'].includes(window.location.hostname)
);

const unique = (items) => [...new Set(items.filter(item => item !== null && item !== undefined))];

const getApiBaseCandidates = () => {
  const configured = getConfiguredApiUrl();
  if (configured) return [configured];

  if (isLocalBrowser()) {
    return unique([
      'http://127.0.0.1:5000',
      'http://localhost:5000',
    ]);
  }

  return ['https://sahomeschooling-services-4.onrender.com'];
};

export const API_BASE_URL = getApiBaseCandidates()[0] || '';
export const getGoogleAuthUrl = (role = 'USER') =>
  `${API_BASE_URL}/api/auth/google?role=${encodeURIComponent(String(role).toUpperCase())}`;

export const apiRequest = async (method, endpoint, body = null, token = null) => {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  const headers = isForm ? {} : { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = isForm ? body : JSON.stringify(body);

  const candidates = getApiBaseCandidates();
  const errors = [];

  for (const baseUrl of candidates) {
    const url = `${baseUrl}${endpoint}`;

    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json().catch(() => ({})) : {};

      if (!res.ok) {
        const shouldTryNext = !data.message && !data.error && [404, 405, 500, 502, 503, 504].includes(res.status) && candidates.length > 1;
        if (shouldTryNext) {
          errors.push(`${url} returned ${res.status}`);
          continue;
        }

        const error = new Error(data.message || data.error || `Request failed (${res.status})`);
        error.status = res.status;
        error.data = data;
        error.url = url;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      errors.push(`${url}: ${error.message || 'network error'}`);
    }
  }

  const error = new Error(`Unable to reach the backend. Tried: ${errors.join(' | ')}`);
  error.status = 0;
  error.tried = errors;
  throw error;
};

export const api = {
  // Auth
  login: (data) => apiRequest('POST', '/api/auth/login', data),
  register: (data) => apiRequest('POST', '/api/auth/register', data),
  socialAuth: (data) => apiRequest('POST', '/api/auth/social', data),
  getUsers: (token) => apiRequest('GET', '/api/auth/users', null, token),

  // Providers
  getProviders: () => apiRequest('GET', '/api/providers'),
  getProviderById: (id) => apiRequest('GET', `/api/providers/${id}`),
  createProvider: (data) => apiRequest('POST', '/api/providers', data),
  updateProvider: (id, data, token) => apiRequest('PATCH', `/api/providers/${id}`, data, token),
  updateProviderStatus: (id, status, token) => apiRequest('PATCH', `/api/providers/${id}/status`, { status }, token),
  approveProvider: (id, token) => apiRequest('POST', `/api/providers/${id}/approve`, null, token),
  rejectProvider: (id, token) => apiRequest('POST', `/api/providers/${id}/reject`, null, token),

  // Stats & Reviews
  getStats: (token) => apiRequest('GET', '/api/stats', null, token),
  getReviews: (token) => apiRequest('GET', '/api/reviews', null, token),
  getFeaturedSlots: (token) => apiRequest('GET', '/api/featured-slots', null, token),
  assignFeaturedSlot: (data, token) => apiRequest('POST', '/api/featured-slots/assign', data, token),
  removeFeaturedSlot: (slotId, token) => apiRequest('POST', `/api/featured-slots/${slotId}/remove`, null, token),
  rotateFeaturedSlot: (slotId, token) => apiRequest('POST', `/api/featured-slots/${slotId}/rotate`, null, token),

  // Payments
  initializePayment: (data, token) => apiRequest('POST', '/api/payments/initialize', data, token),
  verifyPayment: (reference, token) => apiRequest('GET', `/api/payments/verify/${encodeURIComponent(reference)}`, null, token),
  getPaymentStatus: (reference, token) => apiRequest('GET', `/api/payments/${encodeURIComponent(reference)}/status`, null, token),
  setMockPaymentOutcome: (reference, status, token) => apiRequest('POST', `/api/payments/mock/${encodeURIComponent(reference)}/outcome`, { status }, token),
  cancelSubscription: (token) => apiRequest('POST', '/api/payments/cancel', null, token),
  getPaymentHistory: (token) => apiRequest('GET', '/api/payments/history', null, token),
};
