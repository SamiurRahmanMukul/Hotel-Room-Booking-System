import React from 'react';

function Loading() {
  return (
    <div className='loading'>
      <h4>Data loading...</h4>
      <img
        src='/img/gif/loading-arrow.gif'
        alt='loading gif'
      />
    </div>
  );
}

export default Loading;
