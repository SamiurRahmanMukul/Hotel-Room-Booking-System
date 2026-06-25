/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak */
/* eslint-disable jsx-quotes, no-confusing-arrow, no-underscore-dangle, prefer-destructuring */
/* eslint-disable react/no-unstable-nested-components, react/jsx-max-props-per-line */
/* eslint-disable react/jsx-curly-newline, react/jsx-first-prop-new-line */
/* eslint-disable react/jsx-closing-tag-location, object-property-newline, react/no-array-index-key */
/* eslint-disable no-alert, no-unneeded-ternary, react/no-unescaped-entities */
import {
  CheckCircleFilled, CloseCircleFilled, CloseOutlined, CopyOutlined,
  ExclamationCircleFilled, PlusOutlined, ReloadOutlined, SyncOutlined
} from '@ant-design/icons';
import {
  Button, Empty, Input, List, Modal, Popconfirm, Select, Space, Tooltip, Typography, message
} from 'antd';
import axios from 'axios';
import React, { useCallback, useEffect, useState } from 'react';
import ApiService from '../../utils/apiService';

const SYNC_BASE = process.env.REACT_APP_CALENDAR_SYNC_URL || 'http://localhost:8001';

const VENDORS = [
  {
    value: 'Airbnb',
    label: 'Airbnb',
    color: '#FF5A5F',
    icon: 'A',
    field: 'iCal URL from Airbnb',
    placeholder: 'https://www.airbnb.com/calendar/ical/12345.ics?s=...',
    instructions: 'In Airbnb: Calendar → pick listing → Availability → "Connect to another website" → Copy link'
  },
  {
    value: 'Booking.com',
    label: 'Booking.com',
    color: '#003580',
    icon: 'B',
    field: 'iCal URL from Booking.com',
    placeholder: 'https://admin.booking.com/...ics',
    instructions: 'In Booking.com extranet: Rates & Availability → Sync Calendars → Copy your iCal URL'
  },
  {
    value: 'Vrbo',
    label: 'Vrbo',
    color: '#0072CE',
    icon: 'V',
    field: 'iCal URL from Vrbo',
    placeholder: 'https://www.vrbo.com/icalendar/...',
    instructions: 'In Vrbo: Calendar → Import / export → Copy iCal URL'
  },
  {
    value: 'Custom iCal',
    label: 'Custom iCal',
    color: '#612D53',
    icon: '✱',
    field: 'iCal URL',
    placeholder: 'https://example.com/feed.ics',
    instructions: 'Any provider that gives you a public .ics URL.'
  }
];

const POLL_OPTIONS = [
  { value: 900, label: 'Every 15 min' },
  { value: 1800, label: 'Every 30 min (recommended)' },
  { value: 3600, label: 'Every hour' },
  { value: 10800, label: 'Every 3 hours' }
];

