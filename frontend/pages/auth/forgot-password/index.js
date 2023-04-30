import { MailOutlined } from '@ant-design/icons';
import { Button, Form, Input } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import MainLayout from '../../../components/layout';
import ApiService from '../../../utils/apiService';
import notificationWithIcon from '../../../utils/notification';

function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  const onFinish = (values) => {
    ApiService.post('/api/v1/auth/forgot-password', values)
      .then((response) => {
        setLoading(false);
        if (response?.result_code === 0) {
          notificationWithIcon('success', 'SUCCESS', response?.result?.message || 'Your password reset mail send successful');
          form.resetFields();
          router.push('/auth/login');
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
    <MainLayout title='Beach Resort ― Forgot Password'>
      <div style={{ width: '400px', height: 'calc(100vh - 205px)', margin: '0 auto' }}>
        <Form
          form={form}
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
              loading={loading}
              disabled={loading}
            >
              Forgot Password
            </Button>
          </Form.Item>

          <Link
            className='btn-login-registration'
            href='/auth/login'
          >
            Or Login Here!
          </Link>
        </Form>
      </div>
    </MainLayout>
  );
}

export default ForgotPassword;
