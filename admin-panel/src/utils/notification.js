/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { notification } from 'antd';

const notificationWithIcon = (type, title, msg) => {
  notification[type]({
    message: title,
    description: msg
  });
};

export default notificationWithIcon;
