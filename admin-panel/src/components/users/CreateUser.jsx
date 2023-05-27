/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import {
  EnvironmentOutlined, LockOutlined, MailOutlined, PhoneOutlined, UserOutlined
} from '@ant-design/icons';
import {
  Button, DatePicker, Form, Input, Select
} from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { reFetchData } from '../../store/slice/appSlice';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

function CreateUser() {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // function to handle register new user
  const onFinish = (values) => {
    setLoading(true);
    const data = {
      userName: values.userName,
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      role: values.role,
      gender: values.gender,
      dob: dayjs(values.dob).format('YYYY-MM-DD'),
      address: values.address,
      password: values.password
    };

    ApiService.post('/api/v1/auth/registration', data)
      .then((response) => {
        setLoading(false);
        if (response?.result_code === 0) {
          notificationWithIcon('success', 'SUCCESS', response?.result?.message || 'New user registration successful');
          form.resetFields();
          dispatch(reFetchData());
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
    <Form
      form={form}
      className='login-form'
      name='create-new-user'
      onFinish={onFinish}
      layout='vertical'
    >
      <div className='two-grid-column'>
        <Form.Item
          className='w-full md:w-1/2'
          label='Username'
          name='userName'
          rules={[{
            required: true,
            message: 'Please input your Username!'
          }]}
        >
          <Input
            prefix={<UserOutlined className='site-form-item-icon' />}
            placeholder='Username'
            size='large'
            type='text'
            allowClear
          />
        </Form.Item>

        <Form.Item
          className='w-full md:w-1/2'
          label='Full Name'
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
            type='text'
            allowClear
          />
        </Form.Item>
      </div>

      <div className='two-grid-column'>
        <Form.Item
          className='w-full md:w-1/2'
          label='Email'
          name='email'
          rules={[{
            type: 'email',
            required: true,
            message: 'Please input your Email!'
          }]}
        >
          <Input
            prefix={<MailOutlined className='site-form-item-icon' />}
            placeholder='Email'
            size='large'
            type='email'
            allowClear
          />
        </Form.Item>

        <Form.Item
          className='w-full md:w-1/2'
          label='Phone'
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
            type='text'
            allowClear
          />
        </Form.Item>
      </div>

      <div className='two-grid-column'>
        <Form.Item
          className='w-full md:w-1/2'
          label='Role'
          name='role'
          rules={[{
            required: true,
            message: 'Please input your Role!'
          }]}
        >
          <Select
            placeholder='-- select user role --'
            optionFilterProp='children'
            options={[
              { value: 'user', label: 'User' },
              { value: 'admin', label: 'Admin' }
            ]}
            size='large'
            allowClear
          />
        </Form.Item>

        <Form.Item
          className='w-full md:w-1/2'
          label='Gender'
          name='gender'
          rules={[{
            required: true,
            message: 'Please input your Gender!'
          }]}
        >
          <Select
            placeholder='-- select user gender --'
            optionFilterProp='children'
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' }
            ]}
            size='large'
            allowClear
          />
        </Form.Item>
      </div>

      <div className='two-grid-column'>
        <Form.Item
          className='w-full md:w-1/2'
          label='Date Of Birth'
          name='dob'
          rules={[{
            required: true,
            message: 'Please input your Date Of Birth!'
          }]}
        >
          <DatePicker
            className='w-full'
            placeholder='Pick your Date Of Birth'
            size='large'
            allowClear
          />
        </Form.Item>

        <Form.Item
          className='w-full md:w-1/2'
          label='Address'
          name='address'
          rules={[{
            required: true,
            message: 'Please input your Address!'
          }]}
        >
          <Input
            prefix={<EnvironmentOutlined className='site-form-item-icon' />}
            placeholder='Address'
            size='large'
            type='text'
            allowClear
          />
        </Form.Item>
      </div>

      <div className='two-grid-column'>
        <Form.Item
          className='w-full md:w-[49.5%]'
          label='Password'
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
            type='text'
            allowClear
          />
        </Form.Item>
      </div>

      <Form.Item>
        <Button
          className='login-form-button mt-4'
          htmlType='submit'
          type='primary'
          size='large'
          loading={loading}
          disabled={loading}
        >
          Register User
        </Button>
      </Form.Item>
    </Form>
  );
}

export default React.memo(CreateUser);
