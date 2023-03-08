import { LockOutlined, MailOutlined } from '@ant-design/icons';
import {
  Button, Checkbox, Form, Input
} from 'antd';
import Link from 'next/link';
import React from 'react';
import MainLayout from '../../components/layout';

function Login() {
  const onFinish = (values) => {
    // eslint-disable-next-line no-console
    console.log('Received values of form: ', values);
  };

  return (
    <MainLayout title='Beach Resort ― Login'>
      <div style={{ width: '400px', height: 'calc(100vh - 205px)', margin: '0 auto' }}>
        <Form
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
            >
              Login
            </Button>
          </Form.Item>

          <Link
            className='btn-login-registration'
            href='/auth/registration'
          >
            or Registration Here!
          </Link>
        </Form>
      </div>
    </MainLayout>
  );
}

export default Login;
