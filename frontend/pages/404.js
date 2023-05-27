/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { Result } from 'antd';
import Link from 'next/link';
import React from 'react';

function ErrorPage() {
  return (
    <Result
      status='404'
      title='404 - Not Found!'
      subTitle='Sorry, the page you visited does not exist.'
      extra={(
        <Link className='btn-primary' href='/'>
          Back to home
        </Link>
      )}
    />
  );
}

export default ErrorPage;
