/* eslint-disable object-curly-newline */
/**
 * Curated country list with default currency + IANA timezone.
 * Just the most common ones — enough for onboarding presets.
 * Order: alphabetical by name.
 */

const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED', timezone: 'Asia/Dubai' },
  { code: 'AL', name: 'Albania', currency: 'ALL', timezone: 'Europe/Tirane' },
  { code: 'AR', name: 'Argentina', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' },
  { code: 'AT', name: 'Austria', currency: 'EUR', timezone: 'Europe/Vienna' },
  { code: 'AU', name: 'Australia', currency: 'AUD', timezone: 'Australia/Sydney' },
  { code: 'BE', name: 'Belgium', currency: 'EUR', timezone: 'Europe/Brussels' },
  { code: 'BG', name: 'Bulgaria', currency: 'BGN', timezone: 'Europe/Sofia' },
  { code: 'BR', name: 'Brazil', currency: 'BRL', timezone: 'America/Sao_Paulo' },
  { code: 'CA', name: 'Canada', currency: 'CAD', timezone: 'America/Toronto' },
  { code: 'CH', name: 'Switzerland', currency: 'CHF', timezone: 'Europe/Zurich' },
  { code: 'CL', name: 'Chile', currency: 'CLP', timezone: 'America/Santiago' },
  { code: 'CN', name: 'China', currency: 'CNY', timezone: 'Asia/Shanghai' },
  { code: 'CO', name: 'Colombia', currency: 'COP', timezone: 'America/Bogota' },
  { code: 'CY', name: 'Cyprus', currency: 'EUR', timezone: 'Asia/Nicosia' },
  { code: 'CZ', name: 'Czech Republic', currency: 'CZK', timezone: 'Europe/Prague' },
  { code: 'DE', name: 'Germany', currency: 'EUR', timezone: 'Europe/Berlin' },
  { code: 'DK', name: 'Denmark', currency: 'DKK', timezone: 'Europe/Copenhagen' },
  { code: 'EG', name: 'Egypt', currency: 'EGP', timezone: 'Africa/Cairo' },
  { code: 'ES', name: 'Spain', currency: 'EUR', timezone: 'Europe/Madrid' },
  { code: 'FI', name: 'Finland', currency: 'EUR', timezone: 'Europe/Helsinki' },
  { code: 'FR', name: 'France', currency: 'EUR', timezone: 'Europe/Paris' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP', timezone: 'Europe/London' },
  { code: 'GR', name: 'Greece', currency: 'EUR', timezone: 'Europe/Athens' },
  { code: 'HK', name: 'Hong Kong', currency: 'HKD', timezone: 'Asia/Hong_Kong' },
  { code: 'HR', name: 'Croatia', currency: 'EUR', timezone: 'Europe/Zagreb' },
  { code: 'HU', name: 'Hungary', currency: 'HUF', timezone: 'Europe/Budapest' },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', timezone: 'Asia/Jakarta' },
  { code: 'IE', name: 'Ireland', currency: 'EUR', timezone: 'Europe/Dublin' },
  { code: 'IL', name: 'Israel', currency: 'ILS', timezone: 'Asia/Jerusalem' },
  { code: 'IN', name: 'India', currency: 'INR', timezone: 'Asia/Kolkata' },
  { code: 'IS', name: 'Iceland', currency: 'ISK', timezone: 'Atlantic/Reykjavik' },
  { code: 'IT', name: 'Italy', currency: 'EUR', timezone: 'Europe/Rome' },
  { code: 'JP', name: 'Japan', currency: 'JPY', timezone: 'Asia/Tokyo' },
  { code: 'KR', name: 'South Korea', currency: 'KRW', timezone: 'Asia/Seoul' },
  { code: 'MA', name: 'Morocco', currency: 'MAD', timezone: 'Africa/Casablanca' },
  { code: 'MT', name: 'Malta', currency: 'EUR', timezone: 'Europe/Malta' },
  { code: 'MX', name: 'Mexico', currency: 'MXN', timezone: 'America/Mexico_City' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur' },
  { code: 'NL', name: 'Netherlands', currency: 'EUR', timezone: 'Europe/Amsterdam' },
  { code: 'NO', name: 'Norway', currency: 'NOK', timezone: 'Europe/Oslo' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD', timezone: 'Pacific/Auckland' },
  { code: 'PE', name: 'Peru', currency: 'PEN', timezone: 'America/Lima' },
  { code: 'PH', name: 'Philippines', currency: 'PHP', timezone: 'Asia/Manila' },
  { code: 'PL', name: 'Poland', currency: 'PLN', timezone: 'Europe/Warsaw' },
  { code: 'PT', name: 'Portugal', currency: 'EUR', timezone: 'Europe/Lisbon' },
  { code: 'RO', name: 'Romania', currency: 'RON', timezone: 'Europe/Bucharest' },
  { code: 'RS', name: 'Serbia', currency: 'RSD', timezone: 'Europe/Belgrade' },
  { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', timezone: 'Asia/Riyadh' },
  { code: 'SE', name: 'Sweden', currency: 'SEK', timezone: 'Europe/Stockholm' },
  { code: 'SG', name: 'Singapore', currency: 'SGD', timezone: 'Asia/Singapore' },
  { code: 'SI', name: 'Slovenia', currency: 'EUR', timezone: 'Europe/Ljubljana' },
  { code: 'SK', name: 'Slovakia', currency: 'EUR', timezone: 'Europe/Bratislava' },
  { code: 'TH', name: 'Thailand', currency: 'THB', timezone: 'Asia/Bangkok' },
  { code: 'TR', name: 'Türkiye', currency: 'TRY', timezone: 'Europe/Istanbul' },
  { code: 'UA', name: 'Ukraine', currency: 'UAH', timezone: 'Europe/Kyiv' },
  { code: 'US', name: 'United States', currency: 'USD', timezone: 'America/New_York' },
  { code: 'VN', name: 'Vietnam', currency: 'VND', timezone: 'Asia/Ho_Chi_Minh' },
  { code: 'ZA', name: 'South Africa', currency: 'ZAR', timezone: 'Africa/Johannesburg' }
];

export const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({ value: c.code, label: c.name }));

export function findCountry(code) {
  return COUNTRIES.find((c) => c.code === code);
}

export default COUNTRIES;
