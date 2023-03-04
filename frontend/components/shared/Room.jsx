import Link from 'next/link';
import React from 'react';

function Room({ room }) {
  return (
    <article className='room'>
      <div className='img-container'>
        <img
          src={room?.images[0].fields.file.url || '/img/jpeg/room-1.jpeg'}
          alt='single room'
        />

        <div className='price-top'>
          <h6>
            $
            {' '}
            {room.price}
          </h6>
          <p>per night</p>
        </div>

        <Link
          className='btn-primary room-link'
          href={`/rooms/${room.slug}`}
        >
          Feature
        </Link>
      </div>

      <p className='room-info'>
        {room.name}
      </p>
    </article>
  );
}

export default Room;
