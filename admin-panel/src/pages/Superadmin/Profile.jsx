/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, no-confusing-arrow, no-underscore-dangle */
import {
  DeleteOutlined, LockOutlined, PlusOutlined, UserAddOutlined
} from '@ant-design/icons';
import {
  Alert, Button, Card, Descriptions, Form, Input, Modal, Popconfirm, Space, Table, Tag, message
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import SuperadminLayout from '../../components/SuperadminLayout';
import SuperadminApi from '../../utils/superadminApi';

function SuperadminProfile() {
  let me = {};
  try { me = JSON.parse(localStorage.getItem('superadmin_user') || '{}'); } catch { me = {}; }

  const [pwOpen, setPwOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [peers, setPeers] = useState([]);

  const refresh = useCallback(async () => {
    try {
      const data = await SuperadminApi.get('/platform-api/superadmins');
      setPeers(data.superadmins || []);
    } catch (err) {
      // 401 handled by SuperadminApi interceptor
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onChangePw = async (vals) => {
    try {
      await SuperadminApi.post('/platform-api/me/change-password', vals);
      message.success('Password changed');
      setPwOpen(false);
    } catch (err) { message.error(err.response?.data?.error || err.message); }
  };

  const onInvite = async (vals) => {
    try {
      const data = await SuperadminApi.post('/platform-api/superadmins/invite', vals);
      setInviteResult(data);
      refresh();
    } catch (err) { message.error(err.response?.data?.error || err.message); }
  };

  const onRemove = async (id) => {
    try {
      await SuperadminApi.delete(`/platform-api/superadmins/${id}`);
      message.success('Removed');
      refresh();
    } catch (err) { message.error(err.response?.data?.error || err.message); }
  };

  return (
    <SuperadminLayout>
      <Card title='My account' extra={<Button icon={<LockOutlined />} onClick={() => setPwOpen(true)}>Change password</Button>}>
        <Descriptions column={1} bordered size='small'>
          <Descriptions.Item label='Full name'>{me.fullName}</Descriptions.Item>
          <Descriptions.Item label='Email'>{me.email}</Descriptions.Item>
          <Descriptions.Item label='Role'>Super Admin (platform)</Descriptions.Item>
          <Descriptions.Item label='Must change password'>{me.mustChangePassword ? <Tag color='orange'>yes</Tag> : <Tag color='green'>no</Tag>}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card
        title={`Other super-admins (${peers.length})`}
        extra={<Button type='primary' icon={<UserAddOutlined />} onClick={() => { setInviteResult(null); setInviteOpen(true); }}>Invite super-admin</Button>}
        style={{ marginTop: 16 }}
      >
        <Table
          rowKey='_id'
          size='small'
          dataSource={peers}
          pagination={false}
          columns={[
            { title: 'Email', dataIndex: 'email', key: 'email' },
            { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (v, r) => r.mustChangePassword ? <Tag color='orange'>pending password setup</Tag> : <Tag color='green'>{v || 'active'}</Tag> },
            { title: 'Last login', dataIndex: 'lastLoginAt', key: 'lastLoginAt', render: (v) => v ? new Date(v).toLocaleString() : '—' },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, r) => r.email !== me.email && (
                <Popconfirm title={`Remove ${r.email}?`} onConfirm={() => onRemove(r._id)}>
                  <Button size='small' danger icon={<DeleteOutlined />}>Remove</Button>
                </Popconfirm>
              )
            }
          ]}
        />
      </Card>

      <Modal title='Change password' open={pwOpen} onCancel={() => setPwOpen(false)} footer={null} destroyOnClose>
        <Form layout='vertical' onFinish={onChangePw}>
          {!me.mustChangePassword && (
            <Form.Item label='Current password' name='current_password' rules={[{ required: true }]}><Input.Password /></Form.Item>
          )}
          <Form.Item label='New password' name='new_password' rules={[{ required: true, min: 8 }]}><Input.Password /></Form.Item>
          <Form.Item><Button type='primary' htmlType='submit' block>Update password</Button></Form.Item>
        </Form>
      </Modal>

      <Modal title='Invite super-admin' open={inviteOpen} onCancel={() => setInviteOpen(false)} footer={null} destroyOnClose>
        {inviteResult ? (
          <div>
            <Alert
              type='success'
              showIcon
              message={`Invited ${inviteResult.superadmin.email}`}
              description={(
                <Space direction='vertical' size='small' style={{ width: '100%' }}>
                  <div>📧 Magic link {inviteResult.mail.sent ? 'sent' : 'created (delivery failed; see backend log)'}</div>
                  <div style={{ marginTop: 8, wordBreak: 'break-all', fontSize: 11, color: '#888' }}>
                    Direct link: <a href={inviteResult.magicLink.url}>{inviteResult.magicLink.url}</a>
                  </div>
                </Space>
              )}
            />
            <Button type='primary' onClick={() => setInviteOpen(false)} style={{ marginTop: 16 }} block>Done</Button>
          </div>
        ) : (
          <Form layout='vertical' onFinish={onInvite} requiredMark={false}>
            <Form.Item label='Email' name='email' rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
            <Form.Item label='Full name (optional)' name='fullName'><Input /></Form.Item>
            <Form.Item><Button type='primary' htmlType='submit' icon={<PlusOutlined />} block>Send invite</Button></Form.Item>
          </Form>
        )}
      </Modal>
    </SuperadminLayout>
  );
}

export default SuperadminProfile;
