/**
 * Cancellation / no-show policy CRUD (admin).
 */

const { errorResponse, successResponse } = require('../configs/app.response');

const TYPES = ['cancellation', 'noshow'];
const REFS = ['after_booking', 'before_arrival'];
const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

function readPeriod(p) {
  const x = p || {};
  return {
    months: Math.max(0, Number(x.months) || 0),
    days: Math.max(0, Number(x.days) || 0),
    hours: Math.max(0, Number(x.hours) || 0),
    reference: REFS.includes(x.reference) ? x.reference : 'before_arrival'
  };
}
function readFee(f) {
  const x = f || {};
  return { fixed: num(x.fixed), percent: num(x.percent) };
}
function readTr(t) {
  const bg = (t && t.bg) || {};
  return { bg: { name: bg.name || '', description: bg.description || '' } };
}
function shape(p) {
  return {
    id: p._id,
    type: p.type,
    code: p.code || '',
    name: p.name,
    description: p.description || '',
    translations: readTr(p.translations),
    period: readPeriod(p.period),
    fee: { fixed: p.fee?.fixed ?? null, percent: p.fee?.percent ?? null },
    vatType: p.vatType || 'Without'
  };
}

exports.getPoliciesList = async (req, res) => {
  try {
    const { Policies } = req.M;
    const q = TYPES.includes(req.query.type) ? { type: req.query.type } : {};
    const list = await Policies.find(q).sort({ type: 1, name: 1 }).lean();
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Policies list', { rows: list.map(shape) }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.createPolicy = async (req, res) => {
  try {
    const { Policies } = req.M;
    const {
      type, code, name, description, translations, period, fee, vatType
    } = req.body || {};
    if (!TYPES.includes(type)) return res.status(400).json(errorResponse(1, 'FAILED', 'Policy type must be cancellation or noshow'));
    if (!name || !String(name).trim()) return res.status(400).json(errorResponse(1, 'FAILED', 'English name is required'));
    const cleanCode = String(code || '').trim().toUpperCase();
    if (cleanCode) {
      const dupe = await Policies.findOne({ code: cleanCode });
      if (dupe) return res.status(409).json(errorResponse(1, 'CONFLICT', 'A policy with that code already exists'));
    }
    const created = await Policies.create({
      type,
      code: cleanCode,
      name: String(name).trim(),
      description: description || '',
      translations: readTr(translations),
      period: readPeriod(period),
      fee: readFee(fee),
      vatType: vatType || 'Without'
    });
    return res.status(201).json(successResponse(0, 'SUCCESS', 'Policy created', { id: created._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.updatePolicy = async (req, res) => {
  try {
    const { Policies } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid policy id'));
    const policy = await Policies.findById(req.params.id);
    if (!policy) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Policy not found'));

    const {
      code, name, description, translations, period, fee, vatType
    } = req.body || {};
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json(errorResponse(1, 'FAILED', 'Name cannot be empty'));
      policy.name = String(name).trim();
    }
    if (code !== undefined) {
      const cleanCode = String(code || '').trim().toUpperCase();
      if (cleanCode) {
        const dupe = await Policies.findOne({ code: cleanCode, _id: { $ne: policy._id } });
        if (dupe) return res.status(409).json(errorResponse(1, 'CONFLICT', 'Another policy already uses that code'));
      }
      policy.code = cleanCode;
    }
    if (description !== undefined) policy.description = description || '';
    if (translations !== undefined) policy.translations = readTr(translations);
    if (period !== undefined) policy.period = readPeriod(period);
    if (fee !== undefined) policy.fee = readFee(fee);
    if (vatType !== undefined) policy.vatType = vatType || 'Without';
    await policy.save();
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Policy updated', { id: policy._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.deletePolicy = async (req, res) => {
  try {
    const { Policies } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid policy id'));
    const policy = await Policies.findById(req.params.id);
    if (!policy) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Policy not found'));
    await Policies.deleteOne({ _id: policy._id });
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Policy deleted', { id: policy._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};
