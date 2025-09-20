// API utility functions
const API_BASE_URL = 'https://sera-docs.onrender.com';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Don't set Content-Type for FormData - let browser set it with boundary
  const headers = {};
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  return fetch(url, {
    headers: {
      ...headers,
      ...options.headers,
    },
    ...options,
  });
};

export const apiEndpoints = {
  query: '/api/query',
  upload: '/api/upload',
  clear: '/api/clear',
  status: '/api/status',
};
