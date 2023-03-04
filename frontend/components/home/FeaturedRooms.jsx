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
