/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const APP_USER_STORAGE = 'BRF-USER-STORAGE';
const APP_ACCESS_TOKEN = 'BRF-ACCESS-TOKEN';
const APP_REFRESH_TOKEN = 'BRF-REFRESH-TOKEN';

/**
 * function to get session user details
 * @returns if session user return user object otherwise return null
 */
export const getSessionUser = () => {
  const userStr = localStorage.getItem(APP_USER_STORAGE);

  if (userStr) {
    return JSON.parse(userStr);
  }
  return null;
};

/**
 * function to get session user access-token
 * @returns if session user return access-token otherwise return null
 */
export const getSessionToken = () => {
  const tokenStr = localStorage.getItem(APP_ACCESS_TOKEN);

  if (tokenStr) {
    return tokenStr;
  }
  return null;
};

/**
 * function to get session user refresh-token
 * @returns if session user return refresh-token otherwise return null
 */
export const getRefreshToken = () => {
  const tokenStr = localStorage.getItem(APP_REFRESH_TOKEN);

  if (tokenStr) {
    return tokenStr;
  }
  return null;
};

/**
 * function to set session user and JWT access-token & refresh-token
 * @param {*} user user object
 * @param {*} accessToken user JWT access-token
 * @param {*} refreshToken user JWT refresh-token
 */
export const setSessionUserAndToken = (user, accessToken, refreshToken) => {
  localStorage.setItem(APP_USER_STORAGE, JSON.stringify(user));
  localStorage.setItem(APP_ACCESS_TOKEN, accessToken);
  localStorage.setItem(APP_REFRESH_TOKEN, refreshToken);
};

/**
 * function to set session JWT access-token & refresh-token
 * @param {*} accessToken user JWT access-token
 * @param {*} refreshToken user JWT refresh-token
 */
export const setSessionAccessAndRefreshToken = (accessToken, refreshToken) => {
  localStorage.setItem(APP_ACCESS_TOKEN, accessToken);
  localStorage.setItem(APP_REFRESH_TOKEN, refreshToken);
};

/**
 * function to set session user
 * @param {*} user user object
 */
export const setSessionUser = (user) => {
  localStorage.setItem(APP_USER_STORAGE, JSON.stringify(user));
};

/**
 * function to set session user object key against value
 * @param {*} key session user object key
 * @param {*} value session user object key's value
 */
export const setSessionUserKeyAgainstValue = (key, value) => {
  const userStr = localStorage.getItem(APP_USER_STORAGE);
  let userStrObj = JSON.parse(userStr);

  userStrObj = {
    ...userStrObj, [key]: value
  };

  localStorage.setItem(APP_USER_STORAGE, JSON.stringify(userStrObj));
};

/**
 * function to removed in session and logout user
 */
export const removeSessionAndLogoutUser = () => {
  localStorage.removeItem(APP_USER_STORAGE);
  localStorage.removeItem(APP_ACCESS_TOKEN);
  localStorage.removeItem(APP_REFRESH_TOKEN);
  window.location.href = '/auth/login';
};
