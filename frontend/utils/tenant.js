/**
 * Tenant resolution for the public booking site — the single source of truth for
 * "which hotel is this request serving?". Resolves the tenant slug the same way everywhere
 * (priority: explicit ?slug= → subdomain → env default), so callers stop reading env vars,
 * prop-drilling hotel ids, or hardcoding fallbacks.
 *
 * Used by:
 *   - utils/apiService.js   → attaches X-Hotel-Slug to every backend call
 *   - context/HotelContext  → resolves slug + fetches the hotel id/branding once
 *   - getServerSideProps    → getHotelSlugFromCtx(ctx) for SSR fetches
 */

export const DEFAULT_SLUG = process.env.NEXT_PUBLIC_DEFAULT_HOTEL_SLUG || 'default';

// hosts whose first label is NOT a tenant slug
const PLATFORM_LABELS = new Set(['localhost', '127', 'www', 'book', 'admin', 'api', 'sync']);

function slugFromHost(host) {
  if (!host) return null;
  const name = host.split(':')[0].toLowerCase();
  if (name === 'localhost' || name === '127.0.0.1') return null;
  const parts = name.split('.');
  // need <slug>.<something>.<tld> — a bare apex (example.com) has no tenant label
  if (parts.length < 3) return null;
  if (PLATFORM_LABELS.has(parts[0])) return null;
  return parts[0];
}

// NOTE: the tenant slug is resolved from the SUBDOMAIN (prod) or an explicit `?hotel=`
// override (dev), never from a route param — `/rooms/[slug]` already uses `slug` for the
// room, so reading `query.slug` here would resolve the wrong hotel.

/** Client-side slug resolution. Priority: subdomain → ?hotel= → env default. */
export function getHotelSlug() {
  if (typeof window !== 'undefined') {
    const fromHost = slugFromHost(window.location.host);
    if (fromHost) return fromHost;
    const fromQuery = new URLSearchParams(window.location.search).get('hotel');
    if (fromQuery) return fromQuery;
  }
  return DEFAULT_SLUG;
}

/** SSR slug resolution from a Next.js getServerSideProps context. */
export function getHotelSlugFromCtx(ctx) {
  const host = ctx && ctx.req && ctx.req.headers && ctx.req.headers.host;
  const fromHost = slugFromHost(host);
  if (fromHost) return fromHost;
  const h = ctx && ctx.query && ctx.query.hotel;
  if (h) return String(h);
  return DEFAULT_SLUG;
}

/** Header object to attach the tenant slug to a backend request. */
export function tenantHeaders(slug) {
  return { 'X-Hotel-Slug': slug || getHotelSlug() };
}
