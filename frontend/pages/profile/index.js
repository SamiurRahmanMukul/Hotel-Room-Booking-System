/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { HistoryOutlined, UserOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import MainLayout from '../../components/layout';
import BookingHistory from '../../components/profile/BookingHistory';
import MyProfile from '../../components/profile/MyProfile';
import PrivateRoute from '../../components/routes/PrivateRoute';

function Profile() {
  const [activeTab, setActiveTab] = useState(1);
  const router = useRouter();

  useEffect(() => {
    if (router?.query?.tab === 'my-profile') {
      setActiveTab(1);
    } else if (router?.query?.tab === 'booking-history') {
      setActiveTab(2);
    } else {
      setActiveTab(1);
    }
  }, [router]);

  const handleTabClick = (key) => {
    if (key === 1) {
      router.push({ pathname: '/profile', query: { tab: 'my-profile' } });
    } else if (key === 2) {
      router.push({ pathname: '/profile', query: { tab: 'booking-history' } });
    } else {
      router.push('/profile');
    }
  };

  return (
    <PrivateRoute>
      <MainLayout title='Beach Resort ― My Profile'>
        <div className='profile-container'>
          <Tabs
            tabPosition='left'
            activeKey={activeTab}
            onTabClick={handleTabClick}
            size='large'
            type='line'
            items={[
              {
                key: 1,
                label: (
                  <span>
                    <UserOutlined />
                    {' '}
                    My Profile
                  </span>
                ),
                children: <MyProfile />
              },
              {
                key: 2,
                label: (
                  <span>
                    <HistoryOutlined />
                    {' '}
                    Booking History
                  </span>
                ),
                children: <BookingHistory />
              }
            ]}
          />
        </div>
      </MainLayout>
    </PrivateRoute>
  );
}

export default Profile;
