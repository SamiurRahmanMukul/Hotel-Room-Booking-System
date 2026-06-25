/**
 * Unit attribute (apaleo) — a reusable tag a hotel defines once (e.g. Balcony, Street view,
 * King bed) and attaches to many rooms. Rooms reference attributes by id (many-to-many).
 */

const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Attribute name is required'], trim: true },
  description: { type: String, default: '' }
}, { timestamps: true });

attributeSchema.index({ name: 1 }, { unique: true });

const MODEL_NAME = 'Attributes';
const register = (conn) => conn.models[MODEL_NAME] || conn.model(MODEL_NAME, attributeSchema);

module.exports = { schema: attributeSchema, modelName: MODEL_NAME, register };
