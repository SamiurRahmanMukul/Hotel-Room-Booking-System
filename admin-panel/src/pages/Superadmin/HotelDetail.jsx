/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, react/no-array-index-key, no-confusing-arrow, no-underscore-dangle, operator-linebreak */
import {
  ArrowLeftOutlined, DeleteOutlined, EditOutlined, MailOutlined, PauseCircleOutlined,
  PlayCircleOutlined, PlusOutlined, ReloadOutlined, UserOutlined, RedoOutlined, DatabaseOutlined
} from '@ant-design/icons';
import {
  Alert, Badge, Button, Card, Col, Descriptions, Form, Input, Modal, Popconfirm, Progress,
  Row, Space, Spin, Statistic, Table, Tag, Typography, message
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SuperadminLayout from '../../components/SuperadminLayout';
import SuperadminApi from '../../utils/superadminApi';

function HotelDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [backups, setBackups] = useState([]);
  const [backupsLoading, setBackupsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [d, a, b] = await Promise.all([
        SuperadminApi.get(`/platform-api/hotels/${slug}`),
        SuperadminApi.get(`/platform-api/hotels/${slug}/admins`),
        SuperadminApi.get(`/platform-api/hotels/${slug}/backups`)
      ]);
      setData(d);
      setAdmins(a.admins || []);
      setBackups(b.backups || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { refresh(); }, [refresh]);

  const onSuspend = async () => {
    await SuperadminApi.post(`/platform-api/hotels/${slug}/status`, { status: 'suspended' });
    message.success('Hotel suspended');
    refresh();
  };
  const onReactivate = async () => {
    await SuperadminApi.post(`/platform-api/hotels/${slug}/status`, { status: 'active' });
    message.success('Hotel reactivated');
    refresh();
  };
  const onDelete = async () => {
    try {
      await SuperadminApi.delete(`/platform-api/hotels/${slug}`);
      message.success('Hotel deleted');
      navigate('/superadmin/hotels');
    } catch (err) { message.error(err.response?.data?.error || err.message); }
  };
  const onResendLink = async (email) => {
    try {
      const r = await SuperadminApi.post(`/platform-api/hotels/${slug}/admins/resend`, { email });
      message.success(`Magic link ${r.mail.sent ? 'emailed' : 'created (check backend log)'}`);
      refresh();
    } catch (err) { message.error(err.response?.data?.error || err.message); }
  };
  const onRemoveAdmin = async (userId) => {
    try {
      await SuperadminApi.delete(`/platform-api/hotels/${slug}/admins/${userId}`);
      message.success('Admin removed');
      refresh();
    } catch (err) { message.error(err.response?.data?.error || err.message); }
  };
  const onEdit = async (vals) => {
    try {
      await SuperadminApi.patch(`/platform-api/hotels/${slug}`, vals);
      message.success('Updated');
      setEditOpen(false);
      refresh();
    } catch (err) { message.error(err.response?.data?.error || err.message); }
  };
  const onInvite = async (vals) => {
    try {
      const r = await SuperadminApi.post(`/platform-api/hotels/${slug}/admins`, vals);
      setInviteResult(r);
      refresh();
    } catch (err) { message.error(err.response?.data?.error || err.message); }
  };
  const onCreateBackup = async () => {
    setBackupsLoading(true);
    try {
      await SuperadminApi.post(`/platform-api/hotels/${slug}/backups`);
      message.success('Backup created successfully');
      refresh();
    } catch (err) { message.error(err.response?.data?.error || err.message); }
    setBackupsLoading(false);
  };
  const onRestoreBackup = async (fileName) => {
    setBackupsLoading(true);
    try {
      await SuperadminApi.post(`/platform-api/hotels/${slug}/backups/restore`, { backupFileName: fileName });
      message.success('Database restored successfully');
      refresh();
    } catch (err) { message.error(err.response?.data?.error || err.message); }
    setBackupsLoading(false);
  };

  if (loading || !data) return <SuperadminLayout><div style={{ textAlign: 'center', padding: 60 }}><Spin size='large' /></div></SuperadminLayout>;
  if (error) return <SuperadminLayout><Alert type='error' message={error} showIcon /></SuperadminLayout>;

  const h = data.hotel;
  const isDefault = h.slug === 'default';

  return (
    <SuperadminLayout>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/superadmin/hotels')}>Back to hotels</Button>
      </Space>

      {/* Header */}
      <Card>
        <Row justify='space-between' align='middle'>
          <Col>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {h.name}
              <Tag color={h.status === 'active' ? 'green' : h.status === 'suspended' ? 'red' : 'default'} style={{ marginLeft: 12 }}>{h.status}</Tag>
            </Typography.Title>
            <Typography.Text type='secondary'>
              <code>{h.slug}</code> · DB: <code>{h.dbName}</code> · Plan: <code>{h.billingPlan || 'starter'}</code>
            </Typography.Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Edit</Button>
              {h.status === 'active' ? (
                <Popconfirm title='Suspend this hotel?' description='Public site & API will return 503 until reactivated.' onConfirm={onSuspend}>
                  <Button icon={<PauseCircleOutlined />} danger>Suspend</Button>
                </Popconfirm>
              ) : (
                <Button icon={<PlayCircleOutlined />} type='primary' onClick={onReactivate}>Reactivate</Button>
              )}
              {!isDefault && (
                <Popconfirm
                  title='Delete this hotel?'
                  description={`This drops the entire ${h.dbName} database. CANNOT be undone.`}
                  okText='Delete forever'
                  okButtonProps={{ danger: true }}
                  onConfirm={onDelete}
                >
                  <Button icon={<DeleteOutlined />} danger>Delete</Button>
                </Popconfirm>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}><Card><Statistic title='Rooms' value={data.counts.rooms} /></Card></Col>
        <Col span={6}><Card><Statistic title='Bookings (total)' value={data.counts.bookings} /></Card></Col>
        <Col span={6}><Card><Statistic title='Users in hotel' value={data.counts.users} /></Card></Col>
        <Col span={6}>
          <Card>
            <Statistic title='OTA channels' value={data.counts.channels} />
            {data.syncHealth.errorCount > 0 && (
              <Tag color='red' style={{ marginTop: 4 }}><Badge status='error' /> {data.syncHealth.errorCount} sync errors</Tag>
            )}
          </Card>
        </Col>
      </Row>

      {/* Occupancy */}
      <Card title='Occupancy — next 30 days' style={{ marginTop: 16 }}>
        <Row gutter={16} align='middle'>
          <Col span={6}><Statistic title='Available room-days' value={data.occupancy.next30Days.roomDays} /></Col>
          <Col span={6}><Statistic title='Booked room-days' value={data.occupancy.next30Days.claimedRoomDays} /></Col>
          <Col span={12}>
            <Typography.Text>Occupancy: <strong>{data.occupancy.next30Days.percent}%</strong></Typography.Text>
            <Progress percent={data.occupancy.next30Days.percent} status={data.occupancy.next30Days.percent > 80 ? 'success' : 'active'} />
          </Col>
        </Row>
      </Card>

      {/* Admins */}
      <Card
        title={`Hotel admins (${admins.length})`}
        extra={<Button type='primary' icon={<PlusOutlined />} onClick={() => { setInviteResult(null); setInviteOpen(true); }}>Invite admin</Button>}
        style={{ marginTop: 16 }}
      >
        <Table
          rowKey='_id'
          size='small'
          dataSource={admins}
          pagination={false}
          columns={[
            { title: 'Email', dataIndex: 'email', key: 'email', render: (v) => <><UserOutlined /> {v}</> },
            { title: 'Name', dataIndex: 'fullName', key: 'fullName' },
            {
              title: 'Status',
              key: 'status',
              render: (_, r) => (
                r.mustChangePassword
                  ? <Tag color='orange'>pending password setup</Tag>
                  : <Tag color='green'>active</Tag>
              )
            },
            { title: 'Last login', dataIndex: 'lastLoginAt', key: 'lastLoginAt', render: (v) => v ? new Date(v).toLocaleString() : '—' },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, r) => (
                <Space size='small'>
                  <Button size='small' icon={<MailOutlined />} onClick={() => onResendLink(r.email)}>Resend link</Button>
                  <Popconfirm title={`Remove ${r.email}?`} onConfirm={() => onRemoveAdmin(r._id)}>
                    <Button size='small' danger icon={<DeleteOutlined />}>Remove</Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>

      {/* Recent bookings + sync errors */}
      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title='Recent bookings'>
            <Table
              rowKey='id'
              size='small'
              dataSource={data.recentBookings}
              pagination={false}
              locale={{ emptyText: 'No bookings yet' }}
              columns={[
                { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag>{v}</Tag> },
                { title: 'Dates', dataIndex: 'dates', key: 'dates', render: (d) => Array.isArray(d) ? `${d.length} day${d.length !== 1 ? 's' : ''}` : '—' },
                { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v ? new Date(v).toLocaleString() : '—' }
              ]}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title={(<><Badge status={data.syncHealth.errorCount > 0 ? 'error' : 'success'} /> Sync health</>)}>
            <Statistic title='Recent sync runs' value={data.syncHealth.totalRuns} />
            <div style={{ marginTop: 12 }}>
              {data.syncHealth.recentErrors.length === 0 ? (
                <Typography.Text type='secondary'>No recent sync errors</Typography.Text>
              ) : (
                data.syncHealth.recentErrors.map((e, i) => (
                  <Alert key={i} type='error' showIcon style={{ marginBottom: 4 }} message={(e.errorMessages || []).join('; ') || 'Unknown error'} description={`${new Date(e.startedAt).toLocaleString()}`} />
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Billing placeholder */}
      <Card title='Billing & contract' style={{ marginTop: 16 }}>
        <Descriptions column={2} bordered size='small'>
          <Descriptions.Item label='Plan'>{h.billingPlan || 'starter'}</Descriptions.Item>
          <Descriptions.Item label='Custom domain'>{h.customDomain || '—'}</Descriptions.Item>
          <Descriptions.Item label='Created'>{h.createdAt ? new Date(h.createdAt).toLocaleString() : '—'}</Descriptions.Item>
          <Descriptions.Item label='Suspended'>{h.suspendedAt ? new Date(h.suspendedAt).toLocaleString() : '—'}</Descriptions.Item>
        </Descriptions>
        <Alert type='info' style={{ marginTop: 12 }} message='Invoicing & contract management UI coming next iteration. Manual for now.' showIcon />
      </Card>

      {/* Backups */}
      {!isDefault && (
        <Card
          title={`Database Backups (${backups.length})`}
          extra={(
            <Popconfirm title='Create a new database backup?' onConfirm={onCreateBackup}>
              <Button type='primary' icon={<DatabaseOutlined />} loading={backupsLoading}>Create backup</Button>
            </Popconfirm>
          )}
          style={{ marginTop: 16 }}
        >
          <Table
            rowKey='fileName'
            size='small'
            dataSource={backups}
            pagination={{ pageSize: 5 }}
            loading={backupsLoading}
            locale={{ emptyText: 'No backups found' }}
            columns={[
              { title: 'File Name', dataIndex: 'fileName', key: 'fileName' },
              { title: 'Size', dataIndex: 'sizeBytes', key: 'sizeBytes', render: (v) => `${(v / 1024 / 1024).toFixed(2)} MB` },
              { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', render: (v) => v ? new Date(v).toLocaleString() : '—' },
              {
                title: 'Actions',
                key: 'actions',
                render: (_, r) => (
                  <Popconfirm
                    title='Restore this backup?'
                    description={`Are you sure you want to restore ${h.dbName} to this point in time? Current data will be lost!`}
                    okText='Restore'
                    okButtonProps={{ danger: true }}
                    onConfirm={() => onRestoreBackup(r.fileName)}
                  >
                    <Button size='small' danger icon={<RedoOutlined />}>Restore</Button>
                  </Popconfirm>
                )
              }
            ]}
          />
        </Card>
      )}

      {/* Edit modal */}
      <Modal title='Edit hotel' open={editOpen} onCancel={() => setEditOpen(false)} footer={null} destroyOnClose>
        <Form layout='vertical' initialValues={{ name: h.name, billingPlan: h.billingPlan, contactEmail: h.contact?.email }} onFinish={(v) => onEdit({ name: v.name, billingPlan: v.billingPlan, contact: { ...h.contact, email: v.contactEmail } })}>
          <Form.Item label='Name' name='name' rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label='Billing plan' name='billingPlan'><Input placeholder='starter / pro / enterprise' /></Form.Item>
          <Form.Item label='Contact email' name='contactEmail'><Input /></Form.Item>
          <Form.Item><Button type='primary' htmlType='submit' block>Save</Button></Form.Item>
        </Form>
      </Modal>

      {/* Invite modal */}
      <Modal title='Invite a hotel admin' open={inviteOpen} onCancel={() => setInviteOpen(false)} footer={null} destroyOnClose>
        {inviteResult ? (
          <div>
            <Alert
              type='success'
              showIcon
              message={`Invited ${inviteResult.user.email}`}
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

      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Button icon={<ReloadOutlined />} onClick={refresh}>Refresh</Button>
      </div>
    </SuperadminLayout>
  );
}

export default HotelDetail;