function VendorBadge({ vendor }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 8,
      background: vendor.color, color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 700, fontSize: 16, flexShrink: 0
    }}
    >
      {vendor.icon}
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.round(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} d ago`;
}

// ───────────────────────────────────────────────────────────────────
// A single empty connector card. Step 1: pick vendor. Step 2: fill fields.

function NewConnectorCard({ rooms, hotelId, onSaved, hasConnected }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [vendorValue, setVendorValue] = useState(null);
  const [form, setForm] = useState({ roomTypeId: null, icalUrl: '', pollIntervalSeconds: 1800 });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { ok: bool, message }

  const vendor = VENDORS.find((v) => v.value === vendorValue);

  const next = () => {
    if (!vendorValue) return;
    setStep(2);
  };

  const closeModal = () => {
    setOpen(false);
    // reset after close animation
    setTimeout(() => {
      setStep(1);
      setVendorValue(null);
      setForm({ roomTypeId: null, icalUrl: '', pollIntervalSeconds: 1800 });
      setResult(null);
    }, 200);
  };

  const save = async () => {
    if (!form.roomTypeId || !form.icalUrl) {
      message.warning('Pick a room and paste the iCal URL.');
      return;
    }
    setSaving(true);
    try {
      await axios.post(`${SYNC_BASE}/channels`, {
        hotelId,
        roomTypeId: form.roomTypeId,
        type: 'ical_in',
        name: vendor.value,
        icalUrl: form.icalUrl,
        pollIntervalSeconds: parseInt(form.pollIntervalSeconds, 10) || 1800,
        enabled: true
      });
      setResult({ ok: true, message: `${vendor.value} connected. First sync queued.` });
      onSaved();
      // auto-close modal after a brief moment so user sees the success
      setTimeout(() => { closeModal(); }, 1200);
    } catch (err) {
      setResult({ ok: false, message: err?.response?.data?.error || err?.message || 'Could not connect' });
    } finally { setSaving(false); }
  };

  const reset = () => {
    setStep(1);
    setVendorValue(null);
    setForm({ roomTypeId: null, icalUrl: '', pollIntervalSeconds: 1800 });
    setResult(null);
  };

  // ─── Empty-state card (Resend-style) ───
  // When no platforms are connected, show a centered card with bold heading,
  // subtitle, and a single primary CTA. When at least one is connected,
  // collapse to a slim "Connect another platform" button.
  const emptyCard = !hasConnected ? (
    <div style={{
      background: '#fff', border: '1px solid rgba(44,44,44,0.08)', borderRadius: 12,
      padding: '56px 24px', textAlign: 'center'
    }}
    >
      <div style={{
        fontSize: 18, fontWeight: 600, color: '#2C2C2C', marginBottom: 8,
        letterSpacing: '-0.01em'
      }}
      >
        No platforms connected yet
      </div>
      <div style={{
        color: '#6B6B6B', fontSize: 14, lineHeight: 1.5,
        maxWidth: 440, margin: '0 auto 24px'
      }}
      >
        Sync your calendar with Airbnb, Booking.com, Vrbo or any iCal feed to
        prevent double-bookings across platforms.
      </div>
      <Button
        type='primary'
        size='large'
        icon={<PlusOutlined />}
        onClick={() => setOpen(true)}
      >
        Connect platform
      </Button>
    </div>
  ) : (
    <div style={{ textAlign: 'right' }}>
      <Button type='primary' icon={<PlusOutlined />} onClick={() => setOpen(true)}>
        Connect another platform
      </Button>
    </div>
  );

  return (
    <>
      {emptyCard}

      <Modal
        open={open}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
        title={step === 1 ? 'Connect a platform' : (vendor ? `Connect ${vendor.label}` : 'Connect a platform')}
        width={520}
      >
        {/* Result state */}
        {result && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '12px 0'
          }}
          >
            {result.ok ? (
              <CheckCircleFilled style={{ color: '#3F7D58', fontSize: 26 }} />
            ) : (
              <CloseCircleFilled style={{ color: '#A4243B', fontSize: 26 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: '#2C2C2C' }}>
                {result.ok ? 'Connected' : 'Could not connect'}
              </div>
              <div style={{ color: '#6B6B6B', fontSize: 13, marginTop: 2 }}>{result.message}</div>
            </div>
            {result.ok ? (
              <Button onClick={closeModal}>Done</Button>
            ) : (
              <Button onClick={reset}>Try again</Button>
            )}
          </div>
        )}

        {/* Step 1: pick a vendor */}
        {!result && step === 1 && (
          <div style={{ paddingTop: 8 }}>
            <div style={{ color: '#6B6B6B', fontSize: 13, marginBottom: 16 }}>
              Pick the platform you want to sync with. You'll paste its iCal URL on the next step.
            </div>
            <Select
              placeholder='Pick a platform'
              style={{ width: '100%' }}
              size='large'
              value={vendorValue}
              onChange={setVendorValue}
              options={VENDORS.map((v) => ({
                value: v.value,
                label: (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 4,
                      background: v.color, color: 'white',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700
                    }}
                    >
                      {v.icon}
                    </span>
                    {v.label}
                  </span>
                )
              }))}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <Button onClick={closeModal}>Cancel</Button>
              <Button type='primary' onClick={next} disabled={!vendorValue}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 2: configure fields */}
        {!result && step === 2 && vendor && (
          <div style={{ paddingTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <VendorBadge vendor={vendor} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#2C2C2C' }}>{vendor.label}</div>
                <div style={{ color: '#6B6B6B', fontSize: 12 }}>{vendor.instructions}</div>
              </div>
            </div>

            <Space direction='vertical' size='middle' style={{ width: '100%' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#6B6B6B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Applies to room
                </div>
                <Select
                  value={form.roomTypeId}
                  onChange={(v) => setForm({ ...form, roomTypeId: v })}
                  placeholder='Select room'
                  style={{ width: '100%' }}
                  options={rooms.map((r) => ({ label: r.room_name, value: r.id }))}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#6B6B6B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {vendor.field}
                </div>
                <Input
                  value={form.icalUrl}
                  onChange={(e) => setForm({ ...form, icalUrl: e.target.value })}
                  placeholder={vendor.placeholder}
                />
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#6B6B6B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Sync frequency
                </div>
                <Select
                  value={form.pollIntervalSeconds}
                  onChange={(v) => setForm({ ...form, pollIntervalSeconds: v })}
                  style={{ width: '100%' }}
                  options={POLL_OPTIONS}
                />
              </div>
            </Space>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 24 }}>
              <Button onClick={reset} type='text'>Back</Button>
              <Space>
                <Button onClick={closeModal}>Cancel</Button>
                <Button type='primary' icon={<PlusOutlined />} loading={saving} onClick={save}>
                  Connect {vendor.label}
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────
// Main page

function Channels() {
  const [me, setMe] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await ApiService.get('/api/v1/me');
      setMe(meRes);
      const roomsRes = await ApiService.get('/api/v1/all-rooms-list');
      setRooms(roomsRes?.result?.data?.rows || []);
      const ch = await axios.get(`${SYNC_BASE}/channels`, { params: { hotelId: meRes?.hotel?.id } });
      setChannels(ch.data || []);
    } catch (err) { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onSync = async (id) => {
    try {
      await axios.post(`${SYNC_BASE}/channels/${id}/sync`, { hotelId: me?.hotel?.id });
      message.success('Sync queued');
      setTimeout(refresh, 1500);
    } catch (err) { message.error(err?.message || 'Sync failed'); }
  };

  const outboundUrl = (roomTypeId) => `${SYNC_BASE}/ical/${me?.hotel?.id}/${roomTypeId}.ics`;

  if (loading || !me) {
    return (
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid rgba(44,44,44,0.08)', borderRadius: 12, padding: 40, textAlign: 'center' }}>
        Loading…
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div style={{ marginTop: 16, background: '#fff', border: '1px solid rgba(44,44,44,0.08)', borderRadius: 12, padding: 24 }}>
        <Empty description='Add at least one room before connecting external platforms.'>
          <Button type='primary' onClick={() => { window.location.href = '/main/rooms'; }}>
            Go to Rooms
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div>
      {/* Outbound URLs reminder */}
      <div style={{
        marginTop: 24, background: '#fff', border: '1px solid rgba(44,44,44,0.08)', borderRadius: 12, padding: 24
      }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <ExclamationCircleFilled style={{ color: '#C8923A', fontSize: 22, marginTop: 4 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#2C2C2C', marginBottom: 4 }}>
              Two-way sync — paste your outbound URLs into each platform too
            </div>
            <Typography.Text type='secondary' style={{ fontSize: 13 }}>
              We pull bookings FROM the platforms below. To prevent double-bookings, also paste OUR
              URL (one per room) INTO each platform's "import calendar" field. They poll every few hours.
            </Typography.Text>
            <List
              size='small'
              dataSource={rooms}
              renderItem={(r) => (
                <List.Item style={{ padding: '8px 0', border: 'none' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 12 }}>{r.room_name}</strong>
                    <code style={{
                      display: 'block', fontSize: 11, color: '#6B6B6B', wordBreak: 'break-all',
                      background: '#F3F4F4', padding: '4px 8px', borderRadius: 4, marginTop: 2
                    }}
                    >
                      {outboundUrl(r.id)}
                    </code>
                  </div>
                  <Tooltip title='Copy URL'>
                    <Button
                      size='small'
                      icon={<CopyOutlined />}
                      onClick={() => { navigator.clipboard.writeText(outboundUrl(r.id)); message.success('Copied'); }}
                    >
                      Copy
                    </Button>
                  </Tooltip>
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>

      {/* Connected platforms — one card each */}
      {channels.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{
            color: '#6B6B6B', fontSize: 12, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10
          }}
          >
            Connected platforms ({channels.length})
          </div>
          <Space direction='vertical' size='middle' style={{ width: '100%' }}>
            {channels.map((c) => {
              const vendor = VENDORS.find((v) => v.value === c.name) || VENDORS[3];
              const room = rooms.find((r) => r.id === c.roomTypeId);
              const ok = c.lastSyncStatus === 'ok';
              const err = c.lastSyncStatus === 'error';
              return (
                <div
                  key={c._id}
                  style={{
                    background: '#fff', border: '1px solid rgba(44,44,44,0.08)', borderRadius: 12,
                    padding: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
                  }}
                >
                  <VendorBadge vendor={vendor} />
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontWeight: 600, color: '#2C2C2C' }}>
                      {c.name}
                      <span style={{ marginLeft: 8, fontWeight: 400, color: '#9CA3AF', fontSize: 12 }}>
                        · {room?.room_name || c.roomTypeId}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#6B6B6B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {ok && <span style={{ color: '#3F7D58', display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircleFilled /> ok</span>}
                      {err && <span style={{ color: '#A4243B', display: 'inline-flex', alignItems: 'center', gap: 4 }}><CloseCircleFilled /> error</span>}
                      {!ok && !err && <span style={{ color: '#C8923A' }}>pending first sync</span>}
                      <span>· last sync {timeAgo(c.lastSyncAt)}</span>
                    </div>
                    {c.lastError && (
                      <div style={{ fontSize: 11, color: '#A4243B', marginTop: 4 }}>{c.lastError}</div>
                    )}
                  </div>
                  <Space>
                    <Tooltip title='Force sync now'>
                      <Button size='small' icon={<SyncOutlined />} onClick={() => onSync(c._id)}>Sync</Button>
                    </Tooltip>
                    <Popconfirm
                      title={`Disconnect ${c.name}?`}
                      onConfirm={async () => {
                        try {
                          await axios.delete(`${SYNC_BASE}/channels/${c._id}`, { params: { hotelId: me.hotel.id } });
                          message.success('Disconnected');
                          refresh();
                        } catch (err2) { message.error('Could not disconnect'); }
                      }}
                    >
                      <Button size='small' danger type='text' icon={<CloseOutlined />} />
                    </Popconfirm>
                  </Space>
                </div>
              );
            })}
          </Space>
        </div>
      )}

      {/* New connector card — Resend-style empty state, or compact CTA */}
      <div style={{ marginTop: 24 }}>
        <NewConnectorCard
          rooms={rooms}
          hotelId={me.hotel.id}
          onSaved={refresh}
          hasConnected={channels.length > 0}
        />
      </div>

      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <Button size='small' icon={<ReloadOutlined />} type='text' onClick={refresh}>
          Refresh
        </Button>
      </div>
    </div>
  );
}

export default Channels;
