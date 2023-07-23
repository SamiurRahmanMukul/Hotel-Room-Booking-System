/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { Empty, Result, Skeleton } from 'antd';
import axios from 'axios';
import getConfig from 'next/config';
import Link from 'next/link';
import React from 'react';
import Banner from '../components/home/Banner';
import FeaturedRooms from '../components/home/FeaturedRooms';
import Hero from '../components/home/Hero';
import Services from '../components/home/Services';
import MainLayout from '../components/layout';

const { publicRuntimeConfig } = getConfig();

function Home(props) {
  return (
    <MainLayout title='Beach Resort ― Home'>
      <Hero>
        <Banner
          title='luxurious rooms'
          subtitle='deluxe rooms starting at $299'
        >
          <Link href='/rooms' className='btn-primary'>
            our rooms
          </Link>
        </Banner>
      </Hero>
      <Services />

      {/* featured rooms */}
      <Skeleton loading={!props?.featuredRooms && !props?.error} paragraph={{ rows: 5 }} active>
        {props?.featuredRooms?.data?.rows?.length === 0 ? (
          <Empty
            className='mt-10'
            description={(<span>Sorry! Any data was not found.</span>)}
          />
        ) : props?.error ? (
          <Result
            title='Failed to fetch'
            subTitle={props?.error}
            status='error'
          />
        ) : (
          <FeaturedRooms
            featuredRoom={props?.featuredRooms?.data?.rows}
          />
        )}
      </Skeleton>
    </MainLayout>
  );
}

export async function getServerSideProps() {
  try {
    // Fetch data from the server-side API
    const response = await axios.get(`${publicRuntimeConfig.API_BASE_URL}/api/v1/featured-rooms-list`);
    const featuredRooms = response?.data?.result;

    return {
      props: {
        featuredRooms,
        error: null
      }
    };
  } catch (err) {
    return {
      props: {
        featuredRooms: null,
        error: err?.data
      }
    };
  }
}

export default Home;
