/**
 * Renders the current hotel's logo on the public booking site.
 * Reads name + branding from the shared HotelContext (resolved/fetched once there) instead
 * of resolving the slug and fetching branding itself. Falls back to a clean wordmark.
 */

import React from 'react';
import { useHotel } from '../../context/HotelContext';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

function HotelLogo() {
  const { name, branding } = useHotel();
  const logo = branding?.logoUrl;
  const full = logo ? (logo.startsWith('http') ? logo : `${API}${logo}`) : null;

  if (full) {
    return (
      <img
        src={full}
        alt={name || 'Hotel'}
        style={{ height: 56, maxWidth: 280, objectFit: 'contain' }}
      />
    );
  }
  return (
    <span style={{
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif', fontWeight: 600, fontSize: 22, color: '#2C2C2C', letterSpacing: '-0.01em'
    }}
    >
      {name || 'Hotel'}
    </span>
  );
}

export default HotelLogo;
