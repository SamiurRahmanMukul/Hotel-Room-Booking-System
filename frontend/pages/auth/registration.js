/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import {
  LockOutlined, MailOutlined, PhoneOutlined, UserOutlined
} from '@ant-design/icons';
import {
  Button, DatePicker, Form, Input, Select
} from 'antd';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import MainLayout from '../../components/layout';
import PublicRoute from '../../components/routes/PublicRoute';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

const { TextArea } = Input;

function Registration() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  // function to handle register new user
  const onFinish = (values) => {
    setLoading(true);
    const data = {
      userName: values.userName,
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      dob: dayjs(values.dob).format('YYYY-MM-DD'),
      gender: values.gender,
      address: values.address,
      password: values.password
    };

    ApiService.post('/api/v1/auth/registration', data)
      .then((response) => {
        setLoading(false);
        if (response?.result_code === 0) {
          notificationWithIcon('success', 'SUCCESS', response?.result?.message || 'Your registration successful');
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
    <PublicRoute>
      <MainLayout title='Beach Resort ― Registration'>
        <div style={{ width: '400px', height: 'calc(100vh - 205px)', margin: '0 auto' }}>
          <Form
            form={form}
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
                allowClear
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
                allowClear
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
                allowClear
              />
            </Form.Item>

            <Form.Item
              name='phone'
              rules={[{
                required: true,
                message: 'Please input your Phone!'
              }]}
            >
              <Input
                prefix={<PhoneOutlined className='site-form-item-icon' />}
                placeholder='Phone'
                size='large'
                allowClear
                type='tel'
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
                placeholder='Pick your Date Of Birth'
                size='large'
                allowClear
              />
            </Form.Item>

            <Form.Item
              name='gender'
              rules={[{
                required: true,
                message: 'Please input your Gender!'
              }]}
            >
              <Select placeholder='-- select your gender --' size='large' allowClear>
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
              <TextArea
                placeholder='Address'
                size='large'
                allowClear
                rows={2}
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
                size='large'
                allowClear
                type='tel'
              />
            </Form.Item>

            <Form.Item>
              <Button
                style={{ marginTop: '10px' }}
                className='login-form-button'
                htmlType='submit'
                type='primary'
                size='large'
                block
                loading={loading}
                disabled={loading}
              >
                Registration
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
    </PublicRoute>
  );
}

export default Registration;
