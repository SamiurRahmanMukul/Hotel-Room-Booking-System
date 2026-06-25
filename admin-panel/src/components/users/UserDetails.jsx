/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak */
/* eslint-disable jsx-quotes, no-confusing-arrow, no-underscore-dangle */
/* eslint-disable react/no-unstable-nested-components, react/jsx-max-props-per-line */
/* eslint-disable react/jsx-curly-newline, react/jsx-first-prop-new-line */
/* eslint-disable react/jsx-closing-tag-location, object-property-newline */
/* eslint-disable react/no-array-index-key, prefer-destructuring */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
/* eslint-disable react/no-unescaped-entities, no-nested-ternary */
import { CalendarOutlined, DeleteOutlined, ExclamationCircleFilled, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Modal, Result, Skeleton, Tag, Tooltip, Typography, message } from 'antd';
import React from 'react';
import { useDispatch } from 'react-redux';
import useFetchData from '../../hooks/useFetchData';
import { reFetchData } from '../../store/slice/appSlice';
import ApiService from '../../utils/apiService';
import { getSessionUser } from '../../utils/authentication';

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

function Field({ icon, label, value }) {
  return (
    <div style={FIELD_ROW}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        {icon && <span style={{ color: '#9CA3AF', fontSize: 16, width: 18 }}>{icon}</span>}
        <div style={{ minWidth: 0 }}>
          <div style={FIELD_LABEL}>{label}</div>
          <div style={FIELD_VALUE}>{value || <span style={{ color: '#9CA3AF' }}>—</span>}</div>
        </div>
      </div>
    </div>
  );
}

function UserDetails({ id }) {
  const dispatch = useDispatch();
  const me = getSessionUser();
  const [loading, error, response] = useFetchData(`/api/v1/get-user/${id}`);
  const u = response?.data || {};
  const initial = (u.fullName || u.email || '?').trim().charAt(0).toUpperCase();
  const avatar = u.avatar && !u.avatar.endsWith('undefined') ? u.avatar : null;
  const isSelf = me?.id === u.id;

  const handleDelete = () => {
    Modal.confirm({
      title: `Delete ${u.fullName}?`,
      icon: <ExclamationCircleFilled />,
      content: 'This action cannot be undone.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await ApiService.delete(`/api/v1/delete-user/${u.id}`);
          message.success('User deleted');
          dispatch(reFetchData());
        } catch (err) {
          message.error(err?.response?.data?.result?.error || 'Could not delete');
        }
      }
    });
  };

  if (loading) return <div style={{ padding: 24 }}><Skeleton active avatar paragraph={{ rows: 6 }} /></div>;
  if (error) return <Result status='error' title='Failed to fetch' subTitle={error} />;

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, fontWeight: 600, letterSpacing: '-0.02em' }}>
            User details
          </Typography.Title>
          <Typography.Text type='secondary'>Read-only view. Editing this user is not yet wired here.</Typography.Text>
        </div>
        {!isSelf && (
          <Tooltip title='Delete user'>
            <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>Delete</Button>
          </Tooltip>
        )}
      </div>

      {/* Identity card */}
      <div style={{ ...SECTION, display: 'flex', alignItems: 'center', gap: 20 }}>
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
            fontSize: 30, fontWeight: 600, flexShrink: 0
          }}
          >
            {initial}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: '#2C2C2C' }}>
            {u.fullName || 'Unnamed'}
          </div>
          <div style={{ color: '#6B6B6B', fontSize: 14, marginTop: 2 }}>{u.email}</div>
          <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {u.role && (
              <Tag color={u.role === 'admin' ? '#853953' : '#612D53'} style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>{u.role}</Tag>
            )}
            {u.verified ? (
              <Tag color='#3F7D58' style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>verified</Tag>
            ) : (
              <Tag color='default' style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>unverified</Tag>
            )}
            {u.status === 'blocked' && (
              <Tag color='#A4243B' style={{ textTransform: 'uppercase', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>blocked</Tag>
            )}
          </div>
        </div>
      </div>

      {/* Personal */}
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

      {/* Account */}
      <div style={SECTION}>
        <Typography.Title level={5} style={{ marginTop: 0, marginBottom: 16, fontWeight: 600 }}>
          Account
        </Typography.Title>
        <div>
          <Field label='Role' value={(u.role || '').toUpperCase()} />
          <Field label='Status' value={(u.status || '').toUpperCase()} />
          <Field label='Member since' value={u.createdAt?.split('T')[0]} />
          <Field label='Last update' value={u.updatedAt?.split('T')[0]} />
        </div>
      </div>
    </div>
  );
}

export default UserDetails;
