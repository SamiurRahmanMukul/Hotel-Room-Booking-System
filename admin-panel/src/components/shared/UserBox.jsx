/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../assets/images/avatar.png';
import { getSessionUser } from '../../utils/authentication';

function UserBox() {
  const user = getSessionUser();
  const navigate = useNavigate();

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className='logo-box'
      onClick={() => navigate('/main/profile')}
    >
      <img
        className='w-[50px] h-auto rounded-full'
        src={user?.avatar || Avatar}
        crossOrigin='anonymous'
        alt='avatar-img'
      />
      <h2 className='user-name'>
        {user?.fullName}
      </h2>
    </div>
  );
}

export default UserBox;
