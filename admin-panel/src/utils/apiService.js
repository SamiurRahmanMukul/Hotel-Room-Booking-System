/**
 * Axios client with rolling refresh-token logic.
 *
 *  • Access token expires every 15 min (per backend env)
 *  • Refresh token expires every 30 days
 *  • On 401, try the refresh-token endpoint once. If it returns a new pair,
 *    retry the original request transparently. If refresh itself fails,
 *    sign the user out.
 *  • Concurrent 401s are coalesced into a single refresh promise so we
 *    don't fire the refresh endpoint N times.
 */

import axios from 'axios';
import {
  getRefreshToken, getSessionToken, removeSessionAndLogoutUser, setSessionAccessAndRefreshToken
} from './authentication';

const ApiService = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL
});

let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshPromise = axios
    .get(`${process.env.REACT_APP_API_BASE_URL}/api/v1/auth/refresh-token`, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    })
    .then((res) => {
      const { accessToken, refreshToken: newRefresh } = res.data?.result?.data || {};
      if (!accessToken) throw new Error('refresh returned no accessToken');
      setSessionAccessAndRefreshToken(accessToken, newRefresh || refreshToken);
      return accessToken;
    })
    .catch((err) => {
      removeSessionAndLogoutUser();
      throw err;
    })
    .finally(() => { refreshPromise = null; });

  return refreshPromise;
}

ApiService.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    if (!config?.noAuth) {
      const token = getSessionToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

ApiService.interceptors.response.use(
  (response) => response?.data || {},
  async (error) => {
    const originalRequest = error.config || {};
    const status = error?.response?.status;
    const code = error?.response?.data?.result_code;

    // refresh once on 401 / TOKEN INVALID, then retry the original request
    // eslint-disable-next-line no-underscore-dangle
    if ((status === 401 || code === 11) && !originalRequest._retry && !originalRequest.url?.includes('/auth/refresh-token')) {
      // eslint-disable-next-line no-underscore-dangle
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
        if (!newToken) {
          removeSessionAndLogoutUser();
          return Promise.reject(error);
        }
        originalRequest.headers = {
          ...(originalRequest.headers || {}),
          Authorization: `Bearer ${newToken}`
        };
        return ApiService(originalRequest);
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default ApiService;
