/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const fs = require('fs');
const appRoot = require('app-root-path');
const logger = require('../middleware/winston.logger');
const { errorResponse, successResponse } = require('../configs/app.response');
const MyQueryHelper = require('../configs/api.feature');
const { cleanupUploadedFiles } = require('../lib/cleanup.files');

// TODO: Controller for create new room
exports.createRoom = async (req, res) => {
  try {
    const { Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review } = req.M;

    const {
      room_name, room_slug, room_type, room_price, room_size, room_capacity, allow_pets, provide_breakfast, featured_room, room_description, extra_facilities
    } = req.body;

    // check `room_name` filed exits
    if (!room_name) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_name` filed is required'
      ));
    }

    // check `room_slug` filed exits
    if (!room_slug) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_slug` filed is required'
      ));
    }

    // check `room_type` filed exits
    if (!room_type) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_type` filed is required'
      ));
    }

    // check `room_price` is positive
    if (!room_price || Number(room_price) <= 0) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_price` filed is required'
      ));
    }

    // check `room_size` filed exits
    if (!room_size) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_size` filed is required'
      ));
    }

    // check `room_capacity` filed exits
    if (!room_capacity) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_capacity` filed is required'
      ));
    }

    // check `room_description` filed exits
    if (!room_description) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_description` filed is required'
      ));
    }

    // check `extra_facilities[0]` filed exits
    if (!extra_facilities[0]) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Minimum 1 `extra_facilities` filed is required'
      ));
    }

    // check `req.files[0]` filed exits
    if (!req.files[0]) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Minimum 1 `room_images` filed is required '
      ));
    }

    // check `room_name` already exist in database
    const roomName = await Room.findOne({ room_name });
    if (roomName) {
      cleanupUploadedFiles(req);
      return res.status(409).json(errorResponse(
        9,
        'ALREADY EXIST',
        'Sorry, `room_name` already exists'
      ));
    }

    // check `room_slug` already exist in database
    const roomSlug = await Room.findOne({ room_slug });
    if (roomSlug) {
      cleanupUploadedFiles(req);
      return res.status(409).json(errorResponse(
        9,
        'ALREADY EXIST',
        'Sorry, `room_slug` already exists'
      ));
    }

    // prepared user input room data to store database
    const data = {
      room_name,
      room_slug,
      room_type,
      room_price,
      room_size,
      room_capacity,
      allow_pets,
      provide_breakfast,
      featured_room,
      room_description,
      extra_facilities,
      room_images: req?.files?.map((file) => ({ url: `/uploads/rooms/${file.filename}` })),
      created_by: req.user.id
    };

    // save room data in database
    const room = await Room.create(data);

    // success response with register new user
    res.status(201).json(successResponse(
      0,
      'SUCCESS',
      'New room create successful',
      room
    ));
  } catch (error) {
    cleanupUploadedFiles(req);

    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};

// Add a single lightweight physical room of a given type (number + floor + status).
// Price/capacity come from the type; the type's unit count is then derived from the rooms.
exports.createSingleRoom = async (req, res) => {
  try {
    const { Rooms: Room, RoomTypes: RoomType } = req.M;
    const {
      room_name, roomTypeId, floor, room_status
    } = req.body || {};

    if (!room_name || !String(room_name).trim()) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Room number / name is required'));
    }
    if (!roomTypeId || !/^[0-9a-fA-F]{24}$/.test(roomTypeId)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Please pick a room type'));
    }
    const type = await RoomType.findById(roomTypeId);
    if (!type) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Room type not found'));

    const name = String(room_name).trim();
    const exists = await Room.findOne({ room_name: name });
    if (exists) {
      return res.status(409).json(errorResponse(9, 'ALREADY EXIST', 'A room with that number / name already exists'));
    }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `room-${Date.now()}`;

    const room = await Room.create({
      room_name: name,
      room_slug: slug,
      roomTypeId: type._id,
      floor: floor || '',
      room_price: type.basePrice || 0,
      room_capacity: type.capacity || 1,
      room_status: ['available', 'unavailable', 'booked'].includes(room_status) ? room_status : 'available',
      created_by: req.user.id
    });

    // derive the type's unit count from its rooms
    const roomCount = await Room.countDocuments({ roomTypeId: type._id });
    type.totalUnits = roomCount;
    await type.save();

    return res.status(201).json(successResponse(0, 'SUCCESS', 'Room added', { id: room._id, totalUnits: roomCount }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

// Bulk-add units to a room type via a naming rule (apaleo style). Body:
//   { floor, prefix, startNumber, count, pad }
//   Floor "1",      prefix "",  start 101, count 10        → 101 … 110
//   Floor "Ground", prefix "G", start 1,   count 5, pad 2  → G01 … G05
exports.bulkAddUnits = async (req, res) => {
  try {
    const { Rooms: Room, RoomTypes: RoomType } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid room type id'));
    }
    const type = await RoomType.findById(req.params.id);
    if (!type) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Room type not found'));

    const {
      floor, prefix, startNumber, count, pad
    } = req.body || {};
    const total = Math.max(1, Math.min(500, Number(count) || 0));
    const label = String(floor || '').trim();
    const pfx = String(prefix == null ? '' : prefix).trim();
    const padLen = Math.max(0, Math.min(6, Number(pad) || 0));
    let n = Number.isFinite(Number(startNumber)) ? Number(startNumber) : 1;

    const created = [];
    const skipped = [];
    for (let i = 0; i < total; i += 1) {
      const numPart = padLen ? String(n).padStart(padLen, '0') : String(n);
      const name = `${pfx}${numPart}`;
      n += 1;
      // eslint-disable-next-line no-await-in-loop
      const taken = await Room.findOne({ room_name: name });
      if (taken) { skipped.push(name); continue; }
      // eslint-disable-next-line no-await-in-loop
      await Room.create({
        room_name: name,
        room_slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        roomTypeId: type._id,
        floor: label,
        condition: 'Clean',
        room_price: type.basePrice || 0,
        room_capacity: type.capacity || 1,
        room_status: 'available',
        created_by: req.user.id
      });
      created.push(name);
    }

    type.totalUnits = await Room.countDocuments({ roomTypeId: type._id });
    await type.save();
    return res.status(201).json(successResponse(0, 'SUCCESS', `Added ${created.length} unit(s)`, {
      created: created.length, skipped: skipped.length, names: created, totalUnits: type.totalUnits
    }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

// Edit a single room's settings: number, floor, housekeeping condition.
exports.patchRoomDetails = async (req, res) => {
  try {
    const { Rooms: Room } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid room id'));
    }
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Room not found'));

    const {
      room_name, floor, condition, attributes
    } = req.body || {};
    if (room_name !== undefined) {
      const name = String(room_name).trim();
      if (name) {
        const dupe = await Room.findOne({ room_name: name, _id: { $ne: room._id } });
        if (dupe) return res.status(409).json(errorResponse(9, 'ALREADY EXIST', 'A room with that number already exists'));
      }
      room.room_name = name;
      room.room_slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '';
    }
    if (floor !== undefined) room.floor = String(floor).trim();
    if (condition !== undefined && ['Clean', 'Dirty', 'Inspected', 'OutOfService'].includes(condition)) {
      room.condition = condition;
    }
    if (Array.isArray(attributes)) {
      room.attributes = attributes.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
    }
    await room.save();
    return res.status(200).json(successResponse(0, 'SUCCESS', 'Room updated', { id: room._id }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

// Bulk-delete rooms (skips any with an active booking), then re-derive affected types' counts.
exports.bulkDeleteRooms = async (req, res) => {
  try {
    const { Rooms: Room, RoomTypes: RoomType, Bookings: Booking } = req.M;
    const ids = (Array.isArray(req.body && req.body.roomIds) ? req.body.roomIds : [])
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
    if (!ids.length) return res.status(400).json(errorResponse(1, 'FAILED', 'Select at least one room'));

    const active = await Booking.distinct('room_id', { booking_status: { $in: ['pending', 'approved', 'in-reviews'] } });
    const activeSet = new Set(active.filter(Boolean).map(String));
    const deletable = ids.filter((id) => !activeSet.has(String(id)));

    const rooms = await Room.find({ _id: { $in: deletable } }, { roomTypeId: 1 }).lean();
    const affected = [...new Set(rooms.map((r) => String(r.roomTypeId)).filter((x) => x && x !== 'null'))];
    await Room.deleteMany({ _id: { $in: deletable } });

    // eslint-disable-next-line no-restricted-syntax
    for (const tid of affected) {
      // eslint-disable-next-line no-await-in-loop
      const c = await Room.countDocuments({ roomTypeId: tid });
      // eslint-disable-next-line no-await-in-loop
      await RoomType.updateOne({ _id: tid }, { totalUnits: c });
    }
    return res.status(200).json(successResponse(0, 'SUCCESS', `Deleted ${deletable.length} room(s)`, {
      deleted: deletable.length, skipped: ids.length - deletable.length
    }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

// Assign a floor to selected rooms and auto-number them:
//   numeric floor "1"    → 100, 101, 102 …  (floor × 100, continuing after existing)
//   named floor "Ground" → G01, G02 …       (prefix = first letter, overridable)
exports.assignFloor = async (req, res) => {
  try {
    const { Rooms: Room } = req.M;
    const { roomIds, floor, prefix } = req.body || {};
    const ids = (Array.isArray(roomIds) ? roomIds : []).filter((id) => /^[0-9a-fA-F]{24}$/.test(id));
    if (!ids.length) return res.status(400).json(errorResponse(1, 'FAILED', 'Select at least one room'));
    const label = String(floor || '').trim();
    if (!label) return res.status(400).json(errorResponse(1, 'FAILED', 'Floor is required'));

    const isNumeric = /^\d+$/.test(label);
    const base = isNumeric ? parseInt(label, 10) * 100 : 0;
    const letters = (String(prefix || '').trim()
      || (label.replace(/[^a-zA-Z]/g, '')[0] || label[0] || 'R')).toUpperCase();

    const nextFreeNumber = async (offsetStart) => {
      let offset = offsetStart;
      for (let i = 0; i < 100000; i += 1) {
        const candidate = isNumeric ? String(base + offset) : `${letters}${String(offset + 1).padStart(2, '0')}`;
        // eslint-disable-next-line no-await-in-loop
        const taken = await Room.findOne({ room_name: candidate });
        if (!taken) return { number: candidate, next: offset + 1 };
        offset += 1;
      }
      throw new Error('could not allocate a room number');
    };

    let offset = await Room.countDocuments({ floor: label, room_name: { $gt: '' } });
    const rooms = await Room.find({ _id: { $in: ids } });
    const assigned = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const room of rooms) {
      // eslint-disable-next-line no-await-in-loop
      const { number, next } = await nextFreeNumber(offset);
      offset = next;
      room.floor = label;
      room.room_name = number;
      room.room_slug = number.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      // eslint-disable-next-line no-await-in-loop
      await room.save();
      assigned.push({ id: room._id, number });
    }
    return res.status(200).json(successResponse(0, 'SUCCESS', `Assigned ${assigned.length} room(s) to floor ${label}`, { assigned }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

// TODO: Controller for get all rooms list
exports.getRoomsList = async (req, res) => {
  try {
    const { Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review } = req.M;

    // finding all room data from database
    const rooms = await Room.find();

    // filtering rooms based on different types query
    const roomQuery = new MyQueryHelper(Room.find(), req.query).search('room_name').sort().paginate();
    const findRooms = await roomQuery.query.populate('roomTypeId', 'name').populate('attributes', 'name');

    const mappedRooms = findRooms?.map((data) => ({
      id: data._id,
      room_name: data.room_name,
      room_slug: data.room_slug,
      room_type: data.room_type,
      // canonical type name (preferred) + the legacy enum as fallback, plus the floor
      room_type_name: data?.roomTypeId?.name || null,
      roomTypeId: data?.roomTypeId?._id || data?.roomTypeId || null,
      floor: data.floor || '',
      condition: data.condition || 'Clean',
      attributes: (data.attributes || []).map((a) => ({ id: a._id || a, name: a.name })),
      room_price: data.room_price,
      room_size: data.room_size,
      room_capacity: data.room_capacity,
      allow_pets: data.allow_pets,
      provide_breakfast: data.provide_breakfast,
      featured_room: data.featured_room,
      room_description: data.room_description,
      room_status: data.room_status,
      extra_facilities: data.extra_facilities,
      room_images: data?.room_images?.map(
        (img) => ({ url: process.env.APP_BASE_URL + img.url })
      ),
      created_by: data.created_by,
      created_at: data.createdAt,
      updated_at: data.updatedAt
    }));

    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Rooms list data found successful',
      {
        rows: mappedRooms,
        total_rows: rooms.length,
        response_rows: findRooms.length,
        total_page: req?.query?.keyword ? Math.ceil(findRooms.length / req.query.limit) : Math.ceil(rooms.length / req.query.limit),
        current_page: req?.query?.page ? parseInt(req.query.page, 10) : 1
      }
    ));
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};

// TODO: Controller for find a room by id or room slug_name
exports.getRoomByIdOrSlugName = async (req, res) => {
  try {
    const { Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review } = req.M;

    let room = null;

    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      room = await Room.findById(req.params.id).populate('created_by');
    } else {
      room = await Room.findOne({ room_slug: req.params.id }).populate('created_by');
    }

    if (!room) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Room does not exist'
      ));
    }

    const organizedRoom = {
      id: room?._id,
      room_name: room?.room_name,
      room_slug: room?.room_slug,
      room_type: room?.room_type,
      room_price: room?.room_price,
      room_size: room?.room_size,
      room_capacity: room?.room_capacity,
      allow_pets: room?.allow_pets,
      provide_breakfast: room?.provide_breakfast,
      featured_room: room?.featured_room,
      room_description: room?.room_description,
      room_status: room?.room_status,
      extra_facilities: room?.extra_facilities,
      room_images: room?.room_images?.map(
        (img) => ({ url: process.env.APP_BASE_URL + img.url })
      ),
      created_by: {
        id: room?.created_by._id,
        userName: room?.created_by.userName,
        fullName: room?.created_by.fullName,
        email: room?.created_by.email,
        phone: room?.created_by.phone,
        avatar: process.env.APP_BASE_URL + room?.created_by.avatar,
        gender: room?.created_by.gender,
        dob: room?.created_by.dob,
        address: room?.created_by.address,
        role: room?.created_by.role,
        verified: room?.created_by.verified,
        status: room?.created_by.status,
        createdAt: room?.created_by.createdAt,
        updatedAt: room?.created_by.updatedAt
      },
      created_at: room?.createdAt,
      updated_at: room?.updatedAt
    };

    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Room information get successful',
      organizedRoom
    ));
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};

// TODO: Controller for edit room
exports.editRoomByAdmin = async (req, res) => {
  try {
    const { Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review } = req.M;

    const {
      room_name, room_slug, room_type, room_price, room_size, room_capacity, allow_pets, provide_breakfast, featured_room, room_description, extra_facilities
    } = req.body;

    // check `room_name` filed exits
    if (!room_name) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_name` filed is required '
      ));
    }

    // check `room_slug` filed exits
    if (!room_slug) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_slug` filed is required '
      ));
    }

    // check `room_type` filed exits
    if (!room_type) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_type` filed is required '
      ));
    }

    // check `room_price` is positive
    if (!room_price || Number(room_price) <= 0) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_price` filed is required '
      ));
    }

    // check `room_size` filed exits
    if (!room_size) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_size` filed is required '
      ));
    }

    // check `room_capacity` filed exits
    if (!room_capacity) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_capacity` filed is required '
      ));
    }

    // check `room_description` filed exits
    if (!room_description) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`room_description` filed is required '
      ));
    }

    // check `extra_facilities[0]` filed exits
    if (!extra_facilities[0]) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Minimum 1 `extra_facilities` filed is required '
      ));
    }

    // check `req.files[0]` filed exits
    if (!req.files[0]) {
      cleanupUploadedFiles(req);
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Minimum 1 `room_images` filed is required '
      ));
    }

    // finding by room by room id
    let room = null;

    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      room = await Room.findById(req.params.id);
    }

    if (!room) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Room does not exist'
      ));
    }

    // delete room old images
    (() => {
      for (const element of room.room_images) {
        fs.unlink(`${appRoot}/public/${element.url}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
    })();

    // update room info & save database
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      {
        room_name,
        room_slug,
        room_type,
        room_price,
        room_size,
        room_capacity,
        allow_pets,
        provide_breakfast,
        featured_room,
        room_description,
        extra_facilities,
        room_images: req?.files?.map(
          (file) => ({ url: `/uploads/rooms/${file.filename}` })
        ),
        updatedAt: Date.now()
      },
      { runValidators: true, new: true }
    );

    // success response with register new user
    res.status(201).json(successResponse(
      0,
      'SUCCESS',
      'New room updated successful',
      updatedRoom
    ));
  } catch (error) {
    cleanupUploadedFiles(req);

    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};

