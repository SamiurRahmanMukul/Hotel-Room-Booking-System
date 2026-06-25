import React from 'react';
import RoomsList from '../rooms/RoomsList';

// Rooms are generated from Room Types → Add units. This tab lists them, with per-room
// settings (number / floor / condition) and bulk delete.
function Rooms() {
  return <RoomsList />;
}

export default React.memo(Rooms);
