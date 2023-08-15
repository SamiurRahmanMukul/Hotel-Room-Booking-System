/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import React, { useEffect, useState } from 'react';
import Title from '../home/Title';

export default function RoomFilter({ ourRooms, setOurFilteredRooms }) {
  const [allowBreakfast, setAllowBreakfast] = useState(false);
  const [allowPets, setAllowPets] = useState(false);

  // function to handle `room_type` filed filtering
  const roomTypeFiltering = (value) => {
    if (value === 'all') {
      setOurFilteredRooms(ourRooms);
    } else {
      const filteredRooms = ourRooms.filter((room) => room.room_type === value);
      setOurFilteredRooms(filteredRooms);
    }
  };

  // function to handle `room_price` filed filtering
  const roomPriceFiltering = (value) => {
    const filteredRooms = ourRooms.filter((room) => room.room_price <= parseInt(value, 10));
    setOurFilteredRooms(filteredRooms);
  };

  // function to handle `provide_breakfast` filed filtering
  useEffect(() => {
    if (allowBreakfast) {
      const filteredRooms = ourRooms.filter((room) => room.provide_breakfast === allowBreakfast);
      setOurFilteredRooms(filteredRooms);
    } else {
      setOurFilteredRooms(ourRooms);
    }
  }, [allowBreakfast]);

  // function to handle `allow_pets` filed filtering
  useEffect(() => {
    if (allowPets) {
      const filteredRooms = ourRooms.filter((room) => room.allow_pets === allowPets);
      setOurFilteredRooms(filteredRooms);
    } else {
      setOurFilteredRooms(ourRooms);
    }
  }, [allowPets]);

  return (
    <section className='filter-container'>
      <Title title='search rooms' />

      <form className='filter-form'>
        {/* select type start */}
        <div className='form-group'>
          <label htmlFor='type'>rooms type</label>
          <select
            className='form-control'
            onChange={(e) => roomTypeFiltering(e.target.value)}
            defaultValue='all'
            name='type'
            id='type'
          >
            <option value='all'>All</option>
            <option value='single'>Single</option>
            <option value='couple'>Couple</option>
            <option value='family'>Family</option>
            <option value='presidential'>Presidential</option>
          </select>
        </div>
        {/* select type end */}

        {/* room price start */}
        <div className='form-group'>
          <label htmlFor='price'>started price $ 100</label>
          <input
            className='form-control'
            type='range'
            name='price'
            id='price'
            min={100}
            max={1000}
            defaultValue={1000}
            onChange={(e) => roomPriceFiltering(e.target.value)}
          />
        </div>
        {/* room price end */}

        {/* extras start */}
        <div className='form-group'>
          {/* breakfast checked */}
          <div className='single-extra'>
            <input
              name='breakfast'
              type='checkbox'
              id='breakfast'
              checked={allowBreakfast}
              onChange={() => setAllowBreakfast(!allowBreakfast)}
            />
            <label htmlFor='breakfast'>breakfast</label>
          </div>

          {/* pets checked */}
          <div className='single-extra'>
            <input
              type='checkbox'
              name='pets'
              id='pets'
              checked={allowPets}
              onChange={() => setAllowPets(!allowPets)}
            />
            <label htmlFor='pets'>pets</label>
          </div>
        </div>
        {/* extras end */}
      </form>
    </section>
  );
}
