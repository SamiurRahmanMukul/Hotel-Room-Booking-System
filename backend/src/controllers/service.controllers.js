/**
 * Paid services CRUD (admin).
 */

const { errorResponse, successResponse } = require('../configs/app.response');

const TYPES = ['FoodAndBeverages', 'Other', 'CityTax', 'Parking'];
const DELIVERED = ['per_guest', 'per_unit', 'per_night'];
const PRICING = ['per_room', 'per_guest'];

function readAvailability(a) {
  const x = a || {};
  return {
    when: ['entire_stay', 'first_night', 'last_night'].includes(x.when) ? x.when : 'entire_stay',
    offeredDays: ['everyday', 'weekdays', 'weekends'].includes(x.offeredDays) ? x.offeredDays : 'everyday',
    nextDay: !!x.nextDay
  };
}
function readTr(t) {
  const bg = (t && t.bg) || {};
  return { bg: { name: bg.name || '', description: bg.description || '' } };
}

function shape(s) {
  return {
    id: s._id,
    name: s.name,
    code: s.code || '',
    serviceType: s.serviceType || 'Other',
    price: s.price || 0,
    vatPct: s.vatPct || 0,
    pricingMode: s.pricingMode || 'per_guest',
    deliveredTo: s.deliveredTo || 'per_guest',
    availability: readAvailability(s.availability),
    description: s.description || '',
    translations: readTr(s.translations)
  };
}

exports.getServicesList = async (req, res) => {
  try {
    const { Services } = req.M;
    const list = await Services.find().sort({ name: 1 }).lean();
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Services list', { rows: list.map(shape) }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.createService = async (req, res) => {
  try {
    const { Services } = req.M;
    const {
      name, code, serviceType, price, vatPct, pricingMode, deliveredTo, availability, description, translations
    } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Service name is required'));
    }
    const cleanCode = String(code || '').trim().toUpperCase();
    if (cleanCode) {
      const dupe = await Services.findOne({ code: cleanCode });
      if (dupe) return res.status(409).json(errorResponse(1, 'CONFLICT', 'A service with that code already exists'));
    }
    const created = await Services.create({
      name: String(name).trim(),
      code: cleanCode,
      serviceType: TYPES.includes(serviceType) ? serviceType : 'Other',
      price: Math.max(0, Number(price) || 0),
      vatPct: Math.max(0, Number(vatPct) || 0),
      pricingMode: PRICING.includes(pricingMode) ? pricingMode : 'per_guest',
      deliveredTo: DELIVERED.includes(deliveredTo) ? deliveredTo : 'per_guest',
      availability: readAvailability(availability),
      description: description || '',
      translations: readTr(translations)
    });
    return res.status(201).json(successResponse(0, 'SUCCESS', 'Service created', { id: created._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.updateService = async (req, res) => {
  try {
    const { Services } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid service id'));
    }
    const svc = await Services.findById(req.params.id);
    if (!svc) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Service not found'));

    const {
      name, code, serviceType, price, vatPct, pricingMode, deliveredTo, availability, description, translations
    } = req.body || {};
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json(errorResponse(1, 'FAILED', 'Name cannot be empty'));
      svc.name = String(name).trim();
    }
    if (code !== undefined) {
      const cleanCode = String(code || '').trim().toUpperCase();
      if (cleanCode) {
        const dupe = await Services.findOne({ code: cleanCode, _id: { $ne: svc._id } });
        if (dupe) return res.status(409).json(errorResponse(1, 'CONFLICT', 'Another service already uses that code'));
      }
      svc.code = cleanCode;
    }
    if (serviceType !== undefined && TYPES.includes(serviceType)) svc.serviceType = serviceType;
    if (price !== undefined) svc.price = Math.max(0, Number(price) || 0);
    if (vatPct !== undefined) svc.vatPct = Math.max(0, Number(vatPct) || 0);
    if (pricingMode !== undefined && PRICING.includes(pricingMode)) svc.pricingMode = pricingMode;
    if (deliveredTo !== undefined && DELIVERED.includes(deliveredTo)) svc.deliveredTo = deliveredTo;
    if (availability !== undefined) svc.availability = readAvailability(availability);
    if (description !== undefined) svc.description = description || '';
    if (translations !== undefined) svc.translations = readTr(translations);
    await svc.save();
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Service updated', { id: svc._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { Services } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid service id'));
    }
    const svc = await Services.findById(req.params.id);
    if (!svc) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Service not found'));
    await Services.deleteOne({ _id: svc._id });
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Service deleted', { id: svc._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};
