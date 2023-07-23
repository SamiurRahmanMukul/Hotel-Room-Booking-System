/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import Link from 'next/link';
import React from 'react';

function Room({ room }) {
  return (
    <article className='room'>
      <div className='img-container'>
        <img
          src={room?.room_images[0]?.url || '/img/jpeg/room-1.jpeg'}
          alt='single room'
        />

        <div className='price-top'>
          <h6>{`$ ${room?.room_price}`}</h6>
          <p>per night</p>
        </div>

        <Link
          className='btn-primary room-link'
          href={`/rooms/${room?.room_slug}`}
        >
          Feature
        </Link>
      </div>

      <p className='room-info'>
        {room?.room_name}
      </p>
    </article>
  );
}

export default Room;
