/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak, jsx-quotes, function-paren-newline */
import { LockOutlined } from '@ant-design/icons';
import {
  Button, Card, Col, Form, Input, Result, Row, Select, Spin, Typography
} from 'antd';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setSessionUserAndToken } from '../utils/authentication';
import { COUNTRY_OPTIONS, findCountry } from '../utils/countries';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function SetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const slug = params.get('slug');
  const [form] = Form.useForm();

  const [verifyState, setVerifyState] = useState({ loading: true, ok: null, error: null, info: null });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token || !slug) {
      setVerifyState({ loading: false, ok: false, error: 'Invalid link (missing token or slug).' });
      return;
    }
    // Super-admin invites use slug=superadmin → different verify endpoint
    const url = slug === 'superadmin'
      ? `${API}/platform-api/auth/magic-link/verify`
      : `${API}/api/v1/auth/magic-link/verify`;
    const headers = slug === 'superadmin' ? {} : { 'X-Hotel-Slug': slug };
    axios.get(url, { params: { token }, headers })
      .then((r) => {
        setVerifyState({ loading: false, ok: true, info: r.data });
        if (r.data?.user?.fullName) form.setFieldValue('fullName', r.data.user.fullName);
      })
      .catch((err) => {
        setVerifyState({ loading: false, ok: false, error: err.response?.data?.error || err.message });
      });
  }, [token, slug]);

  const onCountryChange = (code) => {
    const c = findCountry(code);
    if (c) {
      form.setFieldsValue({ currency: c.currency, timezone: c.timezone });
    }
  };

  const onFinish = async (values) => {
    if (values.password !== values.confirm) return;
    setSubmitting(true);
    try {
      // Super-admin path uses platform-api (no address fields)
      if (slug === 'superadmin') {
        const { data } = await axios.post(`${API}/platform-api/auth/magic-link/set-password`,
          { token, password: values.password });
        localStorage.setItem('superadmin_token', data.access_token);
        localStorage.setItem('superadmin_user', JSON.stringify(data.superadmin));
        setDone(true);
        setTimeout(() => navigate('/superadmin/dashboard'), 1200);
        return;
      }

      // Hotel-admin path — captures address basics in same request
      const payload = {
        token,
        password: values.password,
        fullName: values.fullName,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 || '',
        postalCode: values.postalCode,
        city: values.city,
        country: values.country,
        currency: values.currency,
        timezone: values.timezone
      };
      const { data } = await axios.post(`${API}/api/v1/auth/magic-link/set-password`, payload, {
        headers: { 'X-Hotel-Slug': slug }
      });
      setSessionUserAndToken(data.user, data.access_token, data.refresh_token);
      setDone(true);
      setTimeout(() => { window.location.href = '/main/dashboard'; }, 1200);
    } catch (err) {
      setVerifyState({ loading: false, ok: false, error: err.response?.data?.error || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (verifyState.loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F4', padding: 24 }}>
        <Card style={{ width: 460, border: '1px solid rgba(44,44,44,0.08)', boxShadow: 'none' }} bodyStyle={{ padding: 32 }}><div style={{ textAlign: 'center', padding: 40 }}><Spin /><div style={{ marginTop: 12 }}>Verifying link…</div></div></Card>
      </div>
    );
  }
  if (!verifyState.ok) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F4', padding: 24 }}>
        <Card style={{ width: 460, border: '1px solid rgba(44,44,44,0.08)', boxShadow: 'none' }} bodyStyle={{ padding: 32 }}>
          <Result status='error' title='Link not valid' subTitle={verifyState.error} extra={<Button type='primary' onClick={() => navigate('/auth/login')}>Go to login</Button>} />
        </Card>
      </div>
    );
  }
  if (done) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F4', padding: 24 }}>
        <Card style={{ width: 460, border: '1px solid rgba(44,44,44,0.08)', boxShadow: 'none' }} bodyStyle={{ padding: 32 }}>
          <Result status='success' title='All set' subTitle="Loading your dashboard…" />
        </Card>
      </div>
    );
  }

  const isSuperadmin = slug === 'superadmin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F3F4F4', padding: 24 }}>
      <Card style={{ width: 580, border: '1px solid rgba(44,44,44,0.08)', boxShadow: 'none' }} bodyStyle={{ padding: 32 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Welcome to {verifyState.info?.hotel?.name}
        </Typography.Title>
        <Typography.Text type='secondary'>
          {isSuperadmin
            ? 'Set your password to finish your super-admin setup.'
            : `Hi ${verifyState.info?.user?.fullName || 'there'} — a few quick details and you’re in.`}
        </Typography.Text>

        <Form form={form} layout='vertical' onFinish={onFinish} style={{ marginTop: 20 }} requiredMark={false}>
          {!isSuperadmin && (
            <>
              <Typography.Title level={5} style={{ marginTop: 0 }}>About you</Typography.Title>
              <Form.Item label='Your full name' name='fullName' rules={[{ required: true, message: 'Required' }]}>
                <Input autoFocus />
              </Form.Item>

              <Typography.Title level={5}>Hotel address</Typography.Title>
              <Form.Item label='Address line 1' name='addressLine1' rules={[{ required: true, message: 'Required' }]}>
                <Input placeholder='Street and number' />
              </Form.Item>
              <Form.Item label='Address line 2 (optional)' name='addressLine2'>
                <Input placeholder='Apartment, suite, etc.' />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Postal code' name='postalCode'>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='City' name='city' rules={[{ required: true, message: 'Required' }]}>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item label='Country' name='country' rules={[{ required: true, message: 'Required' }]}>
                <Select
                  showSearch
                  optionFilterProp='label'
                  options={COUNTRY_OPTIONS}
                  onChange={onCountryChange}
                  placeholder='Pick a country (sets currency + timezone)'
                />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label='Currency' name='currency'><Input placeholder='Set from country' /></Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label='Timezone' name='timezone'><Input placeholder='Set from country' /></Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Typography.Title level={5} style={{ marginTop: 8 }}>Password</Typography.Title>
          <Form.Item label='New password' name='password' rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder='at least 8 characters' />
          </Form.Item>
          <Form.Item
            label='Confirm password'
            name='confirm'
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('Passwords do not match'));
                }
              })
            ]}
          >
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>

          <Form.Item>
            <Button type='primary' htmlType='submit' loading={submitting} block>
              {isSuperadmin ? 'Set password and sign in' : 'Create account and continue'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default SetPassword;
