/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline */
import { ApartmentOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  Button, Empty, Input, Modal, Popconfirm, Result, Select, Skeleton, Space, Table, Tag, Typography, message, Form
} from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

const CONDITIONS = ['Clean', 'Dirty', 'Inspected', 'OutOfService'];
const CONDITION_LABEL = { Clean: 'Clean', Dirty: 'Dirty', Inspected: 'Inspected', OutOfService: 'Out of service' };
const CONDITION_COLOR = { Clean: 'green', Dirty: 'orange', Inspected: 'blue', OutOfService: 'red' };

function CounterChip({ label, value, color }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 10, padding: '10px 16px', minWidth: 130 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#999' }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, color: color || '#2C2C2C' }}>{value}</div>
    </div>
  );
}

function RoomsList() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [selected, setSelected] = useState([]);
  const [edit, setEdit] = useState({ open: false, room: null });
  const [editForm] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [floorModal, setFloorModal] = useState(false);
  const [floorForm] = Form.useForm();
  const [assigning, setAssigning] = useState(false);
  const [attrOptions, setAttrOptions] = useState([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiService.get('/api/v1/all-rooms-list?limit=1000');
      setData(res?.result?.data || null);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.result?.error || err.message);
    } finally { setLoading(false); }
  }, [refreshKey]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    (async () => {
      try {
        const res = await ApiService.get('/api/v1/attributes');
        setAttrOptions((res?.result?.data?.rows || []).map((a) => ({ value: a.id, label: a.name })));
      } catch (e) { /* attributes optional */ }
    })();
  }, []);

  const allRows = data?.rows || [];
  const rows = useMemo(
    () => allRows
      .filter((r) => (conditionFilter === 'all' ? true : r.condition === conditionFilter))
      .filter((r) => (!search ? true : (r.room_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.room_type_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.floor || '').toLowerCase().includes(search.toLowerCase()))),
    [allRows, conditionFilter, search]
  );

  const counts = useMemo(() => ({
    total: allRows.length,
    clean: allRows.filter((r) => r.condition === 'Clean').length,
    dirty: allRows.filter((r) => r.condition === 'Dirty').length,
    oos: allRows.filter((r) => r.condition === 'OutOfService').length
  }), [allRows]);

  const openEdit = (room) => {
    setEdit({ open: true, room });
    editForm.setFieldsValue({
      room_name: room.room_name,
      floor: room.floor,
      condition: room.condition || 'Clean',
      attributes: (room.attributes || []).map((a) => a.id)
    });
  };

  const saveEdit = async () => {
    let vals;
    try { vals = await editForm.validateFields(); } catch (e) { return; }
    try {
      setSaving(true);
      const res = await ApiService.patch(`/api/v1/rooms/${edit.room.id}/settings`, vals);
      if (res?.result_code === 0) {
        notificationWithIcon('success', 'Saved', 'Room updated.');
        setEdit({ open: false, room: null });
        setRefreshKey((k) => k + 1);
      }
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || 'Could not update the room.');
    } finally { setSaving(false); }
  };

  const bulkDelete = async () => {
    try {
      const res = await ApiService.post('/api/v1/rooms/bulk-delete', { roomIds: selected });
      const d = res?.result?.data;
      message.success(`Deleted ${d?.deleted || 0} room(s)${d?.skipped ? `, skipped ${d.skipped} (booked)` : ''}`);
      setSelected([]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      message.error(err?.response?.data?.result?.error || 'Could not delete the selected rooms');
    }
  };

  const doAssignFloor = async () => {
    let vals;
    try { vals = await floorForm.validateFields(); } catch (e) { return; }
    try {
      setAssigning(true);
      const res = await ApiService.post('/api/v1/rooms/assign-floor', { roomIds: selected, floor: vals.floor, prefix: vals.prefix || '' });
      const a = res?.result?.data?.assigned || [];
      message.success(`Numbered ${a.length} room(s) on floor ${vals.floor}`);
      setFloorModal(false);
      setSelected([]);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      message.error(err?.response?.data?.result?.error || 'Could not assign floor');
    } finally {
      setAssigning(false);
    }
  };

  const columns = [
    { title: 'Room #', dataIndex: 'room_name', render: (v) => <strong>{v || <Typography.Text type='secondary'>—</Typography.Text>}</strong> },
    { title: 'Type', dataIndex: 'room_type_name', render: (v) => v || '—' },
    { title: 'Floor', dataIndex: 'floor', render: (v) => v || '—' },
    {
      title: 'Condition',
      dataIndex: 'condition',
      render: (v) => <Tag color={CONDITION_COLOR[v] || 'default'}>{CONDITION_LABEL[v] || v}</Tag>
    },
    {
      title: 'Attributes',
      dataIndex: 'attributes',
      render: (arr) => (arr && arr.length ?
        arr.map((a) => <Tag key={a.id}>{a.name}</Tag>) :
        <Typography.Text type='secondary'>—</Typography.Text>)
    },
    {
      title: '',
      dataIndex: 'id',
      align: 'right',
      width: 90,
      render: (_, r) => <Button size='small' onClick={() => openEdit(r)}>Settings</Button>
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1180, margin: '0 auto' }}>
      <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4 }}>Rooms</Typography.Title>
      <Typography.Text type='secondary'>
        Rooms are created from <strong>Room Types → Add units</strong>. Select rows to delete; click Settings to edit a room.
      </Typography.Text>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <CounterChip label='Total rooms' value={counts.total} />
        <CounterChip label='Clean' value={counts.clean} color='#3F7D58' />
        <CounterChip label='Dirty' value={counts.dirty} color='#B7791F' />
        <CounterChip label='Out of service' value={counts.oos} color='#A4243B' />
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search placeholder='Search room # / type / floor' allowClear style={{ width: 280 }} onChange={(e) => setSearch(e.target.value)} />
        <Select
          value={conditionFilter}
          onChange={setConditionFilter}
          style={{ width: 170 }}
          options={[{ value: 'all', label: 'All conditions' }, ...CONDITIONS.map((c) => ({ value: c, label: CONDITION_LABEL[c] }))]}
        />
        {selected.length > 0 && (
          <Space>
            <Button
              icon={<ApartmentOutlined />}
              onClick={() => { floorForm.resetFields(); setFloorModal(true); }}
            >
              {`Assign floor to ${selected.length}`}
            </Button>
            <Popconfirm
              title={`Delete ${selected.length} room(s)?`}
              description='Rooms with active bookings are skipped.'
              okText='Delete'
              okButtonProps={{ danger: true }}
              onConfirm={bulkDelete}
            >
              <Button danger icon={<DeleteOutlined />}>{`Delete ${selected.length} selected`}</Button>
            </Popconfirm>
          </Space>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        {error ? (
          <Result status='error' title='Failed to fetch' subTitle={error} />
        ) : loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <Table
            rowKey='id'
            columns={columns}
            dataSource={rows}
            pagination={false}
            bordered
            rowSelection={{ selectedRowKeys: selected, onChange: setSelected }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description='No rooms yet. Go to Room Types → Add units to create them.'
                />
              )
            }}
          />
        )}
      </div>

      <Modal
        title={edit.room ? `Room ${edit.room.room_name || ''} settings` : 'Room settings'}
        open={edit.open}
        onCancel={() => setEdit({ open: false, room: null })}
        onOk={saveEdit}
        okText='Save'
        confirmLoading={saving}
        destroyOnClose
      >
        <Form form={editForm} layout='vertical' style={{ marginTop: 12 }}>
          <Space size='large' style={{ display: 'flex' }}>
            <Form.Item name='room_name' label='Room number' style={{ flex: 1 }}>
              <Input placeholder='e.g. 101' />
            </Form.Item>
            <Form.Item name='floor' label='Floor' style={{ flex: 1 }}>
              <Input placeholder='e.g. 1, Ground' />
            </Form.Item>
          </Space>
          <Form.Item name='condition' label='Condition'>
            <Select options={CONDITIONS.map((c) => ({ value: c, label: CONDITION_LABEL[c] }))} />
          </Form.Item>
          <Form.Item name='attributes' label='Attributes'>
            <Select
              mode='multiple'
              allowClear
              placeholder='Add attributes (Balcony, Sea view…)'
              optionFilterProp='label'
              options={attrOptions}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Assign floor to ${selected.length} room(s)`}
        open={floorModal}
        onCancel={() => setFloorModal(false)}
        onOk={doAssignFloor}
        okText='Assign & number'
        confirmLoading={assigning}
        destroyOnClose
      >
        <Form form={floorForm} layout='vertical' style={{ marginTop: 12 }}>
          <Form.Item name='floor' label='Floor' rules={[{ required: true, message: 'Name the floor (e.g. 1, Ground)' }]}>
            <Input placeholder='e.g. 1, Ground, Penthouse' />
          </Form.Item>
          <Form.Item name='prefix' label='Number prefix (optional)' tooltip='For named floors, e.g. "G" → G01'>
            <Input placeholder='(none) or G' />
          </Form.Item>
          <Typography.Text type='secondary'>
            Floor &quot;1&quot; → 100, 101, 102 … · &quot;Ground&quot; + prefix G → G01, G02 …
          </Typography.Text>
        </Form>
      </Modal>
    </div>
  );
}

export default RoomsList;
