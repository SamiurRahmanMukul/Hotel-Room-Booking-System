/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, object-property-newline, operator-linebreak, jsx-quotes, no-confusing-arrow, no-underscore-dangle, react/no-unstable-nested-components, function-paren-newline, react/jsx-curly-newline, react/jsx-first-prop-new-line, react/jsx-max-props-per-line */
import {
  EnvironmentOutlined, FileTextOutlined, PictureOutlined, SafetyOutlined, TagOutlined
} from '@ant-design/icons';
import {
  Alert, Button, Card, Checkbox, Col, Form, Input, InputNumber, Row, Select, Space, TimePicker, Typography, message
} from 'antd';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import React, { useCallback, useEffect, useState } from 'react';
import ApiService from '../../utils/apiService';
import { COUNTRY_OPTIONS, findCountry } from '../../utils/countries';

dayjs.extend(customParseFormat);

const AMENITY_LIST = [
  'Wifi', 'Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Parking', 'Airport shuttle',
  'Pet friendly', 'Family rooms', 'Air conditioning', 'Heating', 'Elevator',
  'Wheelchair accessible', '24h reception', 'Concierge', 'Laundry', 'Room service',
  'Beach access', 'Business center', 'Conference rooms', 'Garden', 'Terrace',
  'BBQ area', 'Bicycle hire', 'Car hire', 'EV charging', 'Currency exchange',
  'Safe deposit boxes', 'Non-smoking'
];

const PAYMENT_METHODS = [
  { value: 'card', label: 'Credit / debit card' },
  { value: 'cash', label: 'Cash' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'apple_pay', label: 'Apple Pay' },
  { value: 'google_pay', label: 'Google Pay' },
  { value: 'paypal', label: 'PayPal' }
];

const LANGUAGES = ['English', 'Bulgarian', 'German', 'French', 'Italian', 'Spanish', 'Russian', 'Greek', 'Turkish', 'Romanian'];

function asTime(v) { return v ? dayjs(v, 'HH:mm') : null; }
function fmtTime(v) { return v ? dayjs(v).format('HH:mm') : null; }

