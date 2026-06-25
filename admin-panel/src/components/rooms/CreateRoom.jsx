/**
 * Add a single physical room (type-driven). Lightweight: a room is just a number, a room
 * type (from the Room Types catalog), a floor, and a status. Price/capacity come from the
 * type. For bulk setup, use Room Types → "Set up rooms by floor".
 */

import {
  Button, Form, Input, Select, Empty
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { reFetchData } from '../../store/slice/appSlice';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

function CreateRoom({ onSaved } = {}) {
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(true);
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await ApiService.get('/api/v1/room-types');
        if (!cancelled) setTypes(res?.result?.data?.rows || []);
      } catch (err) {
        if (!cancelled) notificationWithIcon('error', 'Error', 'Could not load room types.');
      } finally {
        if (!cancelled) setTypesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onFinish = (values) => {
    setLoading(true);
    ApiService.post('/api/v1/rooms', {
      room_name: values.room_name,
      roomTypeId: values.roomTypeId,
      floor: values.floor || '',
      room_status: values.room_status || 'available'
    })
      .then((response) => {
        setLoading(false);
        if (response?.result_code === 0) {
          notificationWithIcon('success', 'Added', 'Room added.');
          form.resetFields();
          dispatch(reFetchData());
          if (typeof onSaved === 'function') onSaved();
        } else {
          notificationWithIcon('error', 'Error', 'Could not add the room.');
        }
      })
      .catch((err) => {
        setLoading(false);
        notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || err?.message || 'Could not add the room.');
      });
  };

  if (!typesLoading && types.length === 0) {
    return (
      <Empty
        description='No room types yet. Create a room type first (Room Types tab), then add rooms here.'
        style={{ padding: '32px 0' }}
      />
    );
  }

  return (
    <Form
      form={form}
      name='create-room-form'
      onFinish={onFinish}
      layout='vertical'
      initialValues={{ room_status: 'available' }}
    >
      <Form.Item
        label='Room number / name'
        name='room_name'
        extra='The unique identifier for this physical room, e.g. 101, G04, Penthouse-A'
        rules={[{ required: true, message: 'Enter the room number or name' }]}
      >
        <Input placeholder='e.g. 101' size='large' allowClear />
      </Form.Item>

      <Form.Item
        label='Room type'
        name='roomTypeId'
        extra='The room inherits its price & capacity from the type'
        rules={[{ required: true, message: 'Pick a room type' }]}
      >
        <Select
          placeholder='Pick a room type'
          loading={typesLoading}
          size='large'
          showSearch
          optionFilterProp='label'
          options={types.map((t) => ({ value: t.id, label: `${t.name} — €${t.basePrice}/night · sleeps ${t.capacity}` }))}
        />
      </Form.Item>

      <div className='two-grid-column'>
        <Form.Item className='w-full md:w-1/2' label='Floor' name='floor' extra='e.g. Ground, 1, Penthouse'>
          <Input placeholder='e.g. 1' size='large' allowClear />
        </Form.Item>

        <Form.Item className='w-full md:w-1/2' label='Status' name='room_status'>
          <Select
            size='large'
            options={[
              { value: 'available', label: 'Available' },
              { value: 'unavailable', label: 'Out of service' }
            ]}
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
          Add room
        </Button>
      </Form.Item>
    </Form>
  );
}

export default React.memo(CreateRoom);
