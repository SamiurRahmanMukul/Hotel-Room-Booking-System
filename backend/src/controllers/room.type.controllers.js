/**
 * Room type (= apaleo unit group) CRUD (admin).
 *
 * Setting a type's Total units GENERATES that many physical rooms (born unassigned — no
 * number/floor); floors + numbers are assigned later in Hotel Rooms. `totalUnits` is always
 * = the number of rooms. Pricing and bed config are NOT on this form (priced via rate plans;
 * bed config is per physical room).
 */

const { errorResponse, successResponse } = require('../configs/app.response');

const CATEGORIES = ['BedRoom', 'MeetingRoom', 'EventSpace', 'ParkingLot'];

function readTranslations(t) {
  const bg = (t && t.bg) || {};
  return { bg: { name: bg.name || '', description: bg.description || '' } };
}

// Generate or remove physical rooms so the type has exactly `quantity` of them.
// Never removes a room with an active booking; removes unassigned (un-numbered) rooms first.
async function syncRoomsToQuantity(req, type, quantity) {
  const { Rooms, Bookings } = req.M;
  const target = Math.max(0, Number(quantity) || 0);
  const current = await Rooms.countDocuments({ roomTypeId: type._id });

  if (target > current) {
    const docs = Array.from({ length: target - current }, () => ({
      room_name: '',
      room_slug: '',
      roomTypeId: type._id,
      floor: '',
      condition: 'Clean',
      room_price: type.basePrice || 0,
      room_capacity: type.capacity || 1,
      room_status: 'available',
      created_by: req.user.id
    }));
    await Rooms.insertMany(docs);
  } else if (target < current) {
    const toRemove = current - target;
    const active = await Bookings.distinct('room_id', { booking_status: { $in: ['pending', 'approved', 'in-reviews'] } });
    const activeSet = new Set(active.filter(Boolean).map(String));
    const rooms = await Rooms.find({ roomTypeId: type._id }).lean();
    const removable = rooms
      .filter((r) => !activeSet.has(String(r._id)))
      .sort((a, b) => (a.room_name ? 1 : 0) - (b.room_name ? 1 : 0)); // unassigned first
    const ids = removable.slice(0, toRemove).map((r) => r._id);
    if (ids.length) await Rooms.deleteMany({ _id: { $in: ids } });
  }

  const finalCount = await Rooms.countDocuments({ roomTypeId: type._id });
  type.totalUnits = finalCount;
  await type.save();
  return finalCount;
}

exports.getRoomTypesList = async (req, res) => {
  try {
    const { RoomTypes, Rooms } = req.M;
    const types = await RoomTypes.find().sort({ rank: 1, createdAt: 1 }).lean();
    const rows = await Promise.all(types.map(async (t) => {
      const roomCount = await Rooms.countDocuments({ roomTypeId: t._id });
      return {
        id: t._id,
        name: t.name,
        description: t.description || '',
        category: t.category || 'BedRoom',
        capacity: t.capacity,
        rank: t.rank || 0,
        translations: readTranslations(t.translations),
        totalUnits: roomCount,
        roomCount
      };
    }));
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Room types list', { rows }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.createRoomType = async (req, res) => {
  try {
    const { RoomTypes } = req.M;
    const {
      name, description, category, capacity, rank, translations, totalUnits
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'English name is required'));
    }
    const exists = await RoomTypes.findOne({ name: String(name).trim() });
    if (exists) {
      return res.status(409).json(errorResponse(1, 'CONFLICT', 'A room type with that name already exists'));
    }

    const created = await RoomTypes.create({
      name: String(name).trim(),
      description: description || '',
      category: CATEGORIES.includes(category) ? category : 'BedRoom',
      capacity: Math.max(1, Number(capacity) || 1),
      rank: Number(rank) || 0,
      translations: readTranslations(translations),
      totalUnits: 0
    });
    const finalCount = await syncRoomsToQuantity(req, created, totalUnits);
    return res.status(201).json(successResponse(0, 'SUCCESS', 'Room type created', { id: created._id, totalUnits: finalCount }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

exports.updateRoomType = async (req, res) => {
  try {
    const { RoomTypes, Rooms } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid room type id'));
    }
    const type = await RoomTypes.findById(req.params.id);
    if (!type) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Room type not found'));

    const {
      name, description, category, capacity, rank, translations, totalUnits
    } = req.body || {};

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json(errorResponse(1, 'FAILED', 'Name cannot be empty'));
      const dupe = await RoomTypes.findOne({ name: String(name).trim(), _id: { $ne: type._id } });
      if (dupe) return res.status(409).json(errorResponse(1, 'CONFLICT', 'Another room type already uses that name'));
      type.name = String(name).trim();
    }
    if (description !== undefined) type.description = description || '';
    if (category !== undefined && CATEGORIES.includes(category)) type.category = category;
    if (capacity !== undefined) type.capacity = Math.max(1, Number(capacity) || 1);
    if (rank !== undefined) type.rank = Number(rank) || 0;
    if (translations !== undefined) type.translations = readTranslations(translations);

    if (capacity !== undefined) await Rooms.updateMany({ roomTypeId: type._id }, { room_capacity: type.capacity });

    let finalCount;
    if (totalUnits !== undefined) {
      finalCount = await syncRoomsToQuantity(req, type, totalUnits);
    } else {
      finalCount = await Rooms.countDocuments({ roomTypeId: type._id });
      type.totalUnits = finalCount;
      await type.save();
    }
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Room type updated', { id: type._id, totalUnits: finalCount }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

// delete a room type and its rooms — blocked only if a room has an active booking
exports.deleteRoomType = async (req, res) => {
  try {
    const { RoomTypes, Rooms, Bookings } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid room type id'));
    }
    const type = await RoomTypes.findById(req.params.id);
    if (!type) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Room type not found'));

    const activeBookings = await Bookings.countDocuments({
      roomTypeId: type._id,
      booking_status: { $in: ['pending', 'approved', 'in-reviews'] }
    });
    if (activeBookings > 0) {
      return res.status(409).json(errorResponse(1, 'CONFLICT', `Cannot delete: ${activeBookings} active booking(s) use this type.`));
    }

    await Rooms.deleteMany({ roomTypeId: type._id });
    await RoomTypes.deleteOne({ _id: type._id });
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Room type deleted', { id: type._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};
