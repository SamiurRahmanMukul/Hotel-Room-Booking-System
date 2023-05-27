/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { LoadingOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import {
  Alert, Button, Divider, Form, Input
} from 'antd';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../assets/images/logo.svg';
import useTimeout from '../hooks/useTimeout';
import ApiService from '../utils/apiService';
import { setSessionUserAndToken } from '../utils/authentication';

function Login() {
  window.document.title = 'Beach Resort — Login';
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState('');

  // timeout callback
  const [timeout] = useTimeout(() => {
    setErrMsg('');
  }, 2000);

  timeout();

  // function to handle user login
  const onFinish = async (values) => {
    try {
      setLoading(true);
      const response = await ApiService.post('/api/v1/auth/login?loginType=admin', values);

      if (response?.result_code === 0) {
        setSessionUserAndToken(response?.result?.data, response?.access_token, response?.refresh_token);
        window.location.href = '/main/dashboard';
        setLoading(false);
      } else {
        setErrMsg('Sorry! Something went wrong. App server error');
        setLoading(false);
      }
      setLoading(false);
    } catch (error) {
      setErrMsg(error?.response?.data?.result?.error || 'Sorry! Something went wrong. App server error');
      setLoading(false);
    }
  };

  return (
    <section className='flex flex-col h-screen items-center justify-center'>
      <div className='w-[90%] md:w-[450px]'>
        <Link to='/'>
          <img
            className='w-[280px] h-[65px] mx-auto'
            alt='beach-resort-logo'
            src={Logo}
          />
        </Link>

        <Divider className='!mb-10'>LOGIN AUTHORIZED USER ONLY</Divider>
        {errMsg && <Alert message={errMsg} type='error' className='!text-center' />}

        <Form
          name='beach-resort-login'
          className='login-form mt-5'
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size='large'
        >
          <Form.Item
            name='email'
            rules={[{
              type: 'email',
              required: true,
              message: 'Please input your Email!'
            }]}
          >
            <Input
              prefix={<MailOutlined className='site-form-item-icon mr-2' />}
              placeholder='Enter here your Email'
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
              prefix={<LockOutlined className='site-form-item-icon mr-2' />}
              placeholder='Enter here your Password'
              type='password'
            />
          </Form.Item>

          {/* FORM SUBMIT BUTTON */}
          <Form.Item>
            <Button
              className='login-form-button mt-5'
              disabled={loading}
              loading={loading}
              htmlType='submit'
              type='primary'
              block
            >
              {loading ? <LoadingOutlined /> : 'Login'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </section>
  );
}

export default React.memo(Login);
