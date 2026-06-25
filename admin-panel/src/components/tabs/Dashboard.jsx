/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak */
/* eslint-disable jsx-quotes, no-confusing-arrow, no-underscore-dangle */
/* eslint-disable react/no-unstable-nested-components, react/jsx-max-props-per-line */
/* eslint-disable react/jsx-curly-newline, react/jsx-first-prop-new-line */
/* eslint-disable react/jsx-closing-tag-location, object-property-newline */
/* eslint-disable react/no-array-index-key, prefer-destructuring */
/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
/* eslint-disable react/no-unescaped-entities, no-nested-ternary, jsx-a11y/no-noninteractive-tabindex */
import {
  ApartmentOutlined, ArrowRightOutlined, BankOutlined, CalendarOutlined, ClockCircleOutlined,
  CloseCircleOutlined, HomeOutlined, TeamOutlined
} from '@ant-design/icons';
import { Button, Progress, Result, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../utils/apiService';
import OnboardingChecklist from '../dashboard/OnboardingChecklist';

function StatCard({ icon, label, value, sub, accent, onClick, progress }) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      style={{
        background: '#fff',
        border: '1px solid rgba(44,44,44,0.08)',
        borderRadius: 10,
        padding: '16px 18px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minHeight: 116
      }}
      onMouseEnter={(e) => { if (onClick) e.currentTarget.style.borderColor = '#853953'; }}
      onMouseLeave={(e) => { if (onClick) e.currentTarget.style.borderColor = 'rgba(44,44,44,0.08)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          color: '#6B6B6B', fontSize: 11, fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.04em',
          display: 'inline-flex', alignItems: 'center', gap: 6
        }}
        >
          {icon} {label}
        </span>
        {onClick && <ArrowRightOutlined style={{ color: '#9CA3AF', fontSize: 11 }} />}
      </div>
      <div style={{
        fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em',
        color: accent || '#2C2C2C', lineHeight: 1.05
      }}
      >
        {value}
      </div>
      {sub && <div style={{ color: '#9CA3AF', fontSize: 12 }}>{sub}</div>}
      {progress !== undefined && (
        <Progress percent={progress} size='small' showInfo={false} strokeColor='#853953' style={{ marginTop: 2 }} />
      )}
    </div>
  );
}

