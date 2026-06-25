const ical = require('node-ical');

function eachDateInRange(start, end) {
  const out = [];
  const cursor = new Date(start);
  cursor.setUTCHours(0, 0, 0, 0);
  const stop = new Date(end);
  stop.setUTCHours(0, 0, 0, 0);
  while (cursor < stop) {
    out.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

async function fetchAndParse(icalUrl) {
  const data = await ical.async.fromURL(icalUrl);
  const events = [];
  for (const k of Object.keys(data)) {
    const v = data[k];
    if (v.type !== 'VEVENT') continue;
    if (!v.start || !v.end) continue;
    events.push({
      externalId: v.uid || `${v.start.toISOString()}_${v.end.toISOString()}`,
      summary: v.summary || 'Booked',
      start: new Date(v.start),
      end: new Date(v.end),
      raw: v
    });
  }
  return events;
}

module.exports = { fetchAndParse, eachDateInRange };
