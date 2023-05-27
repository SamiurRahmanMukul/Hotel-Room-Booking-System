/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { v4 as uniqueId } from 'uuid';
import Banner from '../../components/home/Banner';
import MainLayout from '../../components/layout';
import StyledHero from '../../components/rooms/StyledHero';
import rooms from '../../data/rooms';

function RoomPreview() {
  const router = useRouter();
  const [fields] = rooms.filter((data) => data.fields.slug === router.query.slug);

  return (
    <MainLayout title='Beach Resort ― Rooms Preview'>
      {!fields ? (
        <div className='error'>
          <h3>No such room could be found!</h3>
          <Link className='btn-primary' href='/rooms'>
            Back to rooms
          </Link>
        </div>
      ) : (
        <>
          <StyledHero>
            <Banner title={`${fields?.fields?.name} room`}>
              <Link className='btn-primary' href='/rooms'>
                Back to rooms
              </Link>
            </Banner>
          </StyledHero>

          <section className='single-room'>
            <div className='single-room-images'>
              {fields.fields.images.map((item) => (
                <img
                  key={uniqueId()}
                  src={item?.fields?.file?.url}
                  alt={item?.fields?.file?.url}
                />
              ))}
            </div>

            <div className='single-room-info'>
              <article className='desc'>
                <h3>Details:</h3>
                <p>{fields?.fields?.description}</p>
              </article>

              <article className='info'>
                <h3>Information:</h3>
                <h6>
                  Price : $
                  {fields?.fields?.price}
                </h6>
                <h6>
                  Size :
                  {' '}
                  {fields?.fields?.size}
                  {' '}
                  SQFT
                </h6>
                <h6>
                  Max capacity :
                  {' '}
                  {fields?.fields?.capacity > 1
                    ? `${fields?.fields?.capacity} people`
                    : `${fields?.fields?.capacity} person`}
                </h6>
                <h6>{fields?.fields?.pets ? 'pets allowed' : 'no pets allowed'}</h6>
                <h6>{fields?.fields?.breakfast && 'free breakfast included'}</h6>
              </article>
            </div>
          </section>
        </>
      )}
    </MainLayout>
  );
}

export default RoomPreview;
