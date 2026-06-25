/* eslint-disable jsx-quotes, operator-linebreak, object-curly-newline, react/jsx-one-expression-per-line */
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import {
  Alert, Button, Card, Form, Input, Typography
} from 'antd';
import React, { useState } from 'react';
import useTimeout from '../hooks/useTimeout';
import ApiService from '../utils/apiService';
import { setSessionUserAndToken } from '../utils/authentication';

function Login() {
  window.document.title = 'Sign in';
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  const [timeout] = useTimeout(() => setErrMsg(''), 4000);
  timeout();

  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await ApiService.post('/api/v1/auth/login?loginType=admin', values);

      if (response?.result_code === 0) {
        setSessionUserAndToken(response?.result?.data, response?.access_token, response?.refresh_token);
        if (response?.result?.data?.mustChangePassword) {
          window.location.href = '/auth/change-password';
        } else {
          window.location.href = '/main/dashboard';
        }
      } else {
        setErrMsg('Could not sign in. Please try again.');
      }
    } catch (error) {
      setErrMsg(error?.response?.data?.result?.error?.message || error?.response?.data?.result?.error || 'Server error — please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3F4F4',
        padding: 24
      }}
    >
      <Card
        style={{ width: 420, border: '1px solid rgba(44,44,44,0.08)', boxShadow: 'none' }}
        bodyStyle={{ padding: 32 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Typography.Title level={3} style={{ marginBottom: 4, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Sign in
          </Typography.Title>
          <Typography.Text type='secondary'>
            Welcome back — log in to your hotel admin
          </Typography.Text>
        </div>

        {errMsg && <Alert message={errMsg} type='error' showIcon style={{ marginBottom: 16 }} />}

        <Form layout='vertical' onFinish={onFinish} requiredMark={false} size='large'>
          <Form.Item
            label='Email'
            name='email'
            rules={[{ type: 'email', required: true, message: 'Enter your email' }]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#9CA3AF' }} />}
              placeholder='you@hotel.com'
              autoComplete='email'
            />
          </Form.Item>

          <Form.Item
            label='Password'
            name='password'
            rules={[{ required: true, message: 'Enter your password' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
              placeholder='••••••••'
              autoComplete='current-password'
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              loading={loading}
              htmlType='submit'
              type='primary'
              block
              size='large'
            >
              Sign in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default React.memo(Login);
