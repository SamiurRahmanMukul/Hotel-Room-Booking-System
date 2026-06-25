/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, max-len */
import React from 'react';
import { Drawer, Tabs, Tag, Typography } from 'antd';
import {
  KeyOutlined, FileTextOutlined, MailOutlined, PhoneOutlined, HomeOutlined, MessageOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const STATUS_MAP = {
  approved: { label: 'Confirmed', color: 'green' },
  pending: { label: 'Pending', color: 'gold' },
  'in-reviews': { label: 'In review', color: 'blue' },
  rejected: { label: 'Rejected', color: 'red' },
  cancel: { label: 'Cancelled', color: 'default' },
  completed: { label: 'Completed', color: 'purple' }
};

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 15, color: '#2c2c2c' }}>{children}</div>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div style={{ padding: '16px 0', borderTop: '1px solid #f0f0f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#595959', fontWeight: 600, marginBottom: 12 }}>
        {icon} {title}
      </div>
      {children}
    </div>
  );
}

function ReservationDrawer({ booking, open, onClose }) {
  if (!booking) return <Drawer open={open} onClose={onClose} width={440} />;

  const guest = booking.booking_by || {};
  const room = booking.room || {};
  const pay = booking.payment || {};
  const dates = (booking.booking_dates || []).map((d) => dayjs(d)).sort((a, b) => a - b);
  const arrival = dates[0];
  const departure = dates.length ? dates[dates.length - 1].add(1, 'day') : null;
  const nights = dates.length;
  const currency = pay.currency || 'EUR';
  const nightly = Number(room.room_price) || 0;
  const price = pay.amount != null ? Number(pay.amount) : nightly * nights;
  const paid = pay.status === 'paid';
  const balance = paid ? 0 : -price;
  const st = STATUS_MAP[booking.booking_status] || { label: booking.booking_status, color: 'default' };
  const guestCount = booking.guests || { adults: 1, children: 0, infants: 0 };
  const guestSummary = [
    `${guestCount.adults || 0} adult${(guestCount.adults || 0) === 1 ? '' : 's'}`,
    guestCount.children ? `${guestCount.children} child${guestCount.children === 1 ? '' : 'ren'}` : null,
    guestCount.infants ? `${guestCount.infants} infant${guestCount.infants === 1 ? '' : 's'}` : null
  ].filter(Boolean).join(', ');
  const money = (n) => `${Number(n || 0).toFixed(2)} ${currency}`;

  const detailsTab = (
    <div>
      <Section icon={<KeyOutlined />} title='Unit'>
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ flex: 1 }}>
            <Field label='Assigned unit'>
              {room.room_name ? <strong>{room.room_name}</strong> : <Text type='secondary'>Unassigned</Text>}
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label='Unit group booked'>
              <strong>{booking.room_type_booked || room.room_type || '—'}</strong>
            </Field>
          </div>
        </div>
      </Section>

      <Section icon={<MessageOutlined />} title='Comments'>
        {booking.notes ? <div style={{ whiteSpace: 'pre-wrap' }}>{booking.notes}</div> : <Text type='secondary'>No comments</Text>}
      </Section>

      <Section icon={<FileTextOutlined />} title='More details'>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ flex: '1 1 40%' }}>
            <Field label='Channel'>{(booking.booking_source || 'direct')}</Field>
          </div>
          <div style={{ flex: '1 1 40%' }}>
            <Field label='Payment'>{pay.method ? `${pay.method} · ${pay.status || 'unpaid'}` : (pay.status || 'unpaid')}</Field>
          </div>
          <div style={{ flex: '1 1 40%' }}>
            <Field label='Country'>{booking.guest_country || '—'}</Field>
          </div>
          <div style={{ flex: '1 1 40%' }}>
            <Field label='Booking ref'>{`#${String(booking.id || '').slice(-8)}`}</Field>
          </div>
        </div>
      </Section>
    </div>
  );

  const travelTab = (
    <div style={{ paddingTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text type='secondary'><strong style={{ color: '#2c2c2c' }}>Over night</strong> {`${nights} night${nights === 1 ? '' : 's'}`}</Text>
        <Text strong>{`Total ${money(price)}`}</Text>
      </div>
      {dates.map((d) => (
        <div key={d.format('YYYY-MM-DD')} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
          <span>{d.format('D MMM YYYY')}</span>
          <span>{money(nightly || (nights ? price / nights : 0))}</span>
        </div>
      ))}
      {departure && <div style={{ paddingTop: 10, color: '#8c8c8c' }}>{`Departing ${departure.format('D MMM YYYY')}`}</div>}
    </div>
  );

  const guestsTab = (
    <div style={{ paddingTop: 8 }}>
      <Text strong style={{ fontSize: 16 }}>Main guest</Text>
      <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 16, marginTop: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>{guest.fullName || guest.userName || 'Guest'}</div>
        {guest.email && <div style={{ marginBottom: 8 }}><MailOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />{guest.email}</div>}
        {guest.phone && <div style={{ marginBottom: 8 }}><PhoneOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />{guest.phone}</div>}
        {guest.address && <div><HomeOutlined style={{ marginRight: 8, color: '#8c8c8c' }} />{guest.address}</div>}
      </div>
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={460}
      title={(
        <div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{`#${String(booking.id || '').slice(-8)}`}</div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{guest.fullName || guest.userName || 'Guest'}</div>
        </div>
      )}
    >
      {/* summary */}
      <div style={{ display: 'flex', gap: 16, paddingBottom: 16, borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ flex: 1 }}>
          <Field label='Status'><Tag color={st.color}>{st.label}</Tag></Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label='Price'><strong>{money(price)}</strong></Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label='Balance'><span style={{ color: balance < 0 ? '#cf1322' : '#237804', fontWeight: 600 }}>{money(balance)}</span></Field>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
        <div style={{ flex: 1 }}>
          <Field label='Arrival'>{arrival ? <strong>{arrival.format('D MMM YYYY')}</strong> : '—'}</Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label='Departure'>{departure ? <strong>{departure.format('D MMM YYYY')}</strong> : '—'}</Field>
        </div>
        <div style={{ flex: 1 }}>
          <Field label='Guests'>{guestSummary}</Field>
        </div>
      </div>

      <Tabs
        defaultActiveKey='details'
        items={[
          { key: 'details', label: 'Details', children: detailsTab },
          { key: 'travel', label: 'Travel dates', children: travelTab },
          { key: 'guests', label: 'Guests', children: guestsTab }
        ]}
      />
    </Drawer>
  );
}

export default ReservationDrawer;
