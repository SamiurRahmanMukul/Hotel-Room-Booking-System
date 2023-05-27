/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { LockOutlined, MailOutlined } from '@ant-design/icons';
import {
  Button, Checkbox, Form, Input
} from 'antd';
import Link from 'next/link';
import React, { useState } from 'react';
import MainLayout from '../../components/layout';
import PublicRoute from '../../components/routes/PublicRoute';
import ApiService from '../../utils/apiService';
import { setSessionUserAndToken } from '../../utils/authentication';
import notificationWithIcon from '../../utils/notification';

function Login() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = (values) => {
    ApiService.post('/api/v1/auth/login', values)
      .then((response) => {
        setLoading(false);
        if (response?.result_code === 0) {
          setSessionUserAndToken(response?.result?.data, response?.access_token, response?.refresh_token);
          form.resetFields();
          window.location.href = '/profile?tab=my-profile';
        } else {
          notificationWithIcon('error', 'ERROR', 'Sorry! Something went wrong. App server error');
        }
      })
      .catch((err) => {
        setLoading(false);
        notificationWithIcon('error', 'ERROR', err?.response?.data?.result?.error?.message || err?.response?.data?.result?.error || 'Sorry! Something went wrong. App server error');
      });
  };

  return (
    <PublicRoute>
      <MainLayout title='Beach Resort ― Login'>
        <div style={{ width: '400px', height: 'calc(100vh - 205px)', margin: '0 auto' }}>
          <Form
            form={form}
            className='login-form'
            style={{ paddingTop: '160px' }}
            initialValues={{ remember: true }}
            name='beach-resort-login-form'
            onFinish={onFinish}
          >
            <Form.Item
              name='email'
              rules={[{
                required: true,
                message: 'Please input your Email!'
              }]}
            >
              <Input
                prefix={<MailOutlined className='site-form-item-icon' />}
                placeholder='Email'
                size='large'
              />
            </Form.Item>

            <Form.Item
              name='password'
              rules={[{
                required: true,
                message: 'Please input your Password!'
              }]}
            >
              <Input.Password
                prefix={<LockOutlined className='site-form-item-icon' />}
                placeholder='Password'
                type='password'
                size='large'
              />
            </Form.Item>

            <Form.Item>
              <Form.Item
                valuePropName='checked'
                name='remember'
                noStyle
              >
                <Checkbox>Remember me</Checkbox>
              </Form.Item>

              <Link
                className='btn-forgot-password'
                href='/auth/forgot-password'
              >
                Forgot Password
              </Link>
            </Form.Item>

            <Form.Item>
              <Button
                className='login-form-button'
                htmlType='submit'
                type='primary'
                size='large'
                block
                loading={loading}
                disabled={loading}
              >
                Log In
              </Button>
            </Form.Item>

            <Link
              className='btn-login-registration'
              href='/auth/registration'
            >
              Or Registration Here!
            </Link>
          </Form>
        </div>
      </MainLayout>
    </PublicRoute>
  );
}

export default Login;
