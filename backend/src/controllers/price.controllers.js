/**
 * Price grid (apaleo "Prices"): nightly price per room type per date, with basePrice fallback.
 */

const { errorResponse, successResponse } = require('../configs/app.response');

function dayKey(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function iso(d) {
  return new Date(d).toISOString().slice(0, 10);
}

// GET /api/v1/prices?from=&to=  → room types + a flat { `${typeId}_${YYYY-MM-DD}`: amount } map
exports.getPriceGrid = async (req, res) => {
  try {
    const { RoomTypes, Prices } = req.M;
    const from = req.query.from ? dayKey(req.query.from) : dayKey(new Date());
    const to = req.query.to ? dayKey(req.query.to) : dayKey(new Date(Date.now() + 14 * 86400000));

    const types = await RoomTypes.find().sort({ rank: 1, createdAt: 1 }).lean();
    const prices = await Prices.find({ date: { $gte: from, $lt: to } }).lean();
    const map = {};
    prices.forEach((p) => { map[`${p.roomTypeId}_${iso(p.date)}`] = p.amount; });

    return res.status(200).json(successResponse(0, 'SUCCESS', 'Price grid', {
      from,
      to,
      roomTypes: types.map((t) => ({ id: t._id, name: t.name, basePrice: t.basePrice || 0 })),
      prices: map
    }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

// POST /api/v1/prices  body { updates: [{ roomTypeId, date, amount }] }  (amount null/'' clears the override)
exports.setPrices = async (req, res) => {
  try {
    const { Prices, RoomTypes } = req.M;
    const updates = Array.isArray(req.body && req.body.updates) ? req.body.updates : [];
    const defaults = Array.isArray(req.body && req.body.defaults) ? req.body.defaults : [];
    let saved = 0;
    let cleared = 0;
    let defaultsSet = 0;

    // default (base) price per room type — the fallback for any night without an override
    for (const d of defaults) {
      if (!/^[0-9a-fA-F]{24}$/.test(d.roomTypeId || '')) continue;
      // eslint-disable-next-line no-await-in-loop
      await RoomTypes.updateOne({ _id: d.roomTypeId }, { $set: { basePrice: Math.max(0, Number(d.basePrice) || 0) } });
      defaultsSet += 1;
    }
    for (const u of updates) {
      if (!/^[0-9a-fA-F]{24}$/.test(u.roomTypeId || '') || !u.date) continue;
      const date = dayKey(u.date);
      const amt = u.amount;
      if (amt === null || amt === '' || amt === undefined) {
        // eslint-disable-next-line no-await-in-loop
        await Prices.deleteOne({ roomTypeId: u.roomTypeId, date });
        cleared += 1;
      } else {
        // eslint-disable-next-line no-await-in-loop
        await Prices.updateOne(
          { roomTypeId: u.roomTypeId, date },
          { $set: { amount: Math.max(0, Number(amt) || 0) } },
          { upsert: true }
        );
        saved += 1;
      }
    }
    return res.status(200).json(successResponse(0, 'SUCCESS', `Saved ${saved}, cleared ${cleared}, defaults ${defaultsSet}`, { saved, cleared, defaultsSet }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};
