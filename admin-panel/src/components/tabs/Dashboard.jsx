/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { Result } from 'antd';
import React from 'react';
import useFetchData from '../../hooks/useFetchData';
import BookingCard from '../dashboard/BookingCard';
import RoomCard from '../dashboard/RoomCard';
import UsersCard from '../dashboard/UsersCard';

function Dashboard() {
  // fetch dashboard API data
  const [loading, error, response] = useFetchData('/api/v1/dashboard');

  return (
    <div>
      <h2 className='text-[20px] text-center font-text-font font-medium py-4'>
        Welcome to Beach Resort — Dashboard
      </h2>

      {error ? (
        <Result
          title='Failed to fetch'
          subTitle={error}
          status='error'
        />
      ) : (
        <div className='flex flex-row flex-wrap items-center justify-between gap-2'>
          <UsersCard
            loading={loading}
            data={response?.data?.users_info}
          />

          <RoomCard
            loading={loading}
            data={response?.data?.rooms_info}
          />

          <BookingCard
            loading={loading}
            data={response?.data?.booking_info}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(Dashboard);
