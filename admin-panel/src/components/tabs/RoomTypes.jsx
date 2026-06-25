/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, max-len */
import React, { useState, useEffect } from 'react';
import {
  Typography, Table, Button, Modal, Form, Input, InputNumber, Tag, Select, Spin, Divider, Row, Col, Popconfirm
} from 'antd';
import {
  PlusOutlined, EditOutlined, AppstoreOutlined
} from '@ant-design/icons';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

const { Title, Text } = Typography;

const CATEGORY_LABELS = {
  BedRoom: 'Bedroom',
  MeetingRoom: 'Meeting room',
  EventSpace: 'Event space',
  ParkingLot: 'Parking'
};

const emptyValues = {
  name: '',
  description: '',
  translations: { bg: { name: '', description: '' } },
  category: 'BedRoom',
  capacity: 2,
  rank: 0,
  totalUnits: 0
};

function RoomTypes() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchTypes = async () => {
    try {
      setLoading(true);
      const res = await ApiService.get('/api/v1/room-types');
      setRows(res?.result?.data?.rows || []);
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || 'Could not load room types.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTypes(); }, []);

  const openAdd = () => {
    setModal({ open: true, editing: null });
    form.setFieldsValue(emptyValues);
  };

  const openEdit = (record) => {
    setModal({ open: true, editing: record });
    form.setFieldsValue({
      name: record.name,
      description: record.description || '',
      translations: { bg: { name: record.translations?.bg?.name || '', description: record.translations?.bg?.description || '' } },
      category: record.category || 'BedRoom',
      capacity: record.capacity,
      rank: record.rank || 0,
      totalUnits: record.totalUnits || 0
    });
  };

  const submit = async () => {
    let values;
    try { values = await form.validateFields(); } catch (e) { return; }
    try {
      setSubmitting(true);
      const { editing } = modal;
      const res = editing ?
        await ApiService.patch(`/api/v1/room-types/${editing.id}`, values) :
        await ApiService.post('/api/v1/room-types', values);
      if (res?.result_code === 0) {
        notificationWithIcon('success', editing ? 'Updated' : 'Created', `Room type ${editing ? 'updated' : 'created'}.`);
        setModal({ open: false, editing: null });
        await fetchTypes();
      } else {
        notificationWithIcon('error', 'Error', 'Could not save the room type.');
      }
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || err?.message || 'Could not save the room type.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    const { editing } = modal;
    if (!editing) return;
    try {
      const res = await ApiService.delete(`/api/v1/room-types/${editing.id}`);
      if (res?.result_code === 0) {
        notificationWithIcon('success', 'Deleted', `"${editing.name}" removed.`);
        setModal({ open: false, editing: null });
        await fetchTypes();
      }
    } catch (err) {
      notificationWithIcon('error', 'Cannot delete', err?.response?.data?.result?.error || 'Could not delete this room type.');
    }
  };

  const columns = [
    { title: 'Room type', dataIndex: 'name', render: (text) => <strong>{text}</strong> },
    { title: 'Category', dataIndex: 'category', render: (c) => <Tag>{CATEGORY_LABELS[c] || c}</Tag> },
    { title: 'Max persons', dataIndex: 'capacity', width: 120 },
    { title: 'Rank', dataIndex: 'rank', width: 80 },
    { title: 'Units', dataIndex: 'totalUnits', width: 90, render: (v) => <Tag color='geekblue'>{v}</Tag> },
    {
      title: '',
      width: 90,
      align: 'right',
      render: (_, record) => <Button size='small' icon={<EditOutlined />} onClick={() => openEdit(record)}>Edit</Button>
    }
  ];

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <Title level={2} style={{ margin: 0 }}>
          <AppstoreOutlined style={{ marginRight: 10 }} />
          Room Types
        </Title>
        <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>Add room type</Button>
      </div>
      <Text type='secondary'>Click <strong>Edit</strong> to change a type and set how many units it has. Floors &amp; numbers are assigned under Rooms.</Text>

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size='large' /></div>
        ) : (
          <Table rowKey='id' columns={columns} dataSource={rows} pagination={false} bordered />
        )}
      </div>

      <Modal
        title={modal.editing ? `Edit — ${modal.editing.name}` : 'New room type'}
        open={modal.open}
        onCancel={() => setModal({ open: false, editing: null })}
        confirmLoading={submitting}
        destroyOnClose
        width={760}
        footer={[
          modal.editing ? (
            <Popconfirm
              key='del'
              title='Delete this room type?'
              description='Its rooms are removed too. This cannot be undone.'
              okText='Delete'
              okButtonProps={{ danger: true }}
              onConfirm={remove}
            >
              <Button danger style={{ float: 'left' }}>Delete</Button>
            </Popconfirm>
          ) : null,
          <Button key='cancel' onClick={() => setModal({ open: false, editing: null })}>Cancel</Button>,
          <Button key='ok' type='primary' loading={submitting} onClick={submit}>{modal.editing ? 'Save' : 'Create'}</Button>
        ]}
      >
        <Form form={form} layout='vertical' style={{ marginTop: 12 }} initialValues={emptyValues}>
          <Divider orientation='left'>Translations</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                <Text strong>English</Text>
                <Form.Item name='name' label='Name' rules={[{ required: true, message: 'English name is required' }]} style={{ marginTop: 8 }}>
                  <Input placeholder='e.g. Double Room' />
                </Form.Item>
                <Form.Item name='description' label='Description' style={{ marginBottom: 0 }}>
                  <Input.TextArea rows={3} placeholder='e.g. Quiet room in a nearby place' />
                </Form.Item>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
                <Text strong>Bulgarian</Text>
                <Form.Item name={['translations', 'bg', 'name']} label='Name (BG)' style={{ marginTop: 8 }}>
                  <Input placeholder='напр. Двойна стая' />
                </Form.Item>
                <Form.Item name={['translations', 'bg', 'description']} label='Description (BG)' style={{ marginBottom: 0 }}>
                  <Input.TextArea rows={3} placeholder='напр. Тиха стая наблизо' />
                </Form.Item>
              </div>
            </Col>
          </Row>

          <Divider orientation='left'>Inventory attributes</Divider>
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name='category' label='Type' rules={[{ required: true }]}>
                <Select options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name='capacity' label='Max. persons' rules={[{ required: true }]}>
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} md={8}>
              <Form.Item name='rank' label='Rank' tooltip='Lower rank shows first in availability, offers, etc.'>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation='left'>Units</Divider>
          <Form.Item name='totalUnits' label='Total number of units' tooltip='How many rooms of this type the hotel has. Floors & numbers are set under Rooms.'>
            <InputNumber min={0} max={2000} style={{ width: 220 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default RoomTypes;
