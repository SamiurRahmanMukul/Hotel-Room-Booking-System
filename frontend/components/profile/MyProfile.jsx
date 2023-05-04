import { EditOutlined } from '@ant-design/icons';
import {
  Button, Descriptions, Image, Result, Skeleton, Tag, Tooltip, Upload
} from 'antd';
import ImgCrop from 'antd-img-crop';
import getConfig from 'next/config';
import React, { useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { getSessionToken, setSessionUserKeyAgainstValue } from '../../utils/authentication';
import notificationWithIcon from '../../utils/notification';
import { userStatusAsResponse } from '../../utils/responseAsStatus';
import ProfileEditModal from './ProfileEditModal';

const { publicRuntimeConfig } = getConfig();

function MyProfile() {
  const token = getSessionToken();
  const [editProfileModal, setEditProfileModal] = useState(false);

  // fetch user profile API data
  const [loading, error, response] = useFetchData('/api/v1/get-user');

  // handle to change user avatar upload
  const props = {
    accept: 'image/*',
    name: 'avatar',
    action: `${publicRuntimeConfig.API_BASE_URL}/api/v1/avatar-update`,
    method: 'put',
    headers: { authorization: `Bearer ${token}` },
    onChange(info) {
      if (info.file.status === 'done') {
        // Handle response from API
        if (info?.file?.response?.result_code === 0) {
          notificationWithIcon('success', 'SUCCESS', info?.file?.response?.result?.message || 'Your avatar change successful');
          // update local storage session user data
          setSessionUserKeyAgainstValue('avatar', info?.file?.response?.result?.data?.avatar);
          window.location.reload();
        } else {
          notificationWithIcon('error', 'ERROR', 'Sorry! Something went wrong. App server error');
        }
      } else {
        notificationWithIcon('error', 'ERROR', info?.file?.response?.result?.error || 'Sorry! Something went wrong. App server error');
      }
    }
  };

  return (
    <>
      <Skeleton loading={loading} paragraph={{ rows: 10 }} active avatar>
        {error ? (
          <Result
            title='Failed to fetch'
            subTitle={error}
            status='error'
          />
        ) : (
          <Descriptions
            title='Profile Information'
            bordered
            extra={(
              <Button
                style={{ marginTop: '10px', marginRight: '20px' }}
                onClick={() => setEditProfileModal(true)}
                shape='default'
                type='primary'
                size='large'
              >
                Edit Profile
              </Button>
            )}
          >
            <Descriptions.Item label='Avatar' span={3}>
              {response?.data?.avatar ? (
                <Image
                  style={{ width: '100px', height: '100px' }}
                  src={response?.data?.avatar}
                  crossOrigin='anonymous'
                  alt='user-image'
                />
              ) : 'N/A'}

              {/* user avatar change */}
              <div style={{ position: 'absolute', marginTop: '-7rem', marginLeft: '5.5rem' }}>
                <ImgCrop showGrid rotationSlider>
                  <Upload {...props}>
                    <Tooltip title='Click to change Avatar'>
                      <Button
                        icon={<EditOutlined />}
                        type='default'
                        shape='circle'
                      />
                    </Tooltip>
                  </Upload>
                </ImgCrop>
              </div>
            </Descriptions.Item>

            <Descriptions.Item label='Full Name'>
              {response?.data?.fullName}
            </Descriptions.Item>
            <Descriptions.Item label='User Name' span={2}>
              {response?.data?.userName}
            </Descriptions.Item>
            <Descriptions.Item label='Email'>
              {response?.data?.email}
            </Descriptions.Item>
            <Descriptions.Item label='Phone' span={2}>
              {response?.data?.phone}
            </Descriptions.Item>

            <Descriptions.Item label='Role'>
              <Tag
                style={{ width: '60px', textAlign: 'center', textTransform: 'capitalize' }}
                color={response?.data?.role === 'admin' ? 'magenta' : 'purple'}
              >
                {response?.data?.role}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Status' span={2}>
              <Tag
                style={{ width: '70px', textAlign: 'center', textTransform: 'capitalize' }}
                color={userStatusAsResponse(response?.data?.status).color}
              >
                {userStatusAsResponse(response?.data?.status).level}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Verified'>
              <Tag
                style={{ width: '50px', textAlign: 'center', textTransform: 'capitalize' }}
                color={response?.data?.verified ? 'success' : 'error'}
              >
                {response?.data?.verified ? 'Yes' : 'No'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label='Date Of Birth' span={2}>
              {response?.data?.dob?.split('T')[0] || 'N/A'}
            </Descriptions.Item>

            <Descriptions.Item label='User Last Update Date'>
              {response?.data?.updatedAt?.split('T')[0]}
            </Descriptions.Item>
            <Descriptions.Item label='User Registration Date' span={2}>
              {response?.data?.createdAt?.split('T')[0]}
            </Descriptions.Item>

            <Descriptions.Item label='Address' span={3}>
              {response?.data?.address}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Skeleton>

      {/* profile edit modal component */}
      {editProfileModal && (
        <ProfileEditModal
          editProfileModal={editProfileModal}
          setEditProfileModal={setEditProfileModal}
        />
      )}
    </>
  );
}

export default React.memo(MyProfile);
