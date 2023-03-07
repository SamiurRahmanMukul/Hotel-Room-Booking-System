import React from 'react';
import Title from '../home/Title';

export default function RoomFilter() {
  return (
    <section className='filter-container'>
      <Title title='search rooms' />

      <form className='filter-form'>
        {/* select type start */}
        <div className='form-group'>
          <label htmlFor='type'>rooms type</label>
          <select
            className='form-control'
            name='type'
            id='type'
          >
            <option value='single'>Single</option>
            <option value='double'>Double</option>
          </select>
        </div>
        {/* select type end */}

        {/* guests type start */}
        <div className='form-group'>
          <label htmlFor='capacity'>guests</label>
          <select
            className='form-control'
            name='capacity'
            id='capacity'
          >
            <option value='single'>Single</option>
            <option value='double'>Double</option>
          </select>
        </div>
        {/* guests type end */}

        {/* room price start */}
        <div className='form-group'>
          <label htmlFor='price'>room price $ 10</label>
          <input
            className='form-control'
            type='range'
            name='price'
            id='price'
            min={0}
            max={100}
          />
        </div>
        {/* room price end */}

        {/* size start */}
        <div className='form-group'>
          <label htmlFor='size'>room size</label>
          <div className='size-inputs'>
            <input
              className='size-input'
              name='minSize'
              type='number'
              id='size'
            />
            <input
              className='size-input'
              name='maxSize'
              type='number'
              id='size'
            />
          </div>
        </div>
        {/* size end */}

        {/* extras start */}
        <div className='form-group'>
          {/* breakfast checked */}
          <div className='single-extra'>
            <input
              name='breakfast'
              type='checkbox'
              id='breakfast'
            />
            <label htmlFor='breakfast'>breakfast</label>
          </div>

          {/* pets checked */}
          <div className='single-extra'>
            <input
              type='checkbox'
              name='pets'
              id='pets'
            />
            <label htmlFor='pets'>pets</label>
          </div>
        </div>
        {/* extras end */}
      </form>
    </section>
  );
}
