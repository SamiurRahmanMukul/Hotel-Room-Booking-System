/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak, jsx-quotes, no-confusing-arrow, react/no-unstable-nested-components, react/jsx-max-props-per-line, react/jsx-curly-newline, react/jsx-first-prop-new-line, react/jsx-closing-tag-location, object-property-newline */
import { CalendarOutlined, EditOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Result, Skeleton, Tag, Tooltip, Typography, Upload } from 'antd';
import ImgCrop from 'antd-img-crop';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetchData from '../../hooks/useFetchData';
import { getSessionToken, setSessionUserKeyAgainstValue } from '../../utils/authentication';
import notificationWithIcon from '../../utils/notification';
import ProfileEditModal from '../shared/ProfileEditModal';

const SECTION = {
  background: '#fff',
  border: '1px solid rgba(44,44,44,0.08)',
  borderRadius: 12,
  padding: 24,
  marginTop: 16
};
const FIELD_LABEL = { color: '#6B6B6B', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 };
const FIELD_VALUE = { color: '#2C2C2C', fontSize: 15 };
const FIELD_ROW = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid rgba(44,44,44,0.06)' };

function Field({ icon, label, value, action }) {
  return (
    <div style={FIELD_ROW}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        {icon && <span style={{ color: '#9CA3AF', fontSize: 16, width: 18 }}>{icon}</span>}
        <div style={{ minWidth: 0 }}>
          <div style={FIELD_LABEL}>{label}</div>
          <div style={FIELD_VALUE}>{value || <span style={{ color: '#9CA3AF' }}>—</span>}</div>
        </div>
      </div>
      {action}
    </div>
  );
}

function MyProfile() {
  const token = getSessionToken();
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [loading, error, response] = useFetchData('/api/v1/get-user');
  const u = response?.data || {};
  const initial = (u.fullName || u.email || '?').trim().charAt(0).toUpperCase();
  const avatar = u.avatar && !u.avatar.endsWith('undefined') ? u.avatar : null;

  const uploadProps = {
    accept: 'image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif',
    name: 'avatar',
    action: `${process.env.REACT_APP_API_BASE_URL}/api/v1/avatar-update`,
    method: 'put',
    headers: { authorization: `Bearer ${token}` },
    showUploadList: false,
    onChange(info) {
      if (info.file.status === 'done') {
        if (info?.file?.response?.result_code === 0) {
          notificationWithIcon('success', 'Avatar updated', '');
          setSessionUserKeyAgainstValue('avatar', info?.file?.response?.result?.data?.avatar);
          window.location.reload();
        } else {
          notificationWithIcon('error', 'Upload failed', info?.file?.response?.result?.error || 'Server error');
        }
      }
    }
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton active avatar paragraph={{ rows: 6 }} /></div>;
  if (error) return <Result status='error' title='Failed to fetch' subTitle={error} />;

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, fontWeight: 600, letterSpacing: '-0.02em' }}>
        My Profile
      </Typography.Title>
      <Typography.Text type='secondary'>Your personal info — visible only to you and platform admins.</Typography.Text>

      {/* Identity card */}
      <div style={{ ...SECTION, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative' }}>
          {avatar ? (
            <img
              src={avatar} alt={u.fullName} crossOrigin='anonymous'
              style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: '#853953', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 30, fontWeight: 600
            }}
            >
              {initial}
            </div>
          )}
          <ImgCrop grid rotate>
            <Upload {...uploadProps}>
              <Tooltip title='Change avatar'>
                <Button
                  size='small' shape='circle' icon={<EditOutlined />}
                  style={{
                    position: 'absolute', bottom: -4, right: -4,
                    background: '#fff', border: '1px solid rgba(44,44,44,0.12)'
                  }}
                />
              </Tooltip>
            </Upload>
          </ImgCrop>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: '#2C2C2C' }}>
            {u.fullName || 'Unnamed'}
          </div>
          <div style={{ color: '#6B6B6B', fontSize: 14, marginTop: 2 }}>{u.email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            {u.role && <Tag color={u.role === 'admin' ? '#853953' : '#612D53'} style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>{u.role}</Tag>}
            {u.verified && <Tag color='#3F7D58' style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>verified</Tag>}
          </div>
        </div>
        <Button onClick={() => setEditProfileModal(true)} icon={<EditOutlined />}>
          Edit profile
        </Button>
      </div>

      {/* Personal details */}
      <div style={SECTION}>
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>
          Personal information
        </Typography.Title>
        <div>
          <Field icon={<UserOutlined />} label='Username' value={u.userName} />
          <Field icon={<MailOutlined />} label='Email' value={u.email} />
          <Field icon={<PhoneOutlined />} label='Phone' value={u.phone} />
          <Field icon={<CalendarOutlined />} label='Date of birth' value={u.dob?.split('T')[0]} />
          <Field icon={<UserOutlined />} label='Address' value={u.address} />
        </div>
      </div>

      {/* Account meta */}
      <div style={SECTION}>
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>
          Account
        </Typography.Title>
        <div>
          <Field
            label='Password'
            value='••••••••'
            action={<Link to='/auth/change-password'><Button size='small'>Change</Button></Link>}
          />
          <Field label='Role' value={(u.role || '').toUpperCase()} />
          <Field label='Status' value={(u.status || '').toUpperCase()} />
          <Field label='Member since' value={u.createdAt?.split('T')[0]} />
          <Field label='Last update' value={u.updatedAt?.split('T')[0]} />
        </div>
      </div>

      {editProfileModal && (
        <ProfileEditModal
          editProfileModal={editProfileModal}
          setEditProfileModal={setEditProfileModal}
        />
      )}
    </div>
  );
}

export default React.memo(MyProfile);
