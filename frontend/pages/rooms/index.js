/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import Link from 'next/link';
import React from 'react';
import Banner from '../../components/home/Banner';
import Hero from '../../components/home/Hero';
import MainLayout from '../../components/layout';
import RoomContainer from '../../components/rooms/RoomsContainer';
import RoomFilter from '../../components/rooms/RoomsFilter';

function Rooms() {
  return (
    <MainLayout title='Beach Resort ― Rooms'>
      <Hero hero='roomsHero'>
        <Banner title='our rooms'>
          <Link className='btn-primary' href='/'>
            return home
          </Link>
        </Banner>
      </Hero>

      <RoomFilter />
      <RoomContainer />
    </MainLayout>
  );
}

export default Rooms;
