import React from 'react';
import rooms from '../../data/rooms';
import RoomList from './RoomsList';

function RoomContainer() {
  return (
    <RoomList rooms={rooms} />
  );
}

export default RoomContainer;
