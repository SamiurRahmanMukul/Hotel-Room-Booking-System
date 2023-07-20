/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { PlusOutlined } from '@ant-design/icons';
import {
  Button, Checkbox, Form, Input, InputNumber, Modal, Result, Select, Upload
} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import EF from '../../assets/data/extra-facilities.json';
import useFetchData from '../../hooks/useFetchData';
import { reFetchData } from '../../store/slice/appSlice';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';
import PageLoader from '../shared/PageLoader';

function RoomEdit({ roomEditModal, setRoomEditModal }) {
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  // fetch room-details API data
  const [fetchLoading, fetchError, fetchResponse] = useFetchData(
    `/api/v1/get-room-by-id-or-slug-name/${roomEditModal.roomId}`
  );

  // set form data from API data
  useEffect(() => {
    if (fetchResponse) {
      form.setFieldsValue({
        room_name: fetchResponse?.data?.room_name || undefined,
        room_slug: fetchResponse?.data?.room_slug || undefined,
        room_type: fetchResponse?.data?.room_type || undefined,
        room_price: fetchResponse?.data?.room_price || undefined,
        room_size: fetchResponse?.data?.room_size || undefined,
        room_capacity: fetchResponse?.data?.room_capacity || undefined,
        allow_pets: fetchResponse?.data?.allow_pets || false,
        provide_breakfast: fetchResponse?.data?.provide_breakfast || false,
        featured_room: fetchResponse?.data?.featured_room || false,
        room_description: fetchResponse?.data?.room_description || undefined,
        extra_facilities: fetchResponse?.data?.extra_facilities || undefined,
        room_images: fetchResponse?.data?.room_images || undefined
      });
    }
  }, [fetchResponse, form]);

  const normFile = (e) => {
    if (Array.isArray(e)) { return e; }
    return e?.fileList;
  };

  // function to handle create new room
  const onFinish = (values) => {
    const formdata = new FormData();
    formdata.append('room_name', values.room_name);
    formdata.append('room_slug', values.room_slug);
    formdata.append('room_type', values.room_type);
    formdata.append('room_price', values.room_price);
    formdata.append('room_size', values.room_size);
    formdata.append('room_capacity', values.room_capacity);
    formdata.append('allow_pets', values?.allow_pets || false);
    formdata.append('provide_breakfast', values?.provide_breakfast || false);
    formdata.append('featured_room', values?.featured_room || false);
    formdata.append('room_description', values.room_description);

    // eslint-disable-next-line no-restricted-syntax
    for (const facilities of values.extra_facilities) {
      formdata.append('extra_facilities', facilities);
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const images of values.room_images) {
      formdata.append('room_images', images.originFileObj);
    }

    setLoading(true);
    ApiService.put(`/api/v1/edit-room/${roomEditModal.roomId}`, formdata, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then((response) => {
        setLoading(false);
        if (response?.result_code === 0) {
          notificationWithIcon('success', 'SUCCESS', response?.result?.message || 'Room updating successful');
          form.resetFields();
          dispatch(reFetchData());
          setRoomEditModal((prevState) => ({ ...prevState, open: false }));
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
      title='Edit Room Information'
      open={roomEditModal.open}
      onOk={() => setRoomEditModal(
        (prevState) => ({ ...prevState, open: false })
      )}
      onCancel={() => setRoomEditModal(
        (prevState) => ({ ...prevState, open: false })
      )}
      footer={[]}
      width={1200}
      centered
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
          name='room-edit-form'
          onFinish={onFinish}
          layout='vertical'
        >
          <div className='two-grid-column'>
            <Form.Item
              className='w-full md:w-1/2'
              label='Room Name'
              name='room_name'
              rules={[{
                required: true,
                message: 'Please input your Room Name!'
              }]}
            >
              <Input
                placeholder='Room Name'
                size='large'
                type='text'
                allowClear
              />
            </Form.Item>

            <Form.Item
              className='w-full md:w-1/2'
              label='Room Slug'
              name='room_slug'
              rules={[{
                required: true,
                message: 'Please input your Room Slug!'
              }]}
            >
              <Input
                placeholder='Room Slug'
                size='large'
                type='text'
                allowClear
              />
            </Form.Item>
          </div>

          <div className='two-grid-column'>
            <Form.Item
              className='w-full md:w-1/2'
              label='Room Type'
              name='room_type'
              rules={[{
                required: true,
                message: 'Please input your Room Type!'
              }]}
            >
              <Select
                placeholder='-- select room type --'
                optionFilterProp='children'
                options={[
                  { value: 'single', label: 'Single' },
                  { value: 'couple', label: 'Couple' }
                ]}
                size='large'
                allowClear
              />
            </Form.Item>

            <Form.Item
              className='w-full md:w-1/2'
              label='Room Price'
              name='room_price'
              rules={[{
                required: true,
                message: 'Please input your Room Price!'
              }]}
            >
              <InputNumber
                className='w-full'
                placeholder='Room Price'
                type='number'
                size='large'
                min={1}
                max={100000}
              />
            </Form.Item>
          </div>

          <div className='two-grid-column'>
            <Form.Item
              className='w-full md:w-1/2'
              label='Room Size'
              name='room_size'
              rules={[{
                required: true,
                message: 'Please input your Room Size!'
              }]}
            >
              <InputNumber
                className='w-full'
                placeholder='Room Size'
                type='number'
                size='large'
                min={1}
                max={1000}
              />
            </Form.Item>

            <Form.Item
              className='w-full md:w-1/2'
              label='Room Capacity'
              name='room_capacity'
              rules={[{
                required: true,
                message: 'Please input your Room Capacity!'
              }]}
            >
              <InputNumber
                className='w-full'
                placeholder='Room Capacity'
                type='number'
                size='large'
                min={1}
                max={10}
              />
            </Form.Item>
          </div>

          <Form.Item
            label='Room Description'
            name='room_description'
            rules={[{
              required: true,
              message: 'Please input your Room Description!'
            }]}
          >
            <TextArea
              placeholder='Type here Room Description'
              rows={4}
            />
          </Form.Item>

          <Form.Item
            label='Extra Facilities'
            name='extra_facilities'
            rules={[{
              required: true,
              message: 'Please input your Extra Facilities!'
            }]}
          >
            <Select
              placeholder='-- select room extra facilities --'
              optionFilterProp='children'
              options={EF}
              mode='multiple'
              size='large'
              allowClear
            />
          </Form.Item>

          <Form.Item
            name='room_images'
            label='Room Images'
            valuePropName='fileList'
            getValueFromEvent={normFile}
            rules={[{
              required: true,
              message: 'Please input your Room Images!'
            }]}
          >
            <Upload
              listType='picture-card'
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              accept='.jpg,.jpeg,.png,.pdf'
              beforeUpload={() => false}
              fileList={fileList}
              name='room_images'
              maxCount={5}
            >
              {fileList.length >= 5 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>
                    Upload
                  </div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <div className='flex flex-col items-start justify-start gap-y-2'>
            <Form.Item name='allow_pets' valuePropName='checked' noStyle>
              <Checkbox className='ml-2.5'>Allow pets?</Checkbox>
            </Form.Item>
            <Form.Item name='provide_breakfast' valuePropName='checked' noStyle>
              <Checkbox>Provide Breakfast?</Checkbox>
            </Form.Item>
            <Form.Item name='featured_room' valuePropName='checked' noStyle>
              <Checkbox>Featured Room?</Checkbox>
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
              Update Room Info
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

export default React.memo(RoomEdit);
