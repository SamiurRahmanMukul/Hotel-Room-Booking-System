import { LockOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import Link from 'next/link';
import React from 'react';
import MainLayout from '../../../components/layout';

function ResetPassword() {
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

          <Form.Item
            name='confirmPassword'
            rules={[{
              required: true,
              message: 'Please input your Confirm Password!'
            }]}
          >
            <Input.Password
              prefix={<LockOutlined className='site-form-item-icon' />}
              placeholder='Confirm Password'
              type='password'
              size='large'
            />
          </Form.Item>

          <Form.Item>
            <Button
              className='login-form-button'
              htmlType='submit'
              type='primary'
              size='large'
              block
            >
              Reset Password
            </Button>
          </Form.Item>

          <Link
            className='btn-login-registration'
            href='/auth/login'
          >
            or Login Here!
          </Link>
        </Form>
      </div>
    </MainLayout>
  );
}

export default ResetPassword;
