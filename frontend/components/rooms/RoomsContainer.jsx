/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import React from 'react';
import rooms from '../../data/rooms';
import RoomList from './RoomsList';

function RoomContainer() {
  return (
    <RoomList rooms={rooms} />
  );
}

export default RoomContainer;
