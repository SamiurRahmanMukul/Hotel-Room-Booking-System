/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import React from 'react';
import { v4 as uniqueId } from 'uuid';
import Title from './Title';

const services = [
  { icon: '🍸', title: 'Cocktails', info: 'Enjoy handcrafted cocktails at our beachfront bar, made with fresh local ingredients and premium spirits.' },
  { icon: '🥾', title: 'Hiking', info: 'Explore scenic coastal trails with guided hiking tours departing daily from the resort.' },
  { icon: '🚐', title: 'Shuttle', info: 'Complimentary shuttle service to nearby attractions, shopping, and the airport.' },
  { icon: '🍺', title: 'Beer', info: 'Sample local craft beers and imported favorites at our relaxed pub-style lounge.' }
];

function Services() {
  return (
    <section className='services'>
      <Title title='services' />

      <div className='services-center'>
        {services?.map((item) => (
          <article key={uniqueId()} className='services'>
            <span>{item.icon}</span>
            <h6>{item.title}</h6>
            <p>{item.info}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default Services;
