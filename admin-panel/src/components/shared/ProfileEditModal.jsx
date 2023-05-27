/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import {
  EnvironmentOutlined, PhoneOutlined, UserOutlined
} from '@ant-design/icons';
import {
  Button, DatePicker, Form, Input, Modal, Result, Select
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import useFetchData from '../../hooks/useFetchData';
import { reFetchData } from '../../store/slice/appSlice';
import ApiService from '../../utils/apiService';
import { setSessionUserKeyAgainstValue } from '../../utils/authentication';
import notificationWithIcon from '../../utils/notification';
import PageLoader from './PageLoader';

function ProfileEditModal({ editProfileModal, setEditProfileModal }) {
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // fetch user profile API data
  const [fetchLoading, fetchError, fetchResponse] = useFetchData('/api/v1/get-user');

  // set form data from API data
  useEffect(() => {
    if (fetchResponse) {
      form.setFieldsValue({
        fullName: fetchResponse?.data?.fullName || undefined,
        phone: fetchResponse?.data?.phone || undefined,
        gender: fetchResponse?.data?.gender || undefined,
        dob: dayjs(fetchResponse?.data?.dob) || undefined,
        address: fetchResponse?.data?.address || undefined
      });
    }
  }, [fetchResponse, form]);

  // function to handle edit user profile
  const onFinish = (values) => {
    setLoading(true);
    ApiService.put('/api/v1/update-user', values)
      .then((response) => {
        setLoading(false);
        if (response?.result_code === 0) {
          notificationWithIcon('success', 'SUCCESS', response?.result?.message || 'Your profile information updated successful');

          // update local storage session user data
          setSessionUserKeyAgainstValue('fullName', response?.result?.data?.fullName);
          setSessionUserKeyAgainstValue('phone', response?.result?.data?.phone);
          setSessionUserKeyAgainstValue('gender', response?.result?.data?.gender);
          setSessionUserKeyAgainstValue('dob', response?.result?.data?.dob);
          setSessionUserKeyAgainstValue('address', response?.result?.data?.address);

          form.resetFields();
          dispatch(reFetchData());
          setEditProfileModal(false);
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
    <Modal
      title='Edit Profile Information'
      open={editProfileModal}
      onOk={() => setEditProfileModal(false)}
      onCancel={() => setEditProfileModal(false)}
      footer={[]}
      width={800}
    >
      {fetchLoading ? (<PageLoader />) : fetchError ? (
        <Result
          title='Failed to fetch'
          subTitle={fetchError}
          status='error'
        />
      ) : (
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
                format='YYYY-MM-DD'
                size='large'
                allowClear
              />
            </Form.Item>
          </div>

          <Form.Item
            className='w-full'
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

          <Form.Item>
            <Button
              className='login-form-button mt-4'
              htmlType='submit'
              type='primary'
              size='middle'
              loading={loading}
              disabled={loading}
            >
              Update Info
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

export default React.memo(ProfileEditModal);
