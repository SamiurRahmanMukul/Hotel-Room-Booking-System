import { LockOutlined, UserOutlined } from '@ant-design/icons';
import {
  Alert, Button, Card, Form, Input, Typography
} from 'antd';
import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function SuperadminLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setError(null);
    setLoading(true);
    try {
      // Use raw axios for login (no token exists yet — SuperadminApi interceptor would fail)
      const { data } = await axios.post(`${API}/platform-api/login`, values);
      localStorage.setItem('superadmin_token', data.access_token);
      localStorage.setItem('superadmin_user', JSON.stringify(data.superadmin));
      navigate('/superadmin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F4', padding: 24
    }}
    >
      <Card
        style={{ width: 420, border: '1px solid rgba(44,44,44,0.08)', boxShadow: 'none' }}
        bodyStyle={{ padding: 32 }}
        title={<Typography.Title level={3} style={{ margin: 0, fontWeight: 600, letterSpacing: '-0.01em' }}>Super Admin Login</Typography.Title>}
      >
        {error && <Alert type='error' message={error} showIcon style={{ marginBottom: 16 }} />}
        <Form layout='vertical' onFinish={onFinish}>
          <Form.Item label='Email' name='email' rules={[{ required: true, type: 'email' }]}>
            <Input prefix={<UserOutlined />} placeholder='you@platform.com' />
          </Form.Item>
          <Form.Item label='Password' name='password' rules={[{ required: true }]}>
            <Input.Password prefix={<LockOutlined />} placeholder='password' />
          </Form.Item>
          <Form.Item>
            <Button type='primary' htmlType='submit' loading={loading} block>Sign in</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default SuperadminLogin;
