/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import axios from 'axios';
import getConfig from 'next/config';
import { getSessionToken } from './authentication';

const { publicRuntimeConfig } = getConfig();

const ApiService = axios.create({
  baseURL: publicRuntimeConfig.API_BASE_URL
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
  (error) => Promise.reject(error)
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
  (error) => Promise.reject(error)
);

export default ApiService;
