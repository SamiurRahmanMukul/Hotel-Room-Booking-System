/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { Card, Statistic } from 'antd';
import React from 'react';
import CountUp from 'react-countup';
import { useNavigate } from 'react-router-dom';

const formatter = (value) => <CountUp end={value} separator=',' />;
const gridStyle = { width: '50%', textAlign: 'center' };

function RoomCard({ loading, data }) {
  const navigate = useNavigate();

  return (
    <Card
      className='w-full cursor-pointer md:w-[49.5%]'
      onClick={() => navigate('/main/hotel-rooms')}
      title='Rooms Information:'
      loading={loading}
    >
      <Card.Grid style={gridStyle}>
        <Statistic
          className='whitespace-normal lg:whitespace-nowrap'
          title='Total Rooms'
          formatter={formatter}
          value={data?.total_rooms || 0}
        />
      </Card.Grid>

      <Card.Grid style={gridStyle}>
        <Statistic
          className='whitespace-normal lg:whitespace-nowrap'
          title='Booked Rooms'
          formatter={formatter}
          value={data?.booked_rooms || 0}
        />
      </Card.Grid>

      <Card.Grid style={gridStyle}>
        <Statistic
          className='whitespace-normal lg:whitespace-nowrap'
          title='Available Rooms'
          formatter={formatter}
          value={data?.available_rooms || 0}
        />
      </Card.Grid>

      <Card.Grid style={gridStyle}>
        <Statistic
          className='whitespace-normal lg:whitespace-nowrap'
          title='Unavailable Rooms'
          formatter={formatter}
          value={data?.unavailable_rooms || 0}
        />
      </Card.Grid>
    </Card>
  );
}

export default RoomCard;
