/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import React from 'react';
import { v4 as uniqueId } from 'uuid';
import rooms from '../../data/rooms';
import Room from '../shared/Room';
import Title from './Title';

function FeaturedRooms() {
  const featuredRoom = rooms.filter((data) => data.fields.featured === true);

  return (
    <section className='featured-rooms'>
      <Title title='featured rooms' />

      <div className='featured-rooms-center'>
        {featuredRoom?.map((room) => (
          <Room key={uniqueId()} room={room.fields} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedRooms;
