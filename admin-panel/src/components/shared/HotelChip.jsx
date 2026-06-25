/* eslint-disable object-property-newline, object-curly-newline, react/jsx-one-expression-per-line, react/jsx-max-props-per-line, operator-linebreak */
import { SettingOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../../utils/apiService';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function HotelChip() {
  const navigate = useNavigate();
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem('hotel_branding_v1') || 'null'); } catch { return null; }
  });

  useEffect(() => {
    Promise.all([
      ApiService.get('/api/v1/me').catch(() => null),
      ApiService.get('/api/v1/hotel-settings').catch(() => null)
    ]).then(([me, s]) => {
      const merged = {
        name: s?.name || me?.hotel?.name || 'Hotel',
        logoUrl: s?.branding?.logoUrl || null
      };
      setData(merged);
      try { localStorage.setItem('hotel_branding_v1', JSON.stringify(merged)); } catch { /* noop */ }
    });
  }, []);

  const name = data?.name || 'Hotel';
  const initial = name.trim().charAt(0).toUpperCase();
  const fullLogoUrl = data?.logoUrl
    ? (data.logoUrl.startsWith('http') ? data.logoUrl : `${API_BASE}${data.logoUrl}`)
    : null;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      onClick={() => navigate('/main/hotel-settings')}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        margin: 8,
        cursor: 'pointer',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        transition: 'background 0.15s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
      title='Open hotel settings'
    >
      {fullLogoUrl ? (
        <img
          src={fullLogoUrl} alt={name}
          style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0, background: '#fff' }}
        />
      ) : (
        <div
          style={{
            width: 32, height: 32, borderRadius: 6,
            background: '#853953', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 14, flexShrink: 0
          }}
        >
          {initial}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          letterSpacing: '-0.01em'
        }}
        >
          {name}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.45)', fontSize: 11,
          display: 'flex', alignItems: 'center', gap: 4
        }}
        >
          <SettingOutlined style={{ fontSize: 10 }} /> Hotel settings
        </div>
      </div>
    </div>
  );
}

export default HotelChip;
