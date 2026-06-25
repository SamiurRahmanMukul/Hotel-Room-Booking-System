/**
 * Unit attribute CRUD (admin). Reusable tags attached to rooms (many-to-many).
 */

const { errorResponse, successResponse } = require('../configs/app.response');

exports.getAttributesList = async (req, res) => {
  try {
    const { Attributes } = req.M;
    const list = await Attributes.find().sort({ name: 1 }).lean();
    const rows = list.map((a) => ({ id: a._id, name: a.name, description: a.description || '' }));
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Attributes list', { rows }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.createAttribute = async (req, res) => {
  try {
    const { Attributes } = req.M;
    const { name, description } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Attribute name is required'));
    }
    const exists = await Attributes.findOne({ name: String(name).trim() });
    if (exists) {
      return res.status(409).json(errorResponse(1, 'CONFLICT', 'An attribute with that name already exists'));
    }
    const created = await Attributes.create({ name: String(name).trim(), description: description || '' });
    return res.status(201).json(successResponse(0, 'SUCCESS', 'Attribute created', { id: created._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.updateAttribute = async (req, res) => {
  try {
    const { Attributes } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid attribute id'));
    }
    const attr = await Attributes.findById(req.params.id);
    if (!attr) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Attribute not found'));

    const { name, description } = req.body || {};
    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json(errorResponse(1, 'FAILED', 'Name cannot be empty'));
      const dupe = await Attributes.findOne({ name: String(name).trim(), _id: { $ne: attr._id } });
      if (dupe) return res.status(409).json(errorResponse(1, 'CONFLICT', 'Another attribute already uses that name'));
      attr.name = String(name).trim();
    }
    if (description !== undefined) attr.description = description || '';
    await attr.save();
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Attribute updated', { id: attr._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

// delete an attribute and detach it from any rooms that have it
exports.deleteAttribute = async (req, res) => {
  try {
    const { Attributes, Rooms } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid attribute id'));
    }
    const attr = await Attributes.findById(req.params.id);
    if (!attr) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Attribute not found'));

    await Rooms.updateMany({ attributes: attr._id }, { $pull: { attributes: attr._id } });
    await Attributes.deleteOne({ _id: attr._id });
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Attribute deleted', { id: attr._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};
