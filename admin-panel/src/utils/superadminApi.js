/**
 * Shared axios client for super-admin API calls.
 *
 * Reads superadmin_token from localStorage and attaches it as Bearer token.
 * On 401, clears the token and redirects to /superadmin/login.
 */

import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const SuperadminApi = axios.create({ baseURL: API });

SuperadminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('superadmin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

SuperadminApi.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('superadmin_token');
      localStorage.removeItem('superadmin_user');
      window.location.href = '/superadmin/login';
    }
    return Promise.reject(error);
  }
);

export default SuperadminApi;