// TODO: Controller for delete room using ID by admin
exports.deleteRoomById = async (req, res) => {
  try {
    const { Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review } = req.M;

    // check if room exists
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Room does not exist'
      ));
    }

    // delete room form database
    await Room.findByIdAndDelete(room.id);

    // delete old images
    (() => {
      for (const element of room.room_images) {
        fs.unlink(`${appRoot}/public/${element.url}`, (err) => {
          if (err) { logger.error(err); }
        });
      }
    })();

    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Room delete form database successful'
    ));
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};

// TODO: Controller for get featured rooms list
exports.getFeaturedRoomsList = async (req, res) => {
  try {
    const { Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review } = req.M;

    // finding featured room data from database
    const rooms = await Room.find({ featured_room: true });

    // filtering rooms based on different types query
    const roomQuery = new MyQueryHelper(Room.find(
      { featured_room: true }
    ), req.query).search('room_name').sort().paginate();
    const findRooms = await roomQuery.query;

    const mappedRooms = findRooms?.map((data) => ({
      id: data._id,
      room_name: data.room_name,
      room_slug: data.room_slug,
      room_type: data.room_type,
      room_price: data.room_price,
      room_size: data.room_size,
      room_capacity: data.room_capacity,
      allow_pets: data.allow_pets,
      provide_breakfast: data.provide_breakfast,
      featured_room: data.featured_room,
      room_description: data.room_description,
      room_status: data.room_status,
      extra_facilities: data.extra_facilities,
      room_images: data?.room_images?.map(
        (img) => ({ url: process.env.APP_BASE_URL + img.url })
      ),
      created_by: data.created_by,
      created_at: data.createdAt,
      updated_at: data.updatedAt
    }));

    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Featured rooms list data found successful',
      {
        rows: mappedRooms,
        total_rows: rooms.length,
        response_rows: findRooms.length,
        total_page: req?.query?.keyword ? Math.ceil(findRooms.length / req.query.limit) : Math.ceil(rooms.length / req.query.limit),
        current_page: req?.query?.page ? parseInt(req.query.page, 10) : 1
      }
    ));
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};
