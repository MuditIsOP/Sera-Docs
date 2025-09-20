// API utility functions
const API_BASE_URL = 'https://sera-docs.onrender.com';

export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    headers: {
      'Content-Type': 'application/json',
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
