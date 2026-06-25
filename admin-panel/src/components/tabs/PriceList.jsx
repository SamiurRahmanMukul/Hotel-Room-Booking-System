/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, max-len */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Tabs, Table, Button, Space, Modal, Form, Input, InputNumber, Select, Checkbox, Spin, Popconfirm, Divider, Row, Col, Radio, Tag, DatePicker, message
} from 'antd';
import {
  LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined, PlusOutlined, EditOutlined, DollarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

const { Title, Text } = Typography;
const WINDOW = 14;
const ISO = 'YYYY-MM-DD';

const SERVICE_TYPES = [
  { value: 'FoodAndBeverages', label: 'Food & Beverages' },
  { value: 'Other', label: 'Other' },
  { value: 'CityTax', label: 'City tax' },
  { value: 'Parking', label: 'Parking' }
];
const WHEN = [
  { value: 'entire_stay', label: 'Entire stay' },
  { value: 'first_night', label: 'First night' },
  { value: 'last_night', label: 'Last night' }
];
const OFFERED = [
  { value: 'everyday', label: 'Everyday' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekends', label: 'Weekends' }
];
const REF = [
  { value: 'before_arrival', label: 'Before arrival' },
  { value: 'after_booking', label: 'After booking' }
];
const VAT_TYPES = ['Without', 'Normal', 'Reduced'];
const POLICY_TYPES = [
  { value: 'cancellation', label: 'Cancellation' },
  { value: 'noshow', label: 'No-show' }
];
const labelOf = (arr, v) => (arr.find((x) => x.value === v)?.label || v);

/* ---------------- Prices grid ---------------- */
function PricesGrid() {
  const [from, setFrom] = useState(() => dayjs().startOf('day'));
  const [grid, setGrid] = useState({ roomTypes: [], prices: {} });
  const [edits, setEdits] = useState({});
  const [defaultEdits, setDefaultEdits] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulk, setBulk] = useState({ open: false });
  const [bulkForm] = Form.useForm();
  const [bulkSaving, setBulkSaving] = useState(false);

  const days = useMemo(() => Array.from({ length: WINDOW }).map((_, i) => from.add(i, 'day')), [from]);

  const fetchGrid = async (start) => {
    try {
      setLoading(true);
      const to = start.add(WINDOW, 'day');
      const res = await ApiService.get(`/api/v1/prices?from=${start.format(ISO)}&to=${to.format(ISO)}`);
      setGrid({ roomTypes: res?.result?.data?.roomTypes || [], prices: res?.result?.data?.prices || {} });
      setEdits({});
      setDefaultEdits({});
    } catch (err) {
      notificationWithIcon('error', 'Error', 'Could not load prices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGrid(from); }, [from]);

  const keyFor = (typeId, d) => `${typeId}_${d.format(ISO)}`;
  const cellValue = (typeId, d) => {
    const k = keyFor(typeId, d);
    if (edits[k] !== undefined) return edits[k];
    return grid.prices[k] !== undefined ? grid.prices[k] : null;
  };
  const setCell = (typeId, d, v) => setEdits((e) => ({ ...e, [keyFor(typeId, d)]: (v === null || v === undefined ? '' : v) }));

  const save = async () => {
    const updates = Object.entries(edits).map(([k, amount]) => {
      const idx = k.lastIndexOf('_');
      return { roomTypeId: k.slice(0, idx), date: k.slice(idx + 1), amount };
    });
    const defaults = Object.entries(defaultEdits).map(([roomTypeId, basePrice]) => ({ roomTypeId, basePrice }));
    if (!updates.length && !defaults.length) { message.info('No changes to save'); return; }
    try {
      setSaving(true);
      await ApiService.post('/api/v1/prices', { updates, defaults });
      message.success('Prices saved');
      await fetchGrid(from);
    } catch (err) {
      message.error(err?.response?.data?.result?.error || 'Could not save prices');
    } finally {
      setSaving(false);
    }
  };

  const applyBulk = async () => {
    let v;
    try { v = await bulkForm.validateFields(); } catch (e) { return; }
    const ids = v.roomTypeIds && v.roomTypeIds.length ? v.roomTypeIds : grid.roomTypes.map((r) => r.id);
    const start = v.from.startOf('day');
    const end = v.to.startOf('day');
    if (end.isBefore(start)) { message.error('End date must be on or after the start'); return; }
    const dates = [];
    let cur = start;
    while (!cur.isAfter(end)) { dates.push(cur.format(ISO)); cur = cur.add(1, 'day'); }
    const updates = [];
    const amt = (v.amount === null || v.amount === undefined ? '' : v.amount);
    ids.forEach((rid) => dates.forEach((d) => updates.push({ roomTypeId: rid, date: d, amount: amt })));
    try {
      setBulkSaving(true);
      await ApiService.post('/api/v1/prices', { updates });
      message.success(`${amt === '' ? 'Cleared' : 'Set'} ${updates.length} night(s)`);
      setBulk({ open: false });
      await fetchGrid(from);
    } catch (err) {
      message.error('Could not apply bulk prices');
    } finally {
      setBulkSaving(false);
    }
  };

  const columns = [
    {
      title: 'Room type',
      dataIndex: 'name',
      fixed: 'left',
      width: 190,
      render: (name, rt) => (
        <div>
          <strong>{name}</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span style={{ fontSize: 11, color: '#999' }}>default €</span>
            <InputNumber
              size='small'
              min={0}
              controls={false}
              style={{ width: 72 }}
              value={defaultEdits[rt.id] !== undefined ? defaultEdits[rt.id] : rt.basePrice}
              onChange={(v) => setDefaultEdits((e) => ({ ...e, [rt.id]: (v === null || v === undefined ? 0 : v) }))}
            />
          </div>
        </div>
      )
    },
    ...days.map((d) => ({
      title: (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 700 }}>{d.format('D')}</div>
          <div style={{ fontSize: 11, color: '#999' }}>{d.format('ddd')}</div>
        </div>
      ),
      width: 84,
      render: (_, rt) => (
        <InputNumber size='small' min={0} controls={false} style={{ width: 70 }} value={cellValue(rt.id, d)} placeholder={String(defaultEdits[rt.id] !== undefined ? defaultEdits[rt.id] : rt.basePrice)} onChange={(v) => setCell(rt.id, d, v)} />
      )
    }))
  ];

  const editCount = Object.keys(edits).length + Object.keys(defaultEdits).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
        <Space>
          <Button icon={<DoubleLeftOutlined />} onClick={() => setFrom((s) => s.subtract(WINDOW, 'day'))} />
          <Button icon={<LeftOutlined />} onClick={() => setFrom((s) => s.subtract(1, 'day'))} />
          <Text strong>{`${from.format('MMM D')} – ${from.add(WINDOW - 1, 'day').format('MMM D, YYYY')}`}</Text>
          <Button icon={<RightOutlined />} onClick={() => setFrom((s) => s.add(1, 'day'))} />
          <Button icon={<DoubleRightOutlined />} onClick={() => setFrom((s) => s.add(WINDOW, 'day'))} />
          <Button onClick={() => setFrom(dayjs().startOf('day'))}>Today</Button>
        </Space>
        <Space>
          <Button onClick={() => { bulkForm.setFieldsValue({ roomTypeIds: [], from, to: from.add(6, 'day'), amount: null }); setBulk({ open: true }); }}>
            Set price range
          </Button>
          <Button type='primary' loading={saving} disabled={!editCount} onClick={save}>
            {editCount ? `Save ${editCount} change(s)` : 'Save'}
          </Button>
        </Space>
      </div>
      <Text type='secondary'>Edit each type&apos;s <strong>default</strong> price (the fallback) on the left, or override a specific night in a cell. Use <strong>Set price range</strong> to fill many nights at once.</Text>
      <div style={{ marginTop: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size='large' /></div>
        ) : grid.roomTypes.length === 0 ? (
          <Text type='secondary'>No room types yet — create some under Room Types first.</Text>
        ) : (
          <Table rowKey='id' columns={columns} dataSource={grid.roomTypes} pagination={false} bordered scroll={{ x: 'max-content' }} size='small' />
        )}
      </div>

      <Modal
        title='Set price for a date range'
        open={bulk.open}
        onCancel={() => setBulk({ open: false })}
        onOk={applyBulk}
        okText='Apply'
        confirmLoading={bulkSaving}
        destroyOnClose
      >
        <Form form={bulkForm} layout='vertical' style={{ marginTop: 12 }}>
          <Form.Item name='roomTypeIds' label='Room types' tooltip='Leave empty to apply to all'>
            <Select mode='multiple' allowClear placeholder='All room types' options={grid.roomTypes.map((r) => ({ value: r.id, label: r.name }))} />
          </Form.Item>
          <Space size='large' style={{ display: 'flex' }}>
            <Form.Item name='from' label='From' rules={[{ required: true }]} style={{ flex: 1 }}><DatePicker style={{ width: '100%' }} format='D MMM YYYY' /></Form.Item>
            <Form.Item name='to' label='To' rules={[{ required: true }]} style={{ flex: 1 }}><DatePicker style={{ width: '100%' }} format='D MMM YYYY' /></Form.Item>
          </Space>
          <Form.Item name='amount' label='Nightly price (€)' tooltip='Leave empty to clear overrides in the range (fall back to default)'>
            <InputNumber min={0} style={{ width: '100%' }} placeholder='e.g. 120' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

/* ---------------- Services ---------------- */
function ServicesTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState({ open: false, editing: null });
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await ApiService.get('/api/v1/services');
      setRows(res?.result?.data?.rows || []);
    } catch (err) {
      notificationWithIcon('error', 'Error', 'Could not load services.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchList(); }, []);

  const blank = {
    name: '',
    description: '',
    translations: { bg: { name: '', description: '' } },
    code: '',
    serviceType: 'Other',
    pricingMode: 'per_guest',
    price: 0,
    vatPct: 19,
    availability: { when: 'entire_stay', offeredDays: 'everyday', nextDay: false }
  };
  const openAdd = () => { setModal({ open: true, editing: null }); form.setFieldsValue(blank); };
  const openEdit = (r) => {
    setModal({ open: true, editing: r });
    form.setFieldsValue({
      name: r.name,
      description: r.description || '',
      translations: { bg: { name: r.translations?.bg?.name || '', description: r.translations?.bg?.description || '' } },
      code: r.code,
      serviceType: r.serviceType,
      pricingMode: r.pricingMode || 'per_guest',
      price: r.price,
      vatPct: r.vatPct,
      availability: { when: r.availability?.when || 'entire_stay', offeredDays: r.availability?.offeredDays || 'everyday', nextDay: !!r.availability?.nextDay }
    });
  };

  const submit = async () => {
    let v;
    try { v = await form.validateFields(); } catch (e) { return; }
    try {
      setSubmitting(true);
      const { editing } = modal;
      const res = editing ?
        await ApiService.patch(`/api/v1/services/${editing.id}`, v) :
        await ApiService.post('/api/v1/services', v);
      if (res?.result_code === 0) {
        notificationWithIcon('success', editing ? 'Updated' : 'Created', `Service ${editing ? 'updated' : 'created'}.`);
        setModal({ open: false, editing: null });
        await fetchList();
      }
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || 'Could not save the service.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    const { editing } = modal;
    if (!editing) return;
    try {
      const res = await ApiService.delete(`/api/v1/services/${editing.id}`);
      if (res?.result_code === 0) {
        notificationWithIcon('success', 'Deleted', `"${editing.name}" removed.`);
        setModal({ open: false, editing: null });
        await fetchList();
      }
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || 'Could not delete the service.');
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', render: (v, r) => <span><strong>{v}</strong>{r.code ? <Text type='secondary'>{`  ${r.code}`}</Text> : null}</span> },
    { title: 'Type', dataIndex: 'serviceType', render: (v) => labelOf(SERVICE_TYPES, v) },
    { title: 'Price', dataIndex: 'price', render: (v, r) => `€${v} ${r.pricingMode === 'per_room' ? '/ room' : '/ guest'}` },
    { title: 'Offered', dataIndex: 'availability', render: (a) => labelOf(WHEN, a?.when) },
    { title: 'VAT', dataIndex: 'vatPct', render: (v) => `${v}%` },
    { title: '', width: 90, align: 'right', render: (_, r) => <Button size='small' icon={<EditOutlined />} onClick={() => openEdit(r)}>Edit</Button> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>New service</Button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size='large' /></div> :
      <Table rowKey='id' columns={columns} dataSource={rows} pagination={false} bordered />}

      <Modal
        title={modal.editing ? `Edit — ${modal.editing.name}` : 'Create new service'}
        open={modal.open}
        onCancel={() => setModal({ open: false, editing: null })}
        confirmLoading={submitting}
        destroyOnClose
        width={720}
        footer={[
          modal.editing ? (
            <Popconfirm key='del' title='Delete this service?' okText='Delete' okButtonProps={{ danger: true }} onConfirm={remove}>
              <Button danger style={{ float: 'left' }}>Delete</Button>
            </Popconfirm>
          ) : null,
          <Button key='cancel' onClick={() => setModal({ open: false, editing: null })}>Cancel</Button>,
          <Button key='ok' type='primary' loading={submitting} onClick={submit}>Save</Button>
        ]}
      >
        <Form form={form} layout='vertical' style={{ marginTop: 8 }} initialValues={blank}>
          <Space size='large' style={{ display: 'flex' }}>
            <Form.Item name='code' label='Service code' style={{ flex: 1 }}><Input placeholder='BRKF' /></Form.Item>
            <Form.Item name='serviceType' label='Service type' style={{ flex: 1 }}><Select options={SERVICE_TYPES} /></Form.Item>
          </Space>

          <Divider orientation='left'>Translations</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 14 }}>
                <Text strong>English</Text>
                <Form.Item name='name' label='Name' rules={[{ required: true, message: 'English name is required' }]} style={{ marginTop: 8 }}><Input placeholder='e.g. Breakfast' /></Form.Item>
                <Form.Item name='description' label='Description' style={{ marginBottom: 0 }}><Input.TextArea rows={2} /></Form.Item>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 14 }}>
                <Text strong>Bulgarian</Text>
                <Form.Item name={['translations', 'bg', 'name']} label='Name (BG)' style={{ marginTop: 8 }}><Input placeholder='напр. Закуска' /></Form.Item>
                <Form.Item name={['translations', 'bg', 'description']} label='Description (BG)' style={{ marginBottom: 0 }}><Input.TextArea rows={2} /></Form.Item>
              </div>
            </Col>
          </Row>

          <Divider orientation='left'>Availability</Divider>
          <Space size='large' style={{ display: 'flex' }}>
            <Form.Item name={['availability', 'when']} label='When' style={{ flex: 1 }}><Select options={WHEN} /></Form.Item>
            <Form.Item name={['availability', 'offeredDays']} label='Offered days' style={{ flex: 1 }}><Select options={OFFERED} /></Form.Item>
          </Space>
          <Form.Item name={['availability', 'nextDay']} valuePropName='checked'><Checkbox>Delivered and posted on the next day</Checkbox></Form.Item>

          <Divider orientation='left'>Pricing</Divider>
          <Form.Item name='pricingMode'><Radio.Group options={[{ value: 'per_room', label: 'Per room' }, { value: 'per_guest', label: 'Per guest' }]} /></Form.Item>
          <Space size='large' style={{ display: 'flex' }}>
            <Form.Item name='price' label='Default price' style={{ flex: 1 }}><InputNumber min={0} prefix='€' style={{ width: '100%' }} /></Form.Item>
            <Form.Item name='vatPct' label='VAT %' style={{ flex: 1 }}><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}

/* ---------------- Policies ---------------- */
function periodLabel(p) {
  if (!p) return '—';
  const parts = [];
  if (p.months) parts.push(`${p.months}mo`);
  if (p.days) parts.push(`${p.days}d`);
  if (p.hours) parts.push(`${p.hours}h`);
  const dur = parts.length ? parts.join(' ') : 'immediately';
  return `${dur} ${labelOf(REF, p.reference).toLowerCase()}`;
}
function feeLabel(f) {
  if (!f) return '—';
  const bits = [];
  if (f.percent != null) bits.push(`${f.percent}%`);
  if (f.fixed != null) bits.push(`€${f.fixed}`);
  return bits.length ? bits.join(' + ') : '—';
}

function PoliciesTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  const [modal, setModal] = useState({ open: false, editing: null });
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await ApiService.get('/api/v1/policies');
      setRows(res?.result?.data?.rows || []);
    } catch (err) {
      notificationWithIcon('error', 'Error', 'Could not load policies.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchList(); }, []);

  const blank = {
    type: 'cancellation',
    code: '',
    name: '',
    description: '',
    translations: { bg: { name: '', description: '' } },
    period: { months: 0, days: 0, hours: 0, reference: 'before_arrival' },
    fee: { fixed: null, percent: null },
    vatType: 'Without'
  };
  const openAdd = () => { setModal({ open: true, editing: null }); form.setFieldsValue(blank); };
  const openEdit = (r) => {
    setModal({ open: true, editing: r });
    form.setFieldsValue({
      type: r.type,
      code: r.code,
      name: r.name,
      description: r.description || '',
      translations: { bg: { name: r.translations?.bg?.name || '', description: r.translations?.bg?.description || '' } },
      period: { months: r.period?.months || 0, days: r.period?.days || 0, hours: r.period?.hours || 0, reference: r.period?.reference || 'before_arrival' },
      fee: { fixed: r.fee?.fixed ?? null, percent: r.fee?.percent ?? null },
      vatType: r.vatType || 'Without'
    });
  };

  const submit = async () => {
    let v;
    try { v = await form.validateFields(); } catch (e) { return; }
    try {
      setSubmitting(true);
      const { editing } = modal;
      const res = editing ?
        await ApiService.patch(`/api/v1/policies/${editing.id}`, v) :
        await ApiService.post('/api/v1/policies', v);
      if (res?.result_code === 0) {
        notificationWithIcon('success', editing ? 'Updated' : 'Created', `Policy ${editing ? 'updated' : 'created'}.`);
        setModal({ open: false, editing: null });
        await fetchList();
      }
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || 'Could not save the policy.');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    const { editing } = modal;
    if (!editing) return;
    try {
      const res = await ApiService.delete(`/api/v1/policies/${editing.id}`);
      if (res?.result_code === 0) {
        notificationWithIcon('success', 'Deleted', `"${editing.name}" removed.`);
        setModal({ open: false, editing: null });
        await fetchList();
      }
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.result?.error || 'Could not delete the policy.');
    }
  };

  const filtered = typeFilter === 'all' ? rows : rows.filter((r) => r.type === typeFilter);
  const isCancellation = Form.useWatch('type', form) === 'cancellation';

  const columns = [
    { title: 'Name', dataIndex: 'name', render: (v, r) => <span><strong>{v}</strong>{r.code ? <Text type='secondary'>{`  ${r.code}`}</Text> : null}</span> },
    { title: 'Type', dataIndex: 'type', render: (v) => <Tag>{labelOf(POLICY_TYPES, v)}</Tag> },
    { title: 'Free until', dataIndex: 'period', render: (p, r) => (r.type === 'cancellation' ? periodLabel(p) : '—') },
    { title: 'Fee', dataIndex: 'fee', render: (f) => feeLabel(f) },
    { title: 'VAT', dataIndex: 'vatType' },
    { title: '', width: 90, align: 'right', render: (_, r) => <Button size='small' icon={<EditOutlined />} onClick={() => openEdit(r)}>Edit</Button> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Select
          value={typeFilter}
          onChange={setTypeFilter}
          style={{ width: 180 }}
          options={[{ value: 'all', label: 'All policies' }, ...POLICY_TYPES]}
        />
        <Button type='primary' icon={<PlusOutlined />} onClick={openAdd}>New policy</Button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><Spin size='large' /></div> :
      <Table rowKey='id' columns={columns} dataSource={filtered} pagination={false} bordered />}

      <Modal
        title={modal.editing ? `Edit — ${modal.editing.name}` : 'Create new policy'}
        open={modal.open}
        onCancel={() => setModal({ open: false, editing: null })}
        confirmLoading={submitting}
        destroyOnClose
        width={720}
        footer={[
          modal.editing ? (
            <Popconfirm key='del' title='Delete this policy?' okText='Delete' okButtonProps={{ danger: true }} onConfirm={remove}>
              <Button danger style={{ float: 'left' }}>Delete</Button>
            </Popconfirm>
          ) : null,
          <Button key='cancel' onClick={() => setModal({ open: false, editing: null })}>Cancel</Button>,
          <Button key='ok' type='primary' loading={submitting} onClick={submit}>Save</Button>
        ]}
      >
        <Form form={form} layout='vertical' style={{ marginTop: 8 }} initialValues={blank}>
          <Space size='large' style={{ display: 'flex' }}>
            <Form.Item name='type' label='Policy type' style={{ flex: 1 }}>
              <Select options={POLICY_TYPES} disabled={!!modal.editing} />
            </Form.Item>
            <Form.Item name='code' label='Code' style={{ flex: 1 }}><Input placeholder='NONREF' /></Form.Item>
          </Space>

          <Divider orientation='left'>Translations</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 14 }}>
                <Text strong>English</Text>
                <Form.Item name='name' label='Name' rules={[{ required: true, message: 'English name is required' }]} style={{ marginTop: 8 }}><Input placeholder='e.g. Non Refundable' /></Form.Item>
                <Form.Item name='description' label='Description' style={{ marginBottom: 0 }}><Input.TextArea rows={2} placeholder='No free cancellation' /></Form.Item>
              </div>
            </Col>
            <Col xs={24} md={12}>
              <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 14 }}>
                <Text strong>Bulgarian</Text>
                <Form.Item name={['translations', 'bg', 'name']} label='Name (BG)' style={{ marginTop: 8 }}><Input /></Form.Item>
                <Form.Item name={['translations', 'bg', 'description']} label='Description (BG)' style={{ marginBottom: 0 }}><Input.TextArea rows={2} /></Form.Item>
              </div>
            </Col>
          </Row>

          {isCancellation && (
            <>
              <Divider orientation='left'>Cancellation period</Divider>
              <Text type='secondary'>Free cancellation until this point.</Text>
              <Row gutter={12} style={{ marginTop: 8 }}>
                <Col span={6}><Form.Item name={['period', 'months']} label='Months'><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name={['period', 'days']} label='Days'><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name={['period', 'hours']} label='Hours'><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col span={6}><Form.Item name={['period', 'reference']} label='Reference point'><Select options={REF} /></Form.Item></Col>
              </Row>
            </>
          )}

          <Divider orientation='left'>Amount (fee)</Divider>
          <Text type='secondary'>Set a fixed fee, a percent fee, or both.</Text>
          <Row gutter={12} style={{ marginTop: 8 }}>
            <Col span={8}><Form.Item name={['fee', 'fixed']} label='Fixed fee (€)'><InputNumber min={0} style={{ width: '100%' }} placeholder='—' /></Form.Item></Col>
            <Col span={8}><Form.Item name={['fee', 'percent']} label='Percent fee (%)'><InputNumber min={0} max={100} style={{ width: '100%' }} placeholder='—' /></Form.Item></Col>
            <Col span={8}><Form.Item name='vatType' label='VAT type'><Select options={VAT_TYPES.map((x) => ({ value: x, label: x }))} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}

function PriceList() {
  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '80vh' }}>
      <Title level={2} style={{ marginTop: 0 }}>
        <DollarOutlined style={{ marginRight: 10 }} />
        Price list
      </Title>
      <Tabs
        defaultActiveKey='prices'
        items={[
          { key: 'prices', label: 'Prices', children: <PricesGrid /> },
          { key: 'services', label: 'Services', children: <ServicesTab /> },
          { key: 'policies', label: 'Policies', children: <PoliciesTab /> }
        ]}
      />
    </div>
  );
}

export default PriceList;
