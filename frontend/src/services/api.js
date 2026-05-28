const BASE_URL = 'https://sahomeschooling-services-4.onrender.com';

const request = async (method, endpoint, body = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  return res.json();
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
  updateProvider: (id, data, token) => request('PUT', `/api/providers/${id}`, data, token),
  approveProvider: (id, token) => request('POST', `/api/providers/${id}/approve`, null, token),
  rejectProvider: (id, token) => request('POST', `/api/providers/${id}/reject`, null, token),

  // Stats & Reviews
  getStats: (token) => request('GET', '/api/stats', null, token),
  getReviews: (token) => request('GET', '/api/reviews', null, token),
};