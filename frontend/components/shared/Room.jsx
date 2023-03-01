import Link from 'next/link';
import PropTypes from 'prop-types';
import React from 'react';

function Room({
  name, slug, images, price
}) {
  return (
    <article className='room'>
      <div className='img-container'>
        <img
          src={images[0] || '/img/jpeg/room-1.jpeg'}
          alt='single room'
        />

        <div className='price-top'>
          <h6>
            $
            {' '}
            {price}
          </h6>
          <p>per night</p>
        </div>

        <Link
          className='btn-primary room-link'
          to={`/rooms/${slug}`}
        >
          Feature
        </Link>
      </div>

      <p className='room-info'>
        {name}
      </p>
    </article>
  );
}

Room.prototype = {
  room: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    images: PropTypes.arrayOf(PropTypes.string).isRequired,
    price: PropTypes.number.isRequired
  })
};

export default Room;