function Dashboard({ propertyComplete = null, goTo = () => {} }) {
  const navigate = useNavigate();
  const [dash, setDash] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      ApiService.get('/api/v1/dashboard').catch(() => null),
      ApiService.get('/api/v1/get-all-booking-orders?limit=500').catch(() => null)
    ]).then(([d, b]) => {
      if (cancelled) return;
      setDash(d?.result?.data || null);
      setBookings(b?.result?.data?.rows || []);
    }).catch((err) => {
      if (cancelled) return;
      setError(err.message);
    });
    return () => { cancelled = true; };
  }, []);

  const metrics = useMemo(() => {
    const totalRooms = dash?.rooms_info?.total_rooms || 0;
    const bookedRooms = dash?.rooms_info?.booked_rooms || 0;
    const availableRooms = dash?.rooms_info?.available_rooms || 0;
    const occupancy = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 100) : 0;
    const todayStr = dayjs().format('YYYY-MM-DD');
    const last24h = dayjs().subtract(24, 'hour');

    let guestsInHotel = 0;
    let checkInsToday = 0;
    let checkOutsToday = 0;
    let cancellations24h = 0;

    bookings.forEach((b) => {
      const dates = (b.booking_dates || []).map((d) => dayjs(d).format('YYYY-MM-DD')).sort();
      const first = dates[0];
      const last = dates[dates.length - 1];
      const includesToday = dates.includes(todayStr);
      const totalGuests = (b.guests?.adults || 1) + (b.guests?.children || 0) + (b.guests?.infants || 0);
      if (b.booking_status === 'approved' && includesToday) guestsInHotel += totalGuests;
      if (b.booking_status === 'approved' && first === todayStr) checkInsToday += 1;
      if (b.booking_status === 'approved' && last === todayStr) checkOutsToday += 1;
      if ((b.booking_status === 'cancel' || b.booking_status === 'rejected')
        && dayjs(b.updated_at || b.created_at).isAfter(last24h)) cancellations24h += 1;
    });

    return {
      totalRooms, bookedRooms, availableRooms, occupancy,
      pending: dash?.booking_info?.pending_booking || 0,
      guestsInHotel, checkInsToday, checkOutsToday, cancellations24h
    };
  }, [dash, bookings]);

  if (error) return <Result title='Failed to fetch' subTitle={error} status='error' />;

  // Setup gate: a brand-new hotel's first task is to capture the property.
  if (propertyComplete === false) {
    return (
      <div style={{ padding: 24, maxWidth: 720, margin: '48px auto', textAlign: 'center' }}>
        <BankOutlined style={{ fontSize: 48, color: '#853953' }} />
        <Typography.Title level={3} style={{ marginTop: 16 }}>Welcome! First, create your hotel property</Typography.Title>
        <Typography.Paragraph type='secondary'>
          Before adding room types, rooms, or taking bookings, set up your hotel's property details.
        </Typography.Paragraph>
        <Button type='primary' size='large' icon={<ArrowRightOutlined />} onClick={() => goTo('property')}>
          Create hotel property
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Dashboard
          </Typography.Title>
          <Typography.Text type='secondary'>
            At a glance — occupancy, guests in house, and what needs your attention.
          </Typography.Text>
        </div>
        <Button type='primary' icon={<ApartmentOutlined />} onClick={() => goTo('room-types')}>
          Hotel &amp; units setup
        </Button>
      </div>

      <div style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 320px) 1fr',
        gap: 16,
        alignItems: 'start'
      }}
      >
        <div>
          <OnboardingChecklist />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <StatCard
            icon={<HomeOutlined />}
            label='Occupancy'
            value={`${metrics.occupancy}%`}
            sub={`${metrics.bookedRooms} of ${metrics.totalRooms} rooms in use`}
            accent={metrics.occupancy > 80 ? '#3F7D58' : metrics.occupancy > 40 ? '#C8923A' : '#2C2C2C'}
            progress={metrics.occupancy}
            onClick={() => navigate('/main/hotel-rooms')}
          />
          <StatCard
            icon={<BankOutlined />}
            label='Rooms available'
            value={metrics.availableRooms}
            sub={`of ${metrics.totalRooms} total`}
            accent='#3F7D58'
            onClick={() => navigate('/main/hotel-rooms')}
          />
          <StatCard
            icon={<TeamOutlined />}
            label='Guests in hotel'
            value={metrics.guestsInHotel}
            sub={metrics.guestsInHotel > 0 ? 'staying tonight' : 'no guests today'}
            onClick={() => navigate('/main/booking-orders')}
          />
          <StatCard
            icon={<ClockCircleOutlined />}
            label='Awaiting action'
            value={metrics.pending}
            sub={metrics.pending > 0 ? 'pending bookings' : 'all caught up'}
            accent={metrics.pending > 0 ? '#C8923A' : '#2C2C2C'}
            onClick={() => navigate('/main/booking-orders')}
          />
          <StatCard
            icon={<CalendarOutlined />}
            label='Check-ins today'
            value={metrics.checkInsToday}
            sub={metrics.checkOutsToday > 0 ? `${metrics.checkOutsToday} check-out${metrics.checkOutsToday !== 1 ? 's' : ''}` : 'no check-ins'}
            onClick={() => navigate('/main/booking-orders')}
          />
          <StatCard
            icon={<CloseCircleOutlined />}
            label='Cancellations 24h'
            value={metrics.cancellations24h}
            sub='last 24 hours'
            accent={metrics.cancellations24h > 0 ? '#A4243B' : '#2C2C2C'}
            onClick={() => navigate('/main/booking-orders')}
          />
        </div>
      </div>
    </div>
  );
}

export default React.memo(Dashboard);
