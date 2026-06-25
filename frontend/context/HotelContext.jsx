/**
 * HotelContext — resolves the current tenant once and fetches its id + branding, then
 * provides them to the whole booking site. Components read useHotel() instead of reaching
 * for NEXT_PUBLIC_DEFAULT_HOTEL_ID, prop-drilling a hotel id, or hardcoding fallbacks.
 *
 * `hotelId` is the platform hotel _id — the same id the calendar-sync worker keys
 * availability by, so BookingCalendar can fetch the right cells.
 */

import PropTypes from 'prop-types';
import React, {
  createContext, useContext, useEffect, useMemo, useState
} from 'react';
import { getHotelSlug } from '../utils/tenant';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

const HotelContext = createContext({
  slug: 'default', hotelId: null, name: 'Hotel', branding: {}, tagline: '', loading: true
});

export function HotelProvider({ children }) {
  const slug = getHotelSlug();
  const [data, setData] = useState({
    slug, hotelId: null, name: 'Hotel', branding: {}, tagline: '', loading: true
  });

  useEffect(() => {
    let cancelled = false;
    setData((prev) => ({ ...prev, slug, loading: true }));
    fetch(`${API}/api/v1/public/branding`, { headers: { 'X-Hotel-Slug': slug } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        setData({
          slug,
          hotelId: d?.hotelId || process.env.NEXT_PUBLIC_DEFAULT_HOTEL_ID || null,
          name: d?.name || 'Hotel',
          branding: d?.branding || {},
          tagline: d?.tagline || '',
          loading: false
        });
      })
      .catch(() => { if (!cancelled) setData((prev) => ({ ...prev, loading: false })); });
    return () => { cancelled = true; };
  }, [slug]);

  const value = useMemo(() => data, [data]);
  return <HotelContext.Provider value={value}>{children}</HotelContext.Provider>;
}

HotelProvider.propTypes = { children: PropTypes.node };
HotelProvider.defaultProps = { children: null };

export function useHotel() {
  return useContext(HotelContext);
}
