import { HistoryOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Popover } from 'antd';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import ApiService from '../../utils/apiService';
import { getSessionUser, removeSessionAndLogoutUser } from '../../utils/authentication';
import notificationWithIcon from '../../utils/notification';

function UserPopover() {
  const [loading, setLoading] = useState();
  const user = getSessionUser();
  const router = useRouter();

  // function to handle user logout
  const userLogout = async () => {
    setLoading(true);
    try {
      const response = await ApiService.post('/api/v1/auth/logout');
      if (response?.result_code === 0) {
        removeSessionAndLogoutUser();
        setLoading(false);
      } else {
        notificationWithIcon('error', 'ERROR', 'Sorry! Something went wrong. App server error');
        removeSessionAndLogoutUser();
        setLoading(false);
      }
    } catch (error) {
      notificationWithIcon('error', 'ERROR', error?.response?.data?.result?.error || 'Sorry! Something went wrong. App server error');
      removeSessionAndLogoutUser();
      setLoading(false);
    }
  };

  return (
    <Popover
      placement='bottomRight'
      trigger='hover'
      title={(
        <span style={{ fontSize: '18px' }}>
          {user?.fullName}
        </span>
      )}
      content={(
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
          <Button
            style={{ color: '#000', padding: '0px' }}
            onClick={() => router.push('/profile?tab=my-profile')}
            icon={<UserOutlined />}
            size='middle'
            type='link'
          >
            My Profile
          </Button>
          <Button
            style={{ color: '#000', padding: '0px' }}
            onClick={() => router.push('/profile?tab=booking-history')}
            icon={<HistoryOutlined />}
            size='middle'
            type='link'
          >
            Booking History
          </Button>
          <Button
            style={{ color: '#000', padding: '0px' }}
            icon={<LogoutOutlined />}
            onClick={userLogout}
            size='middle'
            type='link'
            loading={loading}
            disabled={loading}
          >
            Log Out
          </Button>
        </div>
      )}
    >
      <Avatar
        style={{
          position: 'absolute', right: '100px', top: '20px', cursor: 'pointer'
        }}
        src={(
          <img
            src={user?.avatar || 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg'}
            alt='avatar-img'
          />
        )}
        size='large'
      />
    </Popover>
  );
}

export default UserPopover;