function HotelSettings() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [basicsForm] = Form.useForm();
  const [propertyForm] = Form.useForm();
  const [policiesForm] = Form.useForm();

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m] = await Promise.all([
        ApiService.get('/api/v1/hotel-settings'),
        ApiService.get('/api/v1/me')
      ]);
      setData(s);
      basicsForm.setFieldsValue({
        name: s?.name || m?.hotel?.name,
        country: s?.contact?.country,
        city: s?.contact?.city,
        timezone: s?.contact?.timezone,
        currency: s?.contact?.currency,
        contactEmail: s?.contact?.email,
        contactPhone: s?.contact?.phone,
        addressLine1: s?.contact?.addressLine1,
        addressLine2: s?.contact?.addressLine2,
        postalCode: s?.contact?.postalCode
      });
      propertyForm.setFieldsValue({
        description: s?.description,
        amenities: s?.amenities || [],
        languages: s?.languages || [],
        floors: s?.floors,
        yearBuilt: s?.yearBuilt
      });
      policiesForm.setFieldsValue({
        checkInTime: asTime(s?.policies?.checkInTime || '15:00'),
        checkOutTime: asTime(s?.policies?.checkOutTime || '11:00'),
        cancellationHours: s?.policies?.cancellationHours ?? 24,
        childrenAllowed: s?.policies?.childrenAllowed ?? true,
        petsAllowed: s?.policies?.petsAllowed ?? false,
        smokingAllowed: s?.policies?.smokingAllowed ?? false,
        paymentMethods: s?.policies?.paymentMethods || ['card'],
        houseRules: s?.policies?.houseRules,
        taxRate: s?.taxRate ?? 0,
        serviceFeePct: s?.serviceFeePct ?? 0
      });
    } catch (err) {
      message.error('Could not load hotel settings');
    } finally { setLoading(false); }
  }, [basicsForm, propertyForm, policiesForm]);

  useEffect(() => { refresh(); }, [refresh]);

  const onCountryChange = (code) => {
    const c = findCountry(code);
    if (c) basicsForm.setFieldsValue({ currency: c.currency, timezone: c.timezone });
  };

  const save = async (patch) => {
    setSaving(true);
    try {
      await ApiService.patch('/api/v1/hotel-settings', patch);
      message.success('Saved');
      refresh();
    } catch (err) {
      message.error(err?.response?.data?.error || err?.message || 'Could not save');
    } finally { setSaving(false); }
  };

  const onSaveBasics = (v) => save({
    name: v.name,
    contact: {
      email: v.contactEmail, phone: v.contactPhone,
      addressLine1: v.addressLine1, addressLine2: v.addressLine2,
      postalCode: v.postalCode, city: v.city, country: v.country,
      timezone: v.timezone, currency: v.currency
    }
  });

  const onSaveProperty = (v) => save({
    description: v.description,
    amenities: v.amenities,
    languages: v.languages,
    floors: v.floors,
    yearBuilt: v.yearBuilt
  });

  const onSavePolicies = (v) => save({
    policies: {
      checkInTime: fmtTime(v.checkInTime),
      checkOutTime: fmtTime(v.checkOutTime),
      cancellationHours: v.cancellationHours,
      childrenAllowed: v.childrenAllowed,
      petsAllowed: v.petsAllowed,
      smokingAllowed: v.smokingAllowed,
      paymentMethods: v.paymentMethods,
      houseRules: v.houseRules
    },
    taxRate: v.taxRate,
    serviceFeePct: v.serviceFeePct
  });

  // Render even with empty settings doc — page should let user *create* basics from scratch.
  if (loading) return <div style={{ padding: 24 }}><Card loading /></div>;

  const items = [
    {
      key: 'basics',
      label: <Space><EnvironmentOutlined /> Basics & address</Space>,
      children: (
        <Form form={basicsForm} layout='vertical' onFinish={onSaveBasics}>
          <Form.Item label='Hotel name' name='name' rules={[{ required: true }]}><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item label='Address line 1' name='addressLine1' rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label='Postal code' name='postalCode'><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item label='Address line 2' name='addressLine2'><Input /></Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label='City' name='city' rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Country' name='country' rules={[{ required: true }]}>
                <Select showSearch optionFilterProp='label' options={COUNTRY_OPTIONS} onChange={onCountryChange} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}><Form.Item label='Currency' name='currency'><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label='Timezone' name='timezone'><Input /></Form.Item></Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label='Contact email' name='contactEmail'><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Contact phone' name='contactPhone'><Input /></Form.Item>
            </Col>
          </Row>
          <Button type='primary' htmlType='submit' loading={saving}>Save basics</Button>
        </Form>
      )
    },
    {
      key: 'property',
      label: <Space><FileTextOutlined /> Property details</Space>,
      children: (
        <Form form={propertyForm} layout='vertical' onFinish={onSaveProperty}>
          <Form.Item label='Description' name='description' extra='Shown to guests on the booking site'>
            <Input.TextArea rows={4} maxLength={2000} showCount />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label='Floors' name='floors'><InputNumber min={1} max={200} style={{ width: '100%' }} /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Year built' name='yearBuilt'><InputNumber min={1800} max={new Date().getFullYear()} style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
          <Form.Item label='Amenities' name='amenities'>
            <Checkbox.Group
              options={AMENITY_LIST.map((a) => ({ label: a, value: a }))}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}
            />
          </Form.Item>
          <Form.Item label='Languages spoken at reception' name='languages'>
            <Select mode='multiple' options={LANGUAGES.map((l) => ({ label: l, value: l }))} />
          </Form.Item>
          <Button type='primary' htmlType='submit' loading={saving}>Save property details</Button>
        </Form>
      )
    },
    {
      key: 'photos',
      label: <Space><PictureOutlined /> Property photos</Space>,
      children: (
        <Alert
          type='info'
          showIcon
          message='Photo upload coming next iteration.'
          description='For now, photos can be added via Hotel Rooms (each room has its own photo grid). A property-level photo gallery editor will live here.'
        />
      )
    },
    {
      key: 'policies',
      label: <Space><SafetyOutlined /> Policies & taxes</Space>,
      children: (
        <Form form={policiesForm} layout='vertical' onFinish={onSavePolicies}>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item label='Check-in time' name='checkInTime' rules={[{ required: true }]}>
                <TimePicker format='HH:mm' style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label='Check-out time' name='checkOutTime' rules={[{ required: true }]}>
                <TimePicker format='HH:mm' style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label='Free cancellation (hours)' name='cancellationHours'>
                <InputNumber min={0} max={720} style={{ width: '100%' }} addonAfter='hours' />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name='childrenAllowed' valuePropName='checked'>
                <Checkbox>Children allowed</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name='petsAllowed' valuePropName='checked'>
                <Checkbox>Pets allowed</Checkbox>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name='smokingAllowed' valuePropName='checked'>
                <Checkbox>Smoking allowed</Checkbox>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label='Accepted payment methods' name='paymentMethods'>
            <Checkbox.Group options={PAYMENT_METHODS} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label='Tax rate (%)' name='taxRate'>
                <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} addonAfter='%' />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label='Service fee (%)' name='serviceFeePct'>
                <InputNumber min={0} max={100} step={0.1} style={{ width: '100%' }} addonAfter='%' />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label='House rules / terms (optional)' name='houseRules'>
            <Input.TextArea rows={4} maxLength={4000} showCount />
          </Form.Item>
          <Button type='primary' htmlType='submit' loading={saving}>Save policies</Button>
        </Form>
      )
    },
    {
      key: 'branding',
      label: <Space><TagOutlined /> Branding</Space>,
      children: (
        <Alert
          type='info'
          showIcon
          message='Branding is set by the platform team.'
          description={(
            <div>
              <div><strong>Logo:</strong> <code>{data?.branding?.logoUrl || '—'}</code></div>
              <div><strong>Primary color:</strong> <code>{data?.branding?.primaryColor || '—'}</code></div>
              <div><strong>Tagline:</strong> {data?.branding?.tagline || '—'}</div>
              <div style={{ marginTop: 8, color: '#6B6B6B', fontSize: 12 }}>
                Contact your platform contact to update logo, colors, or hero image.
              </div>
            </div>
          )}
        />
      )
    }
  ];

  return (
    <div style={{ padding: 24, maxWidth: 920, margin: '0 auto' }}>
      <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, fontWeight: 600, letterSpacing: '-0.02em' }}>
        Hotel settings
      </Typography.Title>
      <Typography.Text type='secondary'>
        Address, amenities, policies, taxes. Each section saves on its own.
      </Typography.Text>

      {items.map((it) => (
        <Card
          key={it.key}
          id={it.key}
          title={it.label}
          style={{
            marginTop: 16,
            border: '1px solid rgba(44,44,44,0.08)',
            boxShadow: 'none'
          }}
          headStyle={{ borderBottom: '1px solid rgba(44,44,44,0.06)', fontWeight: 600 }}
        >
          {it.children}
        </Card>
      ))}
    </div>
  );
}

export default HotelSettings;
