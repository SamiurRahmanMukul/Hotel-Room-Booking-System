/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline */
import { PlusOutlined } from '@ant-design/icons';
import {
  Alert, Button, Card, Form, Input, Modal, Space, Table, Tag, message
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SuperadminLayout from '../../components/SuperadminLayout';
import SuperadminApi from '../../utils/superadminApi';

function SuperadminHotels() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await SuperadminApi.get('/platform-api/hotels');
      setHotels(data.hotels || []);
      setError(null);
    } catch (err) {
      if (err.response?.status === 401) { navigate('/superadmin/login'); return; }
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { refresh(); }, [refresh]);

  const onCreate = async (values) => {
    setCreating(true);
    try {
      const data = await SuperadminApi.post('/platform-api/hotels', values);
      setCreated(data);
      message.success(`Created ${data.hotel.name}`);
      refresh();
    } catch (err) {
      message.error(err.response?.data?.error || err.message);
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (v) => <strong>{v}</strong> },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (v) => <code>{v}</code> },
    { title: 'Database', dataIndex: 'dbName', key: 'dbName', render: (v) => <code style={{ color: '#888' }}>{v}</code> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'active' ? 'green' : v === 'suspended' ? 'red' : 'default'}>{v}</Tag> },
    { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v && new Date(v).toLocaleString() }
  ];

  return (
    <SuperadminLayout>
      <Card
        title={`Hotels (${hotels.length})`}
        extra={(
          <Button type='primary' icon={<PlusOutlined />} onClick={() => { setCreated(null); setOpen(true); }}>
            Create new hotel
          </Button>
        )}
      >
        {error && <Alert type='error' message={error} showIcon style={{ marginBottom: 16 }} />}
        <Table
          rowKey='_id'
          dataSource={hotels}
          columns={columns}
          loading={loading}
          pagination={{ pageSize: 20 }}
          onRow={(record) => ({
            onClick: () => navigate(`/superadmin/hotels/${record.slug}`),
            style: { cursor: 'pointer' }
          })}
        />
      </Card>

      <Modal title='Create new hotel' open={open} onCancel={() => setOpen(false)} footer={null} destroyOnClose>
        {created ? (
          <div>
            <Alert
              type='success'
              showIcon
              message={`${created.hotel.name} provisioned`}
              description={(
                <Space direction='vertical' size='small' style={{ width: '100%' }}>
                  <div><strong>Slug:</strong> <code>{created.hotel.slug}</code></div>
                  <div><strong>Database:</strong> <code>{created.hotel.dbName}</code></div>
                  <div><strong>Booking URL:</strong> <code>{created.bookingUrl}</code></div>
                  <div style={{ marginTop: 12, padding: 12, background: '#e6f4ff', border: '1px solid #91caff', borderRadius: 4 }}>
                    <div><strong>📧 Magic link {created.mail?.sent ? 'sent' : 'created'}</strong></div>
                    <div>To: <code>{created.admin.email}</code></div>
                    <div style={{ marginTop: 6, fontSize: 12, color: '#555' }}>
                      Manager opens the link, sets a password, and is signed in. Link expires in 24 hours.
                    </div>
                    {created.mail?.transport === 'console' && (
                      <div style={{ marginTop: 8, padding: 8, background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 4, fontSize: 12 }}>
                        <strong>Dev mode (console mailer):</strong> the link is printed in the backend log. Set <code>MAIL_TRANSPORT=resend</code> in <code>backend/.env</code> for real delivery.
                      </div>
                    )}
                    <div style={{ marginTop: 8, wordBreak: 'break-all', fontSize: 11, color: '#888' }}>
                      Direct link: <a href={created.magicLink.url}>{created.magicLink.url}</a>
                    </div>
                  </div>
                </Space>
              )}
            />
            <Button type='primary' onClick={() => setOpen(false)} style={{ marginTop: 16 }} block>Done</Button>
          </div>
        ) : (
          <Form layout='vertical' onFinish={onCreate} requiredMark={false}>
            <Form.Item
              label='Hotel name'
              name='name'
              rules={[{ required: true, message: 'Required' }]}
              extra='Everything else is auto-generated. Slug, DB, admin user, settings, default branding & policies.'
            >
              <Input placeholder='e.g. Acme Boutique Hotel' autoFocus />
            </Form.Item>
            <Form.Item
              label='Manager email'
              name='contact_email'
              rules={[{ required: true, type: 'email', message: 'Valid email required' }]}
            >
              <Input placeholder='manager@hotel.com' />
            </Form.Item>
            <Form.Item label='Manager full name (optional)' name='admin_full_name'>
              <Input placeholder='e.g. Jane Doe' />
            </Form.Item>
            <Form.Item>
              <Button type='primary' htmlType='submit' loading={creating} icon={<PlusOutlined />} block>
                Create new entity
              </Button>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </SuperadminLayout>
  );
}

export default SuperadminHotels;
