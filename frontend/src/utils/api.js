const BASE_URL = 'http://127.0.0.1:8000/api';

/**
 * Custom Fetch client that automatically injects JWT Token from localStorage.
 */
async function request(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config = {
    method,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  };

  if (body) {
    // If it's standard raw object, stringify
    if (typeof body === 'object' && !(body instanceof FormData)) {
      config.body = JSON.stringify(body);
    } else {
      config.body = body;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, config);

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.detail || 'An unexpected error occurred.';
    throw new Error(errorMsg);
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options = {}) => request(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options = {}) => request(endpoint, { method: 'DELETE', ...options }),
};
