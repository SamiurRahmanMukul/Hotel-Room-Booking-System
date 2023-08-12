/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

export const userStatusAsResponse = (status) => {
  if (status === 'register') {
    return {
      color: '#108ee9',
      level: 'REGISTER'
    };
  }
  if (status === 'login') {
    return {
      color: '#87d068',
      level: 'LOGIN'
    };
  }
  if (status === 'logout') {
    return {
      color: '#2db7f5',
      level: 'LOGOUT'
    };
  }
  if (status === 'blocked') {
    return {
      color: '#f55000',
      level: 'BLOCKED'
    };
  }
  return {
    color: 'default',
    level: 'UNKNOWN'
  };
};

export const bookingStatusAsResponse = (status) => {
  if (status === 'pending') {
    return {
      color: 'blue',
      level: 'PENDING'
    };
  }
  if (status === 'cancel') {
    return {
      color: 'volcano',
      level: 'CANCEL'
    };
  }
  if (status === 'approved') {
    return {
      color: 'lime',
      level: 'APPROVED'
    };
  }
  if (status === 'rejected') {
    return {
      color: 'red',
      level: 'REJECTED'
    };
  }
  if (status === 'in-reviews') {
    return {
      color: 'purple',
      level: 'IN REVIEWS'
    };
  }
  if (status === 'completed') {
    return {
      color: 'green',
      level: 'COMPLETED'
    };
  }
  return {
    color: 'default',
    level: 'UNKNOWN'
  };
};
