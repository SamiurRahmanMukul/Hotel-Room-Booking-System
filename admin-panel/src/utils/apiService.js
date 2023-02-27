import axios from 'axios';
import { getSessionToken, removeSessionAndLogoutUser } from './authentication';

const ApiService = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL
});

/**
 * Interceptor for all requests
 */
ApiService.interceptors.request.use(
  (config) => {
    /**
     * Add your request interceptor logic here: setting headers, authorization etc.
     */
    config.headers['Content-Type'] = 'application/json';

    if (!config?.noAuth) {
      const token = getSessionToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    if (error?.response?.data?.result_code === 11) {
      removeSessionAndLogoutUser();
    } else {
      Promise.reject(error);
    }
  }
);

/**
 * Interceptor for all responses
 */
ApiService.interceptors.response.use(
  /**
  * Add logic for successful response
  */
  (response) => response?.data || {},

  /**
  * Add logic for any error from backend
  */
  (error) => {
    if (error?.response?.data?.result_code === 11) {
      removeSessionAndLogoutUser();
    } else {
      Promise.reject(error);
    }
  }
);

export default ApiService;
