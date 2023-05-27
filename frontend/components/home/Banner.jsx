/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import React from 'react';

function Banner({ children, title, subtitle }) {
  return (
    <div className='banner'>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      {children}
    </div>
  );
}

export default Banner;
