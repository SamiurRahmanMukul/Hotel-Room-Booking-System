/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, max-len */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Table, Button, Modal, Form, Input, Spin, Popconfirm
} from 'antd';
import { PlusOutlined, EditOutlined, TagsOutlined } from '@ant-design/icons';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

const { Title, Text } = Typography;

function Attributes() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, editing: null });
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await ApiService.get('/api/v1/attributes');
      setRows(res?.result?.data?.rows || []);
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || 'Could not load attributes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, []);

  const openAdd = () => {
    setModal({ open: true, editing: null });
    form.setFieldsValue({ name: '', description: '' });
  };
  const openEdit = (record) => {
    setModal({ open: true, editing: record });
    form.setFieldsValue({ name: record.name, description: record.description || '' });
  };

  const submit = async () => {
    let values;
    try { values = await form.validateFields(); } catch (e) { return; }
    try {
      setSubmitting(true);
      const { editing } = modal;
      const res = editing ?
        await ApiService.patch(`/api/v1/attributes/${editing.id}`, values) :
        await ApiService.post('/api/v1/attributes', values);
      if (res?.result_code === 0) {
        notificationWithIcon('success', editing ? 'Updated' : 'Created', `Attribute ${editing ? 'updated' : 'created'}.`);
        setModal({ open: false, editing: null });
        await fetchList();
      }
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || err?.message || 'Could not save the attribute.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    const { editing } = modal;
    if (!editing) return;
    try {
      const res = await ApiService.delete(`/api/v1/attributes/${editing.id}`);
      if (res?.result_code === 0) {
        notificationWithIcon('success', 'Deleted', `"${editing.name}" removed and detached from rooms.`);
        setModal({ open: false, editing: null });
        await fetchList();
      }
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || 'Could not delete the attribute.');
    }
  };

  const filtered = useMemo(() => (!search ? rows : rows.filter(
    (r) => r.name.toLowerCase().includes(search.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(search.toLowerCase())
  )), [rows, search]);

  const columns = [
    { title: 'Name', dataIndex: 'name', render: (v) => <strong>{v}</strong> },
    { title: 'Description', dataIndex: 'description', render: (v) => v || <Text type='secondary'>—</Text> },
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
          <TagsOutlined style={{ marginRight: 10 }} />
          Attributes
        </Title>
        <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>New unit attribute</Button>
      </div>
      <Text type='secondary'>Reusable tags (Balcony, Street view, King bed…) you can attach to any room from its Settings.</Text>

      <div style={{ marginTop: 16, maxWidth: 480 }}>
        <Input.Search placeholder='Search by name or description' allowClear onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size='large' /></div>
        ) : (
          <Table rowKey='id' columns={columns} dataSource={filtered} pagination={false} bordered />
        )}
      </div>

      <Modal
        title={modal.editing ? `Edit — ${modal.editing.name}` : 'Create new unit attribute'}
        open={modal.open}
        onCancel={() => setModal({ open: false, editing: null })}
        confirmLoading={submitting}
        destroyOnClose
        footer={[
          modal.editing ? (
            <Popconfirm
              key='del'
              title='Delete this attribute?'
              description='It is detached from all rooms. This cannot be undone.'
              okText='Delete'
              okButtonProps={{ danger: true }}
              onConfirm={remove}
            >
              <Button danger style={{ float: 'left' }}>Delete</Button>
            </Popconfirm>
          ) : null,
          <Button key='cancel' onClick={() => setModal({ open: false, editing: null })}>Cancel</Button>,
          <Button key='ok' type='primary' loading={submitting} onClick={submit}>Save</Button>
        ]}
      >
        <Form form={form} layout='vertical' style={{ marginTop: 12 }}>
          <Form.Item name='name' label='Name' rules={[{ required: true, message: 'Attribute name is required' }]}>
            <Input placeholder='e.g. Balcony, Street view, King bed' />
          </Form.Item>
          <Form.Item name='description' label='Description'>
            <Input.TextArea rows={3} placeholder='Optional' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default Attributes;
