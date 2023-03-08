import { MailOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import Link from 'next/link';
import React from 'react';
import MainLayout from '../../../components/layout';

function ForgotPassword() {
  const onFinish = (values) => {
    // eslint-disable-next-line no-console
    console.log('Received values of form: ', values);
  };

  return (
    <MainLayout title='Beach Resort ― Forgot Password'>
      <div style={{ width: '400px', height: 'calc(100vh - 205px)', margin: '0 auto' }}>
        <Form
          className='login-form'
          style={{ paddingTop: '200px' }}
          initialValues={{ remember: true }}
          name='beach-resort-forgot-password-form'
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

          <Form.Item>
            <Button
              className='login-form-button'
              htmlType='submit'
              type='primary'
              size='large'
              block
            >
              Forgot Password
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

export default ForgotPassword;
