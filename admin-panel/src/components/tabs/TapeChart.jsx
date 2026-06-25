/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, max-len, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions, jsx-a11y/control-has-associated-label */
import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography, Spin, Button, Space, Modal, InputNumber, DatePicker, Tooltip, Tag, Drawer, Empty
} from 'antd';
import {
  LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';
import ReservationDrawer from '../utilities/ReservationDrawer';

const { Title, Text } = Typography;

const WINDOW = 14; // days shown at once
const CELL_W = 90; // px per day
const ROOM_COL_W = 130;
const ROW_H = 34;
const ISO = 'YYYY-MM-DD';

const STATUS_COLORS = {
  pending: { bg: '#FFF7E6', border: '#FAAD14', text: '#AD6800' },
  approved: { bg: '#EAF6EE', border: '#52C41A', text: '#237804' },
  rejected: { bg: '#FFF1F0', border: '#FF4D4F', text: '#A8071A' },
  cancel: { bg: '#FAFAFA', border: '#BFBFBF', text: '#595959' },
  'in-reviews': { bg: '#E6F4FF', border: '#1677FF', text: '#0958D9' },
  completed: { bg: '#F9F0FF', border: '#722ED1', text: '#531DAB' }
};

function TapeChart() {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [startDate, setStartDate] = useState(() => dayjs().startOf('day'));

  const [modal, setModal] = useState({ open: false, room: null, date: null });
  const [nights, setNights] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [armed, setArmed] = useState(null); // unassigned booking being placed onto a room
  const [reservation, setReservation] = useState(null); // booking shown in the detail drawer

  const days = useMemo(() => Array.from({ length: WINDOW }).map((_, i) => startDate.add(i, 'day')), [startDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, bookingsRes] = await Promise.all([
        ApiService.get('/api/v1/all-rooms-list?limit=1000'),
        ApiService.get('/api/v1/get-all-booking-orders?limit=1000')
      ]);
      const r = (roomsRes?.result?.data?.rows || [])
        .slice()
        .sort((a, b) => String(a.room_name || '~').localeCompare(String(b.room_name || '~'), undefined, { numeric: true }));
      setRooms(r);
      setBookings(bookingsRes?.result?.data?.rows || []);
    } catch (error) {
      notificationWithIcon('error', 'Error', 'Could not load the room rack.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // month spans across the visible days (e.g. "June 2026" over its columns)
  const monthGroups = useMemo(() => {
    const groups = [];
    days.forEach((d) => {
      const label = d.format('MMMM YYYY');
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.count += 1;
      else groups.push({ label, count: 1 });
    });
    return groups;
  }, [days]);

  const barsFor = (roomId) => bookings
    .filter((b) => b.room?.id === roomId && Array.isArray(b.booking_dates) && b.booking_dates.length)
    .map((b) => {
      const ds = b.booking_dates.map((d) => dayjs(d).startOf('day')).sort((x, y) => x - y);
      const startIdx = ds[0].diff(startDate, 'day');
      const nightsCount = ds[ds.length - 1].diff(ds[0], 'day') + 1;
      const visStart = Math.max(0, startIdx);
      const visEnd = Math.min(WINDOW, startIdx + nightsCount);
      if (visEnd <= visStart) return null;
      return {
        id: b.id,
        left: visStart * CELL_W + 2,
        width: (visEnd - visStart) * CELL_W - 4,
        label: b.booking_by?.fullName || b.booking_by?.userName || 'Guest',
        status: b.booking_status,
        from: ds[0].format('MMM D'),
        to: ds[ds.length - 1].add(1, 'day').format('MMM D'),
        booking: b
      };
    })
    .filter(Boolean);

  const unassigned = useMemo(() => bookings.filter((b) => !b.room?.id), [bookings]);

  const datesLabel = (b) => {
    const ds = (b.booking_dates || []).map((d) => dayjs(d)).sort((x, y) => x - y);
    return ds.length ? `${ds[0].format('MMM D')} → ${ds[ds.length - 1].add(1, 'day').format('MMM D')}` : '';
  };

  const assignArmedTo = async (room) => {
    if (!armed || !room?.id) return;
    try {
      const res = await ApiService.patch(`/api/v1/booking/${armed.id}/assign-room`, { roomId: room.id });
      if (res?.result_code === 0) {
        notificationWithIcon('success', 'Assigned', `${armed.booking_by?.fullName || 'Guest'} → ${room.room_name}`);
        setArmed(null);
        await fetchData();
      }
    } catch (err) {
      notificationWithIcon('error', 'Could not assign', err?.response?.data?.result?.error || 'Assignment failed.');
    }
  };

  const openCreate = (room, date) => {
    setNights(1);
    setModal({ open: true, room, date });
  };

  const submitBooking = async () => {
    const { room, date } = modal;
    const n = Math.max(1, Number(nights) || 1);
    const dates = Array.from({ length: n }).map((_, i) => date.add(i, 'day').format(ISO));
    try {
      setSubmitting(true);
      const res = await ApiService.post(`/api/v1/placed-booking-order/${room.id}`, { booking_dates: dates });
      if (res?.result_code === 0) {
        notificationWithIcon('success', 'Booked', `Booked ${room.room_name} for ${n} night(s).`);
        setModal({ open: false, room: null, date: null });
        await fetchData();
      }
    } catch (err) {
      const status = err?.response?.status;
      notificationWithIcon(
        'error',
        status === 409 ? 'Unavailable' : 'Error',
        status === 409 ? 'Those dates are no longer available.' : (err?.response?.data?.result?.error || 'Could not create the booking.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const gridW = WINDOW * CELL_W;

  return (
    <div style={{ padding: 24, background: '#fff', minHeight: '80vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Room rack</Title>
        <Space wrap>
          <Text type='secondary'>From</Text>
          <Tooltip title='Previous period'>
            <Button icon={<DoubleLeftOutlined />} onClick={() => setStartDate((s) => s.subtract(WINDOW, 'day'))} />
          </Tooltip>
          <Tooltip title='Back a day'>
            <Button icon={<LeftOutlined />} onClick={() => setStartDate((s) => s.subtract(1, 'day'))} />
          </Tooltip>
          <DatePicker value={startDate} onChange={(d) => d && setStartDate(d.startOf('day'))} allowClear={false} format='D/M/YYYY' />
          <Tooltip title='Forward a day'>
            <Button icon={<RightOutlined />} onClick={() => setStartDate((s) => s.add(1, 'day'))} />
          </Tooltip>
          <Tooltip title='Next period'>
            <Button icon={<DoubleRightOutlined />} onClick={() => setStartDate((s) => s.add(WINDOW, 'day'))} />
          </Tooltip>
          <Button onClick={() => setStartDate(dayjs().startOf('day'))}>Today</Button>
          <Tag
            color={unassigned.length ? 'gold' : 'default'}
            style={{ cursor: unassigned.length ? 'pointer' : 'default' }}
            onClick={() => unassigned.length && setTrayOpen(true)}
          >
            {`Unassigned (${unassigned.length})`}
          </Tag>
        </Space>
      </div>

      {armed && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#FFF7E6', border: '1px solid #FAAD14', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>
            Assigning <strong>{armed.booking_by?.fullName || 'Guest'}</strong>
            {` (${datesLabel(armed)}) — click a room to place it.`}
          </span>
          <Button size='small' onClick={() => setArmed(null)}>Cancel</Button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80 }}><Spin size='large' /></div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
          <div style={{ width: ROOM_COL_W + gridW, minWidth: '100%' }}>
            {/* month row */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ width: ROOM_COL_W, flexShrink: 0, borderRight: '1px solid #f0f0f0' }} />
              {monthGroups.map((g) => (
                <div key={g.label} style={{ width: g.count * CELL_W, flexShrink: 0, padding: '6px 8px', fontWeight: 600, color: '#888', fontSize: 13 }}>
                  {g.label}
                </div>
              ))}
            </div>
            {/* day header */}
            <div style={{ display: 'flex', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
              <div style={{ width: ROOM_COL_W, flexShrink: 0, padding: '8px 10px', fontWeight: 600, borderRight: '1px solid #f0f0f0' }}>Unit</div>
              {days.map((d) => {
                const today = d.isSame(dayjs(), 'day');
                const weekend = d.day() === 0 || d.day() === 6;
                return (
                  <div key={d.format(ISO)} style={{ width: CELL_W, flexShrink: 0, textAlign: 'center', padding: '4px 0', background: today ? '#fbf3f4' : (weekend ? '#fcfcfc' : '#fff'), borderRight: '1px solid #f5f5f5' }}>
                    <div style={{ fontWeight: 700, color: today ? '#7a2330' : '#2c2c2c' }}>{d.format('D')}</div>
                    <div style={{ fontSize: 11, color: '#999' }}>{d.format('ddd')}</div>
                  </div>
                );
              })}
            </div>
            {/* room rows */}
            {rooms.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>
                No rooms yet. Create rooms under Room Types → set units → Rooms → Assign floor to number them.
              </div>
            ) : rooms.map((room) => (
              <div key={room.id} style={{ display: 'flex', height: ROW_H, borderBottom: '1px solid #f5f5f5' }}>
                <div
                  onClick={() => armed && assignArmedTo(room)}
                  style={{ width: ROOM_COL_W, flexShrink: 0, padding: '0 10px', display: 'flex', alignItems: 'center', borderRight: '1px solid #f0f0f0', fontWeight: 500, cursor: armed ? 'copy' : 'default', background: armed ? '#fffbe6' : 'transparent' }}
                >
                  {room.room_name || <Text type='secondary'>—</Text>}
                </div>
                <div style={{ position: 'relative', width: gridW, flexShrink: 0 }}>
                  {days.map((d, i) => {
                    const weekend = d.day() === 0 || d.day() === 6;
                    return (
                      <div
                        key={d.format(ISO)}
                        role='button'
                        tabIndex={-1}
                        onClick={() => { if (armed) assignArmedTo(room); else if (room.room_name) openCreate(room, d); }}
                        style={{ position: 'absolute', left: i * CELL_W, top: 0, width: CELL_W, height: ROW_H, borderRight: '1px solid #f5f5f5', background: weekend ? '#fcfcfc' : '#fff', cursor: armed ? 'copy' : (room.room_name ? 'pointer' : 'default') }}
                      />
                    );
                  })}
                  {barsFor(room.id).map((bar) => {
                    const c = STATUS_COLORS[bar.status] || STATUS_COLORS.pending;
                    return (
                      <Tooltip key={bar.id} title={`${bar.label} · ${bar.from} → ${bar.to} · ${bar.status}`}>
                        <div
                          onClick={(e) => { e.stopPropagation(); setReservation(bar.booking); }}
                          style={{ position: 'absolute', left: bar.left, top: 4, height: ROW_H - 8, width: Math.max(bar.width, 12), background: c.bg, border: `1px solid ${c.border}`, borderRadius: 5, padding: '0 6px', fontSize: 12, color: c.text, display: 'flex', alignItems: 'center', overflow: 'hidden', whiteSpace: 'nowrap', cursor: 'pointer' }}
                        >
                          {bar.label}
                        </div>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ReservationDrawer booking={reservation} open={!!reservation} onClose={() => setReservation(null)} />

      <Drawer
        title={`Unassigned bookings (${unassigned.length})`}
        open={trayOpen}
        onClose={() => setTrayOpen(false)}
        width={360}
      >
        {unassigned.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='No unassigned bookings' />
        ) : unassigned.map((b) => (
          <div
            key={b.id}
            role='button'
            tabIndex={0}
            onClick={() => { setArmed(b); setTrayOpen(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { setArmed(b); setTrayOpen(false); } }}
            style={{ border: '1px solid #eee', borderRadius: 8, padding: '10px 12px', marginBottom: 8, cursor: 'pointer' }}
          >
            <div style={{ fontWeight: 600 }}>{b.booking_by?.fullName || b.booking_by?.userName || 'Guest'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{`${(b.booking_dates || []).length} night(s) · ${b.booking_status}`}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{datesLabel(b)}</div>
          </div>
        ))}
      </Drawer>

      <Modal
        title={modal.room ? `Book ${modal.room.room_name} — ${modal.date?.format('ddd, MMM D')}` : 'Book room'}
        open={modal.open}
        onCancel={() => setModal({ open: false, room: null, date: null })}
        onOk={submitBooking}
        okText='Create booking'
        confirmLoading={submitting}
        destroyOnClose
      >
        <div style={{ marginTop: 12 }}>
          <Text strong>Nights</Text>
          <div style={{ marginTop: 6 }}>
            <InputNumber min={1} max={60} value={nights} onChange={(v) => setNights(v)} style={{ width: 140 }} />
          </div>
          {modal.date && (
            <Text type='secondary' style={{ display: 'block', marginTop: 10 }}>
              {`${modal.date.format('MMM D')} → ${modal.date.add(Math.max(1, Number(nights) || 1), 'day').format('MMM D')}`}
            </Text>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default TapeChart;
