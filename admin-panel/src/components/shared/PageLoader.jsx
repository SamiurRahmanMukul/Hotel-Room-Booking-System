/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { Layout, Spin } from 'antd';
import React from 'react';

const { Content } = Layout;

function PageLoader() {
  return (
    <Content className='page-loader'>
      <Spin
        size='large'
        tip='Loading...'
      />
    </Content>
  );
}

export default PageLoader;
