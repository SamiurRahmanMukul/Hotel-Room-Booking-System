/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline */
import { Alert, Card, Col, Row, Spin, Statistic, Table, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import SuperadminLayout from '../../components/SuperadminLayout';
import SuperadminApi from '../../utils/superadminApi';

function SuperadminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    SuperadminApi.get('/platform-api/dashboard')
      .then((r) => setData(r))
      .catch((err) => {
        setError(err.response?.data?.error || err.message);
      });
  }, []);

  if (error) return <SuperadminLayout><Alert type='error' message={error} showIcon /></SuperadminLayout>;
  if (!data) return <SuperadminLayout><div style={{ textAlign: 'center', padding: 60 }}><Spin size='large' /></div></SuperadminLayout>;

  const cardStyle = { background: '#fff' };

  return (
    <SuperadminLayout>
      <Typography.Title level={4} style={{ marginTop: 0 }}>Platform overview</Typography.Title>

      <Row gutter={16}>
        <Col span={6}><Card style={cardStyle}><Statistic title='Hotels' value={data.hotels.total} /></Card></Col>
        <Col span={6}>
          <Card style={cardStyle}>
            <Statistic title='Active' value={data.hotels.active} valueStyle={{ color: '#3f8600' }} />
            <div style={{ marginTop: 4 }}>
              {data.hotels.draft > 0 && <Tag>{data.hotels.draft} draft</Tag>}
              {data.hotels.suspended > 0 && <Tag color='red'>{data.hotels.suspended} suspended</Tag>}
            </div>
          </Card>
        </Col>
        <Col span={6}><Card style={cardStyle}><Statistic title='Total bookings' value={data.totals.bookings} /></Card></Col>
        <Col span={6}><Card style={cardStyle}><Statistic title='Active OTA channels' value={data.totals.channels} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={8}><Card style={cardStyle}><Statistic title='Total rooms across all hotels' value={data.totals.rooms} /></Card></Col>
        <Col span={8}><Card style={cardStyle}><Statistic title='Total users across all hotels' value={data.totals.users} /></Card></Col>
        <Col span={8}>
          <Card style={cardStyle}>
            <Statistic
              title='Avg bookings per active hotel'
              value={data.hotels.active ? (data.totals.bookings / data.hotels.active).toFixed(1) : 0}
            />
          </Card>
        </Col>
      </Row>

      <Card title='Per hotel' style={{ marginTop: 16 }}>
        <Table
          rowKey='slug'
          size='small'
          dataSource={data.perHotel}
          pagination={false}
          columns={[
            { title: 'Hotel', dataIndex: 'name', key: 'name', render: (v) => <strong>{v}</strong> },
            { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (v) => <code>{v}</code> },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (v) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag> },
            { title: 'Rooms', dataIndex: 'rooms', key: 'rooms', align: 'right' },
            { title: 'Users', dataIndex: 'users', key: 'users', align: 'right' },
            { title: 'Bookings', dataIndex: 'bookings', key: 'bookings', align: 'right' },
            { title: 'Channels', dataIndex: 'channels', key: 'channels', align: 'right' },
            { title: 'Error', dataIndex: 'error', key: 'error', render: (v) => v && <Tag color='red'>{v}</Tag> }
          ]}
        />
      </Card>
    </SuperadminLayout>
  );
}

export default SuperadminDashboard;
