/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, max-len */
import React, { useEffect, useState } from 'react';
import {
  Typography, Form, Input, Select, TimePicker, Button, Spin, Row, Col, Divider
} from 'antd';
import { BankOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

dayjs.extend(customParseFormat);

const { Title, Text } = Typography;

const CURRENCIES = ['EUR', 'USD', 'GBP', 'BGN', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'RON', 'HUF', 'AUD', 'CAD', 'JPY'];
const COUNTRIES = ['Belgium', 'Bulgaria', 'France', 'Germany', 'Greece', 'Italy', 'Netherlands', 'Spain', 'Portugal', 'Austria', 'Switzerland', 'United Kingdom', 'Ireland', 'Sweden', 'Norway', 'Denmark', 'Poland', 'Czechia', 'Romania', 'Hungary', 'Croatia', 'United States', 'Canada', 'Australia'];

function timezoneList() {
  try {
    if (typeof Intl.supportedValuesOf === 'function') return Intl.supportedValuesOf('timeZone');
  } catch (e) { /* fall through */ }
  return ['Europe/Sofia', 'Europe/Brussels', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Europe/Madrid', 'Europe/Rome', 'Europe/Athens', 'UTC', 'America/New_York', 'America/Los_Angeles'];
}

function Property({ onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const tzList = timezoneList();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = await ApiService.get('/api/v1/hotel-settings');
        if (cancelled) return;
        const data = s || {};
        const loc = data.location || {};
        const co = data.company || {};
        form.setFieldsValue({
          name: data.name || '',
          description: data.description || '',
          country: loc.country,
          addressLine1: loc.addressLine1,
          addressLine2: loc.addressLine2,
          postalCode: loc.postalCode,
          city: loc.city,
          timezone: loc.timezone,
          currency: loc.currency || 'EUR',
          checkIn: loc.checkInTime ? dayjs(loc.checkInTime, 'HH:mm') : null,
          checkOut: loc.checkOutTime ? dayjs(loc.checkOutTime, 'HH:mm') : null,
          companyName: co.companyName,
          bank: co.bank,
          bic: co.bic,
          iban: co.iban,
          commercialRegisterEntry: co.commercialRegisterEntry,
          taxId: co.taxId,
          managingDirectors: co.managingDirectors,
          paymentTerms: co.paymentTerms
        });
      } catch (e) { /* new hotel — leave blank */ } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [form]);

  const onFinish = async (v) => {
    const payload = {
      name: v.name,
      description: v.description || '',
      location: {
        country: v.country,
        addressLine1: v.addressLine1,
        addressLine2: v.addressLine2 || '',
        postalCode: v.postalCode,
        city: v.city,
        timezone: v.timezone,
        currency: v.currency,
        checkInTime: v.checkIn ? v.checkIn.format('HH:mm') : '',
        checkOutTime: v.checkOut ? v.checkOut.format('HH:mm') : ''
      },
      company: {
        companyName: v.companyName,
        bank: v.bank || '',
        bic: v.bic || '',
        iban: v.iban || '',
        commercialRegisterEntry: v.commercialRegisterEntry,
        taxId: v.taxId,
        managingDirectors: v.managingDirectors || '',
        paymentTerms: v.paymentTerms
      }
    };
    try {
      setSaving(true);
      await ApiService.patch('/api/v1/hotel-settings', payload);
      notificationWithIcon('success', 'Saved', 'Property details saved.');
      if (typeof onSaved === 'function') onSaved();
    } catch (err) {
      notificationWithIcon('error', 'Error', err?.response?.data?.error || err?.message || 'Could not save property details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 80 }}><Spin size='large' /></div>;
  }

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '80vh', maxWidth: 1000 }}>
      <Title level={2} style={{ marginBottom: 4 }}>
        <BankOutlined style={{ marginRight: 10 }} />
        Create new hotel property
      </Title>
      <Text type='secondary'>Set up your hotel&apos;s details — the first step before adding room types and rooms.</Text>

      <Form form={form} layout='vertical' onFinish={onFinish} style={{ marginTop: 24 }} requiredMark>
        <Divider orientation='left'>General</Divider>
        <Form.Item name='name' label='Name' rules={[{ required: true, message: 'Hotel name is required' }]}>
          <Input placeholder='e.g. Paradise Hotel' size='large' />
        </Form.Item>
        <Form.Item name='description' label='Description'>
          <Input.TextArea rows={3} placeholder='e.g. Hotel by the sea' />
        </Form.Item>

        <Divider orientation='left'>Location</Divider>
        <Form.Item name='country' label='Country' rules={[{ required: true, message: 'Country is required' }]}>
          <Select showSearch placeholder='Select country' options={COUNTRIES.map((c) => ({ value: c, label: c }))} />
        </Form.Item>
        <Row gutter={16}>
          <Col xs={24} md={12}><Form.Item name='addressLine1' label='Address line 1' rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name='addressLine2' label='Address line 2'><Input /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={12}><Form.Item name='postalCode' label='Postal code' rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item name='city' label='City' rules={[{ required: true }]}><Input /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={6}><Form.Item name='timezone' label='Timezone' rules={[{ required: true }]}><Select showSearch options={tzList.map((z) => ({ value: z, label: z }))} /></Form.Item></Col>
          <Col xs={24} md={6}><Form.Item name='currency' label='Currency' rules={[{ required: true }]}><Select showSearch options={CURRENCIES.map((c) => ({ value: c, label: c }))} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item name='checkIn' label='Default check-in' rules={[{ required: true }]}><TimePicker format='HH:mm' minuteStep={15} style={{ width: '100%' }} /></Form.Item></Col>
          <Col xs={12} md={6}><Form.Item name='checkOut' label='Default check-out' rules={[{ required: true }]}><TimePicker format='HH:mm' minuteStep={15} style={{ width: '100%' }} /></Form.Item></Col>
        </Row>

        <Divider orientation='left'>Company details</Divider>
        <Form.Item name='companyName' label='Company name' rules={[{ required: true }]}><Input /></Form.Item>
        <Row gutter={16}>
          <Col xs={24} md={8}><Form.Item name='bank' label='Bank'><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name='bic' label='BIC'><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name='iban' label='IBAN'><Input /></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} md={8}><Form.Item name='commercialRegisterEntry' label='Commercial register entry' rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name='taxId' label='Tax ID' rules={[{ required: true }]}><Input /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item name='managingDirectors' label='Managing directors'><Input /></Form.Item></Col>
        </Row>
        <Form.Item name='paymentTerms' label='Payment terms' rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>

        <Form.Item>
          <Button type='primary' size='large' htmlType='submit' loading={saving}>Save</Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default Property;
