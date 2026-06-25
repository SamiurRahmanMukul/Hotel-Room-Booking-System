/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak */
/* eslint-disable jsx-quotes, no-confusing-arrow, no-underscore-dangle */
/* eslint-disable react/no-unstable-nested-components, react/jsx-max-props-per-line */
/* eslint-disable react/jsx-curly-newline, react/jsx-first-prop-new-line */
/* eslint-disable react/jsx-closing-tag-location, object-property-newline */
/* eslint-disable react/no-array-index-key, prefer-destructuring */
/* eslint-disable no-unneeded-ternary, no-nested-ternary */
import { CheckCircleFilled, CloseCircleFilled, ClockCircleFilled, DollarCircleFilled, FileTextOutlined, GlobalOutlined, SearchOutlined } from '@ant-design/icons';
import { Empty, Input, InputNumber, Pagination, Popover, Result, Select, Skeleton, Space, Tag, Tooltip, Typography, message } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ApiService from '../../utils/apiService';
import { COUNTRY_OPTIONS, findCountry } from '../../utils/countries';

// ───────────────────────────────────────────────────────────────────────
// Helpers

function formatStayRange(dates) {
  if (!Array.isArray(dates) || dates.length === 0) return '—';
  const sorted = [...dates].map((d) => dayjs(d)).sort((a, b) => a.valueOf() - b.valueOf());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const days = sorted.length;
  if (first.year() === last.year() && first.month() === last.month()) {
    // 11–17 July, 2026 (6 nights)
    return `${first.date()}–${last.date()} ${first.format('MMMM, YYYY')} (${days} ${days === 1 ? 'night' : 'nights'})`;
  }
  if (first.year() === last.year()) {
    return `${first.format('D MMM')} – ${last.format('D MMM, YYYY')} (${days} nights)`;
  }
  return `${first.format('D MMM YYYY')} – ${last.format('D MMM YYYY')} (${days} nights)`;
}

function formatGuestsLabel(g) {
  if (!g) return '1';
  const adults = g.adults || 1;
  const children = g.children || 0;
  const infants = g.infants || 0;
  const parts = [];
  parts.push(String(adults));
  if (children > 0) parts.push(`+${children} child${children > 1 ? 'ren' : ''}`);
  if (infants > 0) parts.push(`+${infants} infant${infants > 1 ? 's' : ''}`);
  return parts.join(' ');
}

const STATUS_META = {
  pending: { label: 'Pending', color: '#C8923A', bg: '#FFF7E6', icon: <ClockCircleFilled /> },
  approved: { label: 'Approved', color: '#3F7D58', bg: '#EAF6EE', icon: <CheckCircleFilled /> },
  rejected: { label: 'Rejected', color: '#A4243B', bg: '#FFEBEE', icon: <CloseCircleFilled /> },
  cancel: { label: 'Cancelled', color: '#6B6B6B', bg: '#F1F1F1', icon: <CloseCircleFilled /> },
  'in-reviews': { label: 'In review', color: '#612D53', bg: '#F5EDF1', icon: <ClockCircleFilled /> },
  completed: { label: 'Completed', color: '#3F7D58', bg: '#EAF6EE', icon: <CheckCircleFilled /> }
};

// ───────────────────────────────────────────────────────────────────────
// Inline-editable status pill

function StatusPill({ status, onChange }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <Select
      value={status}
      variant='borderless'
      onChange={onChange}
      style={{ width: 130 }}
      dropdownStyle={{ fontSize: 12 }}
      options={Object.entries(STATUS_META).map(([value, m]) => ({
        value,
        label: (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ color: m.color }}>{m.icon}</span> {m.label}
          </span>
        )
      }))}
      labelRender={() => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '2px 10px', borderRadius: 999,
          background: meta.bg, color: meta.color,
          fontWeight: 600, fontSize: 11, letterSpacing: '0.02em', textTransform: 'uppercase'
        }}
        >
          <span>{meta.icon}</span> {meta.label}
        </span>
      )}
    />
  );
}

