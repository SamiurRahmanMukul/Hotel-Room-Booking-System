/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak, jsx-quotes */
import { LockOutlined } from '@ant-design/icons';
import {
  Alert, Button, Card, Form, Input, Result, Typography
} from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../utils/apiService';
import { getSessionUser, removeSessionAndLogoutUser } from '../utils/authentication';

function ChangePassword() {
  const navigate = useNavigate();
  const user = getSessionUser() || {};
  const forced = !!user.mustChangePassword;
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const onFinish = async (values) => {
    if (values.newPassword !== values.confirmPassword) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = forced
        ? { newPassword: values.newPassword }
        : { oldPassword: values.oldPassword, newPassword: values.newPassword };
      const res = await ApiService.post('/api/v1/auth/change-password', payload);
      if (res?.result_code === 0) {
        // refresh local user (clears mustChangePassword)
        const updated = { ...user, mustChangePassword: false };
        localStorage.setItem('user', JSON.stringify(updated));
        setDone(true);
        setTimeout(() => { window.location.href = '/main/dashboard'; }, 1200);
      } else {
        setError(res?.result?.error || 'Could not update password');
      }
    } catch (err) {
      setError(err?.response?.data?.result?.error || err?.message || 'Server error');
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = () => {
    if (forced) {
      removeSessionAndLogoutUser();
    } else {
      navigate('/main/dashboard');
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F4', padding: 24 }}>
        <Card style={{ width: 460, border: '1px solid rgba(44,44,44,0.08)', boxShadow: 'none' }} bodyStyle={{ padding: 32 }}>
          <Result status='success' title='Password updated' subTitle="Redirecting to your dashboard…" />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F4', padding: 24 }}>
      <Card
        style={{ width: 460, border: '1px solid rgba(44,44,44,0.08)', boxShadow: 'none' }}
        bodyStyle={{ padding: 32 }}
      >
        <Typography.Title level={4} style={{ marginTop: 0 }}>
          {forced ? 'Set a new password' : 'Change password'}
        </Typography.Title>
        {forced ? (
          <Alert
            type='warning'
            showIcon
            style={{ marginBottom: 16 }}
            message='You must change your password before continuing'
          />
        ) : (
          <Typography.Text type='secondary'>
            Update the password for {user.email}
          </Typography.Text>
        )}

        {error && <Alert type='error' message={error} showIcon style={{ margin: '12px 0' }} />}

        <Form layout='vertical' onFinish={onFinish} requiredMark={false}>
          {!forced && (
            <Form.Item label='Current password' name='oldPassword' rules={[{ required: true }]}>
              <Input.Password prefix={<LockOutlined />} />
            </Form.Item>
          )}
          <Form.Item
            label='New password'
            name='newPassword'
            rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder='At least 8 characters' />
          </Form.Item>
          <Form.Item
            label='Confirm new password'
            name='confirmPassword'
            dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match'));
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={submitting} block>
              {forced ? 'Set password and continue' : 'Update password'}
            </Button>
          </Form.Item>
          <Button type='link' block onClick={cancel}>
            {forced ? 'Sign out instead' : 'Cancel'}
          </Button>
        </Form>
      </Card>
    </div>
  );
}

export default ChangePassword;
