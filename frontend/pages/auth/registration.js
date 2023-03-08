import { MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';
import {
  Button, DatePicker, Form, Input, Select
} from 'antd';
import Link from 'next/link';
import React from 'react';
import MainLayout from '../../components/layout';

const { TextArea } = Input;

function Registration() {
  const onFinish = (values) => {
    // eslint-disable-next-line no-console
    console.log('Received values of form: ', values);
  };

  return (
    <MainLayout title='Beach Resort ― Registration'>
      <div style={{ width: '400px', height: 'calc(100vh - 205px)', margin: '0 auto' }}>
        <Form
          className='login-form'
          style={{ padding: '20px 0' }}
          initialValues={{ remember: true }}
          name='beach-resort-registration-form'
          onFinish={onFinish}
        >
          <Form.Item
            name='userName'
            rules={[{
              required: true,
              message: 'Please input your User Name!'
            }]}
          >
            <Input
              prefix={<UserOutlined className='site-form-item-icon' />}
              placeholder='User Name'
              size='large'
            />
          </Form.Item>

          <Form.Item
            name='fullName'
            rules={[{
              required: true,
              message: 'Please input your Full Name!'
            }]}
          >
            <Input
              prefix={<UserOutlined className='site-form-item-icon' />}
              placeholder='Full Name'
              size='large'
            />
          </Form.Item>

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
            name='phone'
            rules={[{
              required: true,
              message: 'Please input your Phone!'
            }]}
          >
            <Input.Password
              prefix={<PhoneOutlined className='site-form-item-icon' />}
              placeholder='Phone'
              type='password'
              size='large'
            />
          </Form.Item>

          <Form.Item
            name='dob'
            rules={[{
              required: true,
              message: 'Please input your Date Of Birth!'
            }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              placeholder='Date Of Birth'
              size='large'
            />
          </Form.Item>

          <Form.Item
            name='gender'
            rules={[{
              required: true,
              message: 'Please input your Gender!'
            }]}
          >
            <Select placeholder='-- select your gender --' size='large'>
              <Select.Option value='male'>Male</Select.Option>
              <Select.Option value='female'>Female</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name='address'
            rules={[{
              required: true,
              message: 'Please input your Address!'
            }]}
          >
            <TextArea placeholder='Address' rows={4} size='large' />
          </Form.Item>

          <Form.Item>
            <Button
              className='login-form-button'
              htmlType='submit'
              type='primary'
              size='large'
              block
            >
              Registration
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

export default Registration;