// Inline notes — popover with textarea
function NotesCell({ value, onSave }) {
  const [draft, setDraft] = useState(value || '');
  useEffect(() => { setDraft(value || ''); }, [value]);
  return (
    <Popover
      trigger='click'
      placement='left'
      title='Notes'
      content={(
        <div style={{ width: 320 }}>
          <Input.TextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder='Special requests, allergies, arrival time, etc.'
            maxLength={2000}
            showCount
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <button
              type='button'
              onClick={() => onSave(draft)}
              style={{
                background: '#853953', color: 'white',
                border: 'none', padding: '4px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer'
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}
    >
      <span
        role='button' tabIndex={0}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          color: value ? '#2C2C2C' : '#9CA3AF',
          cursor: 'pointer', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}
      >
        <FileTextOutlined />
        {value ? value : 'Add note'}
      </span>
    </Popover>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Payment cell — popover with method, status, amount

const PAYMENT_METHODS = [
  { value: '', label: '— Method —' },
  { value: 'card', label: 'Card' },
  { value: 'cash', label: 'Cash' },
  { value: 'check', label: 'Check' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'epay', label: 'ePay' },
  { value: 'apple_pay', label: 'Apple Pay' },
  { value: 'google_pay', label: 'Google Pay' },
  { value: 'on_arrival', label: 'Pay on arrival' }
];
const PAYMENT_STATUS = {
  unpaid: { label: 'Unpaid', color: '#A4243B', bg: '#FFEBEE' },
  pending: { label: 'Pending', color: '#C8923A', bg: '#FFF7E6' },
  partial: { label: 'Partial', color: '#612D53', bg: '#F5EDF1' },
  paid: { label: 'Paid', color: '#3F7D58', bg: '#EAF6EE' },
  refunded: { label: 'Refunded', color: '#6B6B6B', bg: '#F1F1F1' }
};

function methodLabel(v) {
  return (PAYMENT_METHODS.find((m) => m.value === v) || {}).label || '—';
}

function PaymentCell({ value, onSave }) {
  const [draft, setDraft] = useState({
    amount: value?.amount ?? null,
    currency: value?.currency || 'EUR',
    method: value?.method || '',
    status: value?.status || 'unpaid'
  });
  useEffect(() => {
    setDraft({
      amount: value?.amount ?? null,
      currency: value?.currency || 'EUR',
      method: value?.method || '',
      status: value?.status || 'unpaid'
    });
  }, [value?.amount, value?.currency, value?.method, value?.status]);

  const meta = PAYMENT_STATUS[value?.status || 'unpaid'];
  const amountText = value?.amount ? `${value.currency || 'EUR'} ${value.amount}` : '—';

  return (
    <Popover
      trigger='click'
      placement='left'
      title='Payment'
      content={(
        <div style={{ width: 280 }}>
          <Space direction='vertical' size='small' style={{ width: '100%' }}>
            <div>
              <div style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 4 }}>Amount</div>
              <InputNumber
                value={draft.amount}
                onChange={(v) => setDraft({ ...draft, amount: v })}
                style={{ width: '100%' }}
                min={0}
                addonBefore={(
                  <Select
                    value={draft.currency}
                    onChange={(v) => setDraft({ ...draft, currency: v })}
                    options={['EUR', 'USD', 'GBP', 'BGN', 'CHF', 'CZK', 'PLN', 'RON'].map((c) => ({ value: c, label: c }))}
                    style={{ width: 80 }}
                  />
                )}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 4 }}>Method</div>
              <Select
                value={draft.method}
                onChange={(v) => setDraft({ ...draft, method: v })}
                style={{ width: '100%' }}
                options={PAYMENT_METHODS}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6B6B6B', marginBottom: 4 }}>Status</div>
              <Select
                value={draft.status}
                onChange={(v) => setDraft({ ...draft, status: v })}
                style={{ width: '100%' }}
                options={Object.entries(PAYMENT_STATUS).map(([v, m]) => ({ value: v, label: m.label }))}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type='button'
                onClick={() => onSave(draft)}
                style={{
                  background: '#853953', color: 'white',
                  border: 'none', padding: '4px 12px', borderRadius: 4, fontSize: 12, cursor: 'pointer'
                }}
              >
                Save
              </button>
            </div>
          </Space>
        </div>
      )}
    >
      <span
        role='button' tabIndex={0}
        style={{ cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', gap: 2 }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: '#2C2C2C' }}>
          <DollarCircleFilled style={{ color: '#9CA3AF', fontSize: 11 }} />
          {amountText}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <span style={{
            display: 'inline-flex', padding: '1px 8px', borderRadius: 999,
            background: meta.bg, color: meta.color,
            fontWeight: 600, fontSize: 9, letterSpacing: '0.02em', textTransform: 'uppercase'
          }}
          >
            {meta.label}
          </span>
          {value?.method && <span style={{ color: '#9CA3AF' }}>· {methodLabel(value.method)}</span>}
        </span>
      </span>
    </Popover>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Country picker — small inline select

function CountryCell({ value, onSave }) {
  const country = findCountry(value || '');
  return (
    <Popover
      trigger='click'
      placement='left'
      content={(
        <div style={{ width: 240 }}>
          <Select
            placeholder='Pick country'
            value={value || undefined}
            onChange={(v) => onSave(v)}
            showSearch
            optionFilterProp='label'
            options={[{ value: '', label: '— None —' }, ...COUNTRY_OPTIONS]}
            style={{ width: '100%' }}
          />
        </div>
      )}
    >
      <span
        role='button' tabIndex={0}
        style={{
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: country ? '#6B6B6B' : '#9CA3AF'
        }}
      >
        <GlobalOutlined />
        {country ? country.name : 'Set country'}
      </span>
    </Popover>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Top counter chips

function CounterChip({ label, value, color, accentBg }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid rgba(44,44,44,0.08)',
        borderRadius: 10,
        padding: '14px 18px',
        flex: 1,
        minWidth: 140,
        display: 'flex',
        flexDirection: 'column',
        gap: 2
      }}
    >
      <div style={{
        color: '#6B6B6B', fontSize: 11, fontWeight: 500,
        textTransform: 'uppercase', letterSpacing: '0.04em'
      }}
      >
        {label}
      </div>
      <div style={{
        fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em',
        color: color || '#2C2C2C',
        background: accentBg, display: 'inline-block',
        padding: accentBg ? '0 6px' : 0,
        borderRadius: accentBg ? 4 : 0,
        width: 'fit-content'
      }}
      >
        {value}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
// Page

function Orders() {
  const [query, setQuery] = useState({ search: '', sort: 'desc', page: 1, rows: 20 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiService.get(
        `/api/v1/get-all-booking-orders?keyword=${encodeURIComponent(query.search)}&limit=${query.rows}&page=${query.page}&sort=${query.sort}`
      );
      setData(res?.result?.data || null);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.result?.error || err.message);
    } finally { setLoading(false); }
  }, [query, refreshKey]);

  useEffect(() => { refresh(); }, [refresh]);

  const allRows = data?.rows || [];
  const filteredRows = useMemo(() => (
    statusFilter === 'all' ? allRows : allRows.filter((r) => r.booking_status === statusFilter)
  ), [allRows, statusFilter]);

  // counts per status
  const counts = useMemo(() => {
    const c = { total: allRows.length, pending: 0, approved: 0, rejected: 0, cancel: 0, completed: 0, 'in-reviews': 0 };
    allRows.forEach((r) => { c[r.booking_status] = (c[r.booking_status] || 0) + 1; });
    return c;
  }, [allRows]);

  const patchBooking = async (id, patch) => {
    try {
      await ApiService.patch(`/api/v1/booking/${id}`, patch);
      message.success('Updated');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      message.error(err?.response?.data?.result?.error || 'Could not update');
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, fontWeight: 600, letterSpacing: '-0.02em' }}>
        Bookings
      </Typography.Title>
      <Typography.Text type='secondary'>
        All reservations across your hotel. Click status, name, or notes to edit inline.
      </Typography.Text>

      {/* Counter row */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <CounterChip label='Total bookings' value={counts.total} />
        <CounterChip label='Awaits action' value={counts.pending || 0} color='#C8923A' />
        <CounterChip label='Approved' value={counts.approved || 0} color='#3F7D58' />
        <CounterChip label='Rejected' value={counts.rejected || 0} color='#A4243B' />
        <CounterChip label='Cancelled' value={counts.cancel || 0} color='#6B6B6B' />
        <CounterChip label='Completed' value={counts.completed || 0} color='#3F7D58' />
      </div>

      {/* Filter bar */}
      <div style={{
        marginTop: 20, padding: '12px 14px',
        background: '#fff', border: '1px solid rgba(44,44,44,0.08)', borderRadius: 10,
        display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center'
      }}
      >
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
          placeholder='Search guest, room, or notes…'
          value={query.search}
          onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))}
          style={{ flex: 1, minWidth: 240 }}
        />
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: 'All statuses' },
            ...Object.entries(STATUS_META).map(([v, m]) => ({ value: v, label: m.label }))
          ]}
        />
        <Select
          value={query.sort}
          onChange={(v) => setQuery((q) => ({ ...q, sort: v }))}
          style={{ width: 170 }}
          options={[
            { value: 'desc', label: 'Newest first' },
            { value: 'asc', label: 'Oldest first' }
          ]}
        />
        <Select
          value={query.rows}
          onChange={(v) => setQuery((q) => ({ ...q, rows: v, page: 1 }))}
          style={{ width: 110 }}
          options={[10, 20, 50, 100].map((n) => ({ value: n, label: `${n} rows` }))}
        />
      </div>

      {/* Table */}
      <div style={{
        marginTop: 16, background: '#fff',
        border: '1px solid rgba(44,44,44,0.08)', borderRadius: 10, overflow: 'hidden'
      }}
      >
        {error ? (
          <Result status='error' title='Failed to fetch' subTitle={error} />
        ) : loading ? (
          <div style={{ padding: 24 }}><Skeleton active paragraph={{ rows: 6 }} /></div>
        ) : filteredRows.length === 0 ? (
          <Empty style={{ padding: 40 }} description='No bookings match the current filters.' />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#fafafa', color: '#6B6B6B', textTransform: 'uppercase', fontSize: 10, letterSpacing: '0.06em', fontWeight: 600 }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(44,44,44,0.06)' }}>Guest</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(44,44,44,0.06)' }}>Stay</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(44,44,44,0.06)' }}>People</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(44,44,44,0.06)' }}>Room</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(44,44,44,0.06)' }}>Payment</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(44,44,44,0.06)' }}>Notes</th>
                <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid rgba(44,44,44,0.06)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: '1px solid rgba(44,44,44,0.04)', transition: 'background 0.1s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(133,57,83,0.03)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 500, color: '#2C2C2C', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {r.booking_by?.fullName || '—'}
                      {r.booking_source === 'airbnb' && <Tag color="#FF5A5F" style={{ margin: 0, fontSize: 10, lineHeight: '14px' }}>Airbnb</Tag>}
                      {r.booking_source === 'booking.com' && <Tag color="#003580" style={{ margin: 0, fontSize: 10, lineHeight: '14px' }}>Booking</Tag>}
                    </div>
                    <div style={{ color: '#9CA3AF', fontSize: 11 }}>{r.booking_by?.email}</div>
                    <div style={{ marginTop: 2 }}>
                      <CountryCell
                        value={r.guest_country}
                        onSave={(v) => patchBooking(r.id, { guest_country: v })}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ color: '#2C2C2C' }}>{formatStayRange(r.booking_dates)}</div>
                    <Tooltip title={dayjs(r.created_at).format('YYYY-MM-DD HH:mm')}>
                      <div style={{ color: '#9CA3AF', fontSize: 11 }}>booked {dayjs(r.created_at).fromNow ? dayjs(r.created_at).fromNow() : dayjs(r.created_at).format('D MMM')}</div>
                    </Tooltip>
                  </td>
                  <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ color: '#2C2C2C' }}>{formatGuestsLabel(r.guests)}</div>
                  </td>
                  <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                    <div style={{ color: '#2C2C2C' }}>{r.room?.room_name || '—'}</div>
                    {r.room?.room_type && <div style={{ color: '#9CA3AF', fontSize: 11, textTransform: 'capitalize' }}>{r.room.room_type}</div>}
                  </td>
                  <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                    <PaymentCell value={r.payment} onSave={(v) => patchBooking(r.id, { payment: v })} />
                  </td>
                  <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                    <NotesCell value={r.notes} onSave={(v) => patchBooking(r.id, { notes: v })} />
                  </td>
                  <td style={{ padding: '10px 16px', verticalAlign: 'top' }}>
                    <StatusPill
                      status={r.booking_status}
                      onChange={(v) => patchBooking(r.id, { booking_status: v })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data?.total_page > 1 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            current={data.current_page}
            total={data.total_page * 10}
            onChange={(p) => setQuery((q) => ({ ...q, page: p }))}
          />
        </div>
      )}
    </div>
  );
}

export default Orders;
