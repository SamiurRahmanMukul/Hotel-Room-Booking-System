import { differenceInCalendarDays, format, isAfter, startOfDay } from 'date-fns';
import PropTypes from 'prop-types';
import React, { useEffect, useMemo, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/style.css';

const SYNC_BASE = process.env.NEXT_PUBLIC_CALENDAR_SYNC_URL || 'http://localhost:8001';

function formatPrice(amount, currency = 'EUR') {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

function BookingCalendar({
  hotelId, roomTypeId, basePrice, currency, onChange
}) {
  const [range, setRange] = useState();
  const [blockedDates, setBlockedDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hotelId || !roomTypeId) return;
    let cancelled = false;
    const from = new Date();
    const to = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
    setLoading(true);
    fetch(`${SYNC_BASE}/availability/${hotelId}/${roomTypeId}?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const blocked = (data.days || [])
          .filter((d) => (d.blockedUnits || 0) >= (d.totalUnits || 1))
          .map((d) => startOfDay(new Date(d.date)));
        setBlockedDates(blocked);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [hotelId, roomTypeId]);

  const nights = useMemo(() => {
    if (!range?.from || !range?.to) return 0;
    return Math.max(1, differenceInCalendarDays(range.to, range.from));
  }, [range]);

  const total = nights * (basePrice || 0);

  useEffect(() => {
    if (!onChange) return;
    onChange({ from: range?.from, to: range?.to, nights, total });
  }, [range, nights, total, onChange]);

  const today = startOfDay(new Date());
  const disabled = [{ before: today }, ...blockedDates];

  return (
    <div className='booking-calendar'>
      <style jsx global>{`
        .booking-calendar .rdp-root {
          --rdp-accent-color: #1677ff;
          --rdp-accent-background-color: #e6f4ff;
          --rdp-day_button-height: 48px;
          --rdp-day_button-width: 48px;
          --rdp-day-height: 48px;
          --rdp-day-width: 48px;
          font-family: inherit;
        }
        .booking-calendar .rdp-month_caption { font-size: 1rem; font-weight: 600; }
        .booking-calendar .rdp-day_button {
          font-weight: 500;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 4px 0;
        }
        .booking-calendar .rdp-disabled .rdp-day_button {
          color: #c0c0c0; text-decoration: line-through; cursor: not-allowed;
        }
        .booking-calendar .rdp-range_middle .rdp-day_button {
          background: var(--rdp-accent-background-color);
          border-radius: 0;
        }
        .booking-calendar .rdp-range_start .rdp-day_button,
        .booking-calendar .rdp-range_end .rdp-day_button {
          background: var(--rdp-accent-color);
          color: white;
        }
        .booking-calendar .price-label {
          display: block;
          font-size: 0.65rem;
          line-height: 1;
          margin-top: 2px;
          color: #ADADAD;
        }
        .booking-calendar .rdp-range_start .price-label,
        .booking-calendar .rdp-range_end .price-label {
          color: #fff;
        }
      `}
      </style>

      {error && (
        <div style={{ background: '#fff2f0', border: '1px solid #ffccc7', padding: 8, borderRadius: 4, marginBottom: 12, color: '#a8071a', fontSize: 13 }}>
          Calendar data temporarily unavailable. You can still pick dates.
        </div>
      )}

      <DayPicker
        mode='range'
        numberOfMonths={2}
        selected={range}
        onSelect={setRange}
        disabled={disabled}
        showOutsideDays={false}
        components={{
          DayButton: (props) => {
            const { day, modifiers, ...rest } = props;
            const isPast = isAfter(today, day.date);
            const isBlocked = modifiers.disabled && !isPast;
            return (
              <button type='button' {...rest}>
                <div>{day.date.getDate()}</div>
                {!isPast && !isBlocked && basePrice ? (
                  <span className='price-label'>{formatPrice(basePrice, currency)}</span>
                ) : null}
              </button>
            );
          }
        }}
      />

      <div style={{
        marginTop: 16, padding: 12, background: '#fafafa', borderRadius: 8, fontSize: 14
      }}
      >
        {!range?.from && !range?.to && (
          <span style={{ color: '#8c8c8c' }}>{loading ? 'Loading availability…' : 'Select your check-in and check-out dates'}</span>
        )}
        {range?.from && !range?.to && (
          <span>Check-in: <strong>{format(range.from, 'EEE, MMM d, yyyy')}</strong> — pick check-out</span>
        )}
        {range?.from && range?.to && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div>
              <div><strong>{format(range.from, 'MMM d')}</strong> → <strong>{format(range.to, 'MMM d, yyyy')}</strong></div>
              <div style={{ color: '#8c8c8c', fontSize: 13 }}>{nights} night{nights !== 1 ? 's' : ''}</div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{formatPrice(total, currency)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

BookingCalendar.defaultProps = {
  basePrice: 0,
  currency: 'EUR',
  onChange: null
};

BookingCalendar.propTypes = {
  hotelId: PropTypes.string.isRequired,
  roomTypeId: PropTypes.string.isRequired,
  basePrice: PropTypes.number,
  currency: PropTypes.string,
  onChange: PropTypes.func
};

export default BookingCalendar;
