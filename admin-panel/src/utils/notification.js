/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { notification } from 'antd';

// React throws "Objects are not valid as a React child" if a non-string (e.g. a raw
// Mongoose error object) is passed as the description. Coerce defensively so a bad API
// error shape can never white-screen the app.
const toText = (msg) => {
  if (msg == null) return '';
  if (typeof msg === 'string') return msg;
  if (typeof msg === 'object') return msg.message || msg.error || 'Something went wrong';
  return String(msg);
};

const notificationWithIcon = (type, title, msg) => {
  notification[type]({
    message: title,
    description: toText(msg)
  });
};

export default notificationWithIcon;
