/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const { errorResponse, successResponse } = require('../configs/app.response');
const MyQueryHelper = require('../configs/api.feature');
const { bookingDatesBeforeCurrentDate } = require('../lib/booking.dates.validator');
const RoomCalendar = require('../lib/room.calendar');

// Release the availability units a booking is holding (replaces BookingClaim deletion).
// The booking IS the record of what it holds — roomTypeId + booking_dates — so no separate
// claims collection is needed. No-op for legacy bookings created before room types existed.
async function releaseBookingHold(req, booking) {
  if (!booking || !booking.roomTypeId) return;
  await RoomCalendar.release(req.db, {
    hotelId: req.hotel?._id,
    roomTypeId: booking.roomTypeId,
    dates: booking.booking_dates,
    source: 'direct'
  });
}

// TODO: controller for placed booking order
exports.placedBookingOrder = async (req, res) => {
  try {
    const { Rooms: Room, Bookings: Booking, RoomTypes: RoomType } = req.M;

    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Something went wrong. Probably room id missing/incorrect'
      ));
    }

    const myRoom = await Room.findById(req.params.id);

    // check room available
    if (!myRoom) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Room does not exist'
      ));
    }

    // check room status is `unavailable` (maintenance / out-of-service)
    if (myRoom.room_status === 'unavailable') {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Sorry! Current your sleeted room can\'t available'
      ));
    }
    // NOTE: we no longer reject on room_status === 'booked'. With counted room types,
    // availability is decided per date by RoomCalendar, not by a whole-room flag.

    // Resolve the canonical room type. Fallback: a room with no roomTypeId behaves as a
    // 1-unit type keyed by its own id — reproducing the old per-room hard guarantee.
    let roomTypeId = myRoom.roomTypeId || myRoom._id;
    let totalUnits = 1;
    let basePrice = myRoom.room_price || 0;
    if (myRoom.roomTypeId && RoomType) {
      const rt = await RoomType.findById(myRoom.roomTypeId).lean();
      if (rt) {
        roomTypeId = rt._id;
        totalUnits = rt.totalUnits == null ? 1 : rt.totalUnits;
        basePrice = rt.basePrice || basePrice;
      }
    }
    const hotelId = req.hotel?._id;

    // price snapshot from the Price grid: per-date override, else the type's base price
    const dayKeys = (req.body.booking_dates || []).map((d) => {
      const x = new Date(d);
      x.setUTCHours(0, 0, 0, 0);
      return x;
    });
    const priceDocs = await req.M.Prices.find({ roomTypeId, date: { $in: dayKeys } }).lean();
    const priceMap = {};
    priceDocs.forEach((p) => { priceMap[new Date(p.date).toISOString().slice(0, 10)] = p.amount; });
    const total = dayKeys.reduce((s, d) => {
      const k = d.toISOString().slice(0, 10);
      return s + (priceMap[k] != null ? priceMap[k] : basePrice);
    }, 0);

    // create the booking targeting the room type; room_id is the (preferred) assignment
    const booking = await Booking.create({
      roomTypeId,
      room_id: myRoom._id,
      booking_dates: req.body.booking_dates,
      booking_by: req.user.id,
      payment: { amount: total, currency: 'EUR', status: 'unpaid' }
    });

    // firm hold: atomic guarded decrement per date in the shared availability collection.
    // Replaces the BookingClaims unique-index trick. Concurrent holds on the last unit:
    // exactly one wins; the rest get SOLD_OUT.
    try {
      await RoomCalendar.firmHold(req.db, {
        hotelId, roomTypeId, dates: req.body.booking_dates, totalUnits, source: 'direct'
      });
    } catch (holdErr) {
      await Booking.deleteOne({ _id: booking._id });
      if (holdErr.code === 'SOLD_OUT') {
        return res.status(409).json(errorResponse(
          1,
          'CONFLICT',
          'One or more selected dates were just booked by someone else. Please pick different dates.'
        ));
      }
      throw holdErr;
    }

    // No fire-and-forget push: the worker derives the outbound .ics from this same
    // availability collection. One source of truth, nothing to keep in sync across the seam.

    // success response with register new user
    res.status(201).json(successResponse(
      0,
      'SUCCESS',
      'Your room booking order placed successful. Please wait for confirmation.',
      booking
    ));
  } catch (error) {
    // surface validation failures (e.g. past dates) as a clean 400 string, never the raw
    // Mongoose error object — the frontend renders this message directly.
    if (error?.name === 'ValidationError') {
      return res.status(400).json(errorResponse(
        1,
        'INVALID BOOKING',
        'Please choose valid, non-past dates for this booking.'
      ));
    }
    return res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error.message || 'Server error while placing the booking'
    ));
  }
};

// TODO: controller for get all specific user booking order
exports.getBookingOrderByUserId = async (req, res) => {
  try {
    const { Bookings: Booking } = req.M;

    const myBooking = await Booking.find({ booking_by: req.user.id })
      .populate('room_id')
      .populate('booking_by')
      .populate({
        path: 'reviews',
        populate: { path: 'user_id', model: 'Users' }
      });

    // no bookings yet is a valid empty state, not an error — return an empty list so the
    // tape chart / orders / booking-history views render cleanly instead of erroring on 404.
    if (!myBooking || myBooking.length === 0) {
      return res.status(200).json(successResponse(
        0,
        'SUCCESS',
        'No bookings found',
        {
          rows: [], total_rows: 0, response_rows: 0, total_page: 0, current_page: 1
        }
      ));
    }

    // filtering booking orders based on different types query
    const bookingQuery = new MyQueryHelper(Booking.find({ booking_by: req.user.id })
      .populate('room_id')
      .populate('booking_by')
      .populate(
        { path: 'reviews', populate: { path: 'user_id', model: 'Users' } }
      ), req.query)
      .sort()
      .paginate();
    const findBooking = await bookingQuery.query;

    const mapperBooking = findBooking?.map((data) => ({
      id: data?.id,
      booking_dates: data?.booking_dates,
      booking_status: data?.booking_status, booking_source: data?.booking_source || 'direct',
      guests: data?.guests || { adults: 1, children: 0, infants: 0 },
      guest_country: data?.guest_country || '',
      payment: data?.payment || { amount: null, currency: 'EUR', method: null, status: 'unpaid', paid_at: null },
      notes: data?.notes || '',
      reviews: !data?.reviews ? null : {
        id: data?.reviews.id,
        room_id: data?.reviews.room_id,
        booking_id: data?.reviews.booking_id,
        rating: data?.reviews.rating,
        message: data?.reviews.message,
        reviews_by: {
          id: data?.reviews?.user_id?._id,
          userName: data?.reviews?.user_id?.userName,
          fullName: data?.reviews?.user_id?.fullName,
          email: data?.reviews?.user_id?.email,
          phone: data?.reviews?.user_id?.phone,
          avatar: process.env.APP_BASE_URL + data?.reviews?.user_id?.avatar,
          gender: data?.reviews?.user_id?.gender,
          dob: data?.reviews?.user_id?.dob,
          address: data?.reviews?.user_id?.address,
          role: data?.reviews?.user_id?.role,
          verified: data?.reviews?.user_id?.verified,
          status: data?.reviews?.user_id?.status,
          createdAt: data?.reviews?.user_id?.createdAt,
          updatedAt: data?.reviews?.user_id?.updatedAt
        },
        created_at: data?.reviews?.createdAt,
        updated_at: data?.reviews?.updatedAt
      },
      booking_by: {
        id: data?.booking_by?._id,
        userName: data?.booking_by?.userName,
        fullName: data?.booking_by?.fullName,
        email: data?.booking_by?.email,
        phone: data?.booking_by?.phone,
        avatar: process.env.APP_BASE_URL + data?.booking_by?.avatar,
        gender: data?.booking_by?.gender,
        dob: data?.booking_by?.dob,
        address: data?.booking_by?.address,
        role: data?.booking_by?.role,
        verified: data?.booking_by?.verified,
        status: data?.booking_by?.status,
        createdAt: data?.booking_by?.createdAt,
        updatedAt: data?.booking_by?.updatedAt
      },
      room: {
        id: data?.room_id?._id,
        room_name: data?.room_id?.room_name,
        room_slug: data?.room_id?.room_slug,
        room_type: data?.room_id?.room_type,
        room_price: data?.room_id?.room_price,
        room_size: data?.room_id?.room_size,
        room_capacity: data?.room_id?.room_capacity,
        allow_pets: data?.room_id?.allow_pets,
        provide_breakfast: data?.room_id?.provide_breakfast,
        featured_room: data?.room_id?.featured_room,
        room_description: data?.room_id?.room_description,
        room_status: data?.room_id?.room_status,
        extra_facilities: data?.room_id?.extra_facilities,
        room_images: data?.room_id?.room_images?.map(
          (img) => ({ url: process.env.APP_BASE_URL + img.url })
        )
      },
      created_at: data?.createdAt,
      updated_at: data?.updatedAt
    }));

    // success response with the booking list
    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Booking list retrieved successful',
      {
        rows: mapperBooking,
        total_rows: myBooking.length,
        response_rows: findBooking.length,
        total_page: req?.query?.keyword ? Math.ceil(findBooking.length / req.query.limit) : Math.ceil(myBooking.length / req.query.limit),
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

// TODO: controller for cancel self booking order
exports.cancelSelfBookingOrder = async (req, res) => {
  try {
    const { Bookings: Booking } = req.M;

    // finding by room id
    let booking = null;

    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      // find the booking by id and check if the booking_by user id matches the authenticated user id
      booking = await Booking.findOne({ _id: req.params.id, booking_by: req.user.id });
    } else {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Something went wrong. Probably booking id missing/incorrect'
      ));
    }

    // if booking not found or user is not authorized to cancel this booking, return an error response
    if (!booking) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Booking not found or you are not authorized to cancel this booking'
      ));
    }

    // if booking status is not 'pending', return an error response
    if (booking.booking_status !== 'pending') {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'This booking cannot be `cancel` as it is no longer in the `pending` status'
      ));
    }

    // update the booking status to 'cancel'
    booking.booking_status = 'cancel';
    await booking.save({ validateBeforeSave: false });

    // release the held availability so the dates become bookable again
    await releaseBookingHold(req, booking);

    // success response after canceling the booking
    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Booking order has been canceled successful',
      booking
    ));
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};

// TODO: controller for get all booking order by admin
exports.getBookingOrderForAdmin = async (req, res) => {
  try {
    const { Bookings: Booking } = req.M;

    const myBooking = await Booking.find()
      .populate('room_id')
      .populate('booking_by')
      .populate({
        path: 'reviews',
        populate: { path: 'user_id', model: 'Users' }
      });

    // no bookings yet is a valid empty state, not an error — return an empty list so the
    // tape chart / orders / booking-history views render cleanly instead of erroring on 404.
    if (!myBooking || myBooking.length === 0) {
      return res.status(200).json(successResponse(
        0,
        'SUCCESS',
        'No bookings found',
        {
          rows: [], total_rows: 0, response_rows: 0, total_page: 0, current_page: 1
        }
      ));
    }

    // filtering booking orders based on different types query
    const bookingQuery = new MyQueryHelper(Booking.find()
      .populate('room_id')
      .populate('booking_by')
      .populate('roomTypeId', 'name')
      .populate(
        { path: 'reviews', populate: { path: 'user_id', model: 'Users' } }
      ), req.query)
      .sort()
      .paginate();
    const findBooking = await bookingQuery.query;

    const mapperBooking = findBooking?.map((data) => ({
      id: data?.id,
      booking_dates: data?.booking_dates,
      roomTypeId: data?.roomTypeId?._id || data?.roomTypeId || null,
      room_type_booked: data?.roomTypeId?.name || null,
      booking_status: data?.booking_status, booking_source: data?.booking_source || 'direct',
      guests: data?.guests || { adults: 1, children: 0, infants: 0 },
      guest_country: data?.guest_country || '',
      payment: data?.payment || { amount: null, currency: 'EUR', method: null, status: 'unpaid', paid_at: null },
      notes: data?.notes || '',
      reviews: !data?.reviews ? null : {
        id: data?.reviews.id,
        room_id: data?.reviews.room_id,
        booking_id: data?.reviews.booking_id,
        rating: data?.reviews.rating,
        message: data?.reviews.message,
        reviews_by: {
          id: data?.reviews?.user_id?._id,
          userName: data?.reviews?.user_id?.userName,
          fullName: data?.reviews?.user_id?.fullName,
          email: data?.reviews?.user_id?.email,
          phone: data?.reviews?.user_id?.phone,
          avatar: process.env.APP_BASE_URL + data?.reviews?.user_id?.avatar,
          gender: data?.reviews?.user_id?.gender,
          dob: data?.reviews?.user_id?.dob,
          address: data?.reviews?.user_id?.address,
          role: data?.reviews?.user_id?.role,
          verified: data?.reviews?.user_id?.verified,
          status: data?.reviews?.user_id?.status,
          createdAt: data?.reviews?.user_id?.createdAt,
          updatedAt: data?.reviews?.user_id?.updatedAt
        },
        created_at: data?.reviews?.createdAt,
        updated_at: data?.reviews?.updatedAt
      },
      booking_by: {
        id: data?.booking_by?._id,
        userName: data?.booking_by?.userName,
        fullName: data?.booking_by?.fullName,
        email: data?.booking_by?.email,
        phone: data?.booking_by?.phone,
        avatar: process.env.APP_BASE_URL + data?.booking_by?.avatar,
        gender: data?.booking_by?.gender,
        dob: data?.booking_by?.dob,
        address: data?.booking_by?.address,
        role: data?.booking_by?.role,
        verified: data?.booking_by?.verified,
        status: data?.booking_by?.status,
        createdAt: data?.booking_by?.createdAt,
        updatedAt: data?.booking_by?.updatedAt
      },
      room: {
        id: data?.room_id?._id,
        room_name: data?.room_id?.room_name,
        room_slug: data?.room_id?.room_slug,
        room_type: data?.room_id?.room_type,
        room_price: data?.room_id?.room_price,
        room_size: data?.room_id?.room_size,
        room_capacity: data?.room_id?.room_capacity,
        allow_pets: data?.room_id?.allow_pets,
        provide_breakfast: data?.room_id?.provide_breakfast,
        featured_room: data?.room_id?.featured_room,
        room_description: data?.room_id?.room_description,
        room_status: data?.room_id?.room_status,
        extra_facilities: data?.room_id?.extra_facilities,
        room_images: data?.room_id?.room_images?.map(
          (img) => ({ url: process.env.APP_BASE_URL + img.url })
        )
      },
      created_at: data?.createdAt,
      updated_at: data?.updatedAt
    }));

    // success response with the booking list
    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Booking list retrieved successful',
      {
        rows: mapperBooking,
        total_rows: myBooking.length,
        response_rows: findBooking.length,
        total_page: req?.query?.keyword ? Math.ceil(findBooking.length / req.query.limit) : Math.ceil(myBooking.length / req.query.limit),
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

// Inline-edit endpoint for the redesigned bookings table.
// Allows admins to PATCH notes, guests, or booking_status without going through the
// status-machine of `updatedBookingOrderByAdmin`.
exports.patchBookingInline = async (req, res) => {
  try {
    const { Bookings: Booking } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid booking id'));
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json(errorResponse(4, 'UNKNOWN ACCESS', 'Booking not found'));
    }

    const { notes, guests, guest_country, payment, booking_status } = req.body || {};
    if (notes !== undefined) booking.notes = String(notes).slice(0, 2000);
    if (guests && typeof guests === 'object') {
      booking.guests = {
        adults: Math.max(1, Number(guests.adults) || 1),
        children: Math.max(0, Number(guests.children) || 0),
        infants: Math.max(0, Number(guests.infants) || 0)
      };
    }
    if (guest_country !== undefined) {
      booking.guest_country = String(guest_country || '').toUpperCase().slice(0, 2);
    }
    if (payment && typeof payment === 'object') {
      const allowedMethods = ['card', 'cash', 'check', 'bank_transfer', 'epay', 'apple_pay', 'google_pay', 'on_arrival'];
      const allowedStatuses = ['unpaid', 'pending', 'partial', 'paid', 'refunded'];
      const next = booking.payment ? (booking.payment.toObject ? booking.payment.toObject() : { ...booking.payment }) : {};
      if (payment.amount !== undefined) next.amount = Math.max(0, Number(payment.amount) || 0);
      if (payment.currency !== undefined) next.currency = String(payment.currency).slice(0, 6);
      if (payment.method !== undefined) {
        next.method = allowedMethods.includes(payment.method) ? payment.method : null;
      }
      if (payment.status !== undefined && allowedStatuses.includes(payment.status)) {
        next.status = payment.status;
        if (payment.status === 'paid' && !next.paid_at) next.paid_at = new Date();
        if (payment.status === 'unpaid') next.paid_at = null;
      }
      booking.payment = next;
    }
    if (booking_status && booking_status !== booking.booking_status) {
      const allowed = ['pending', 'approved', 'rejected', 'cancel', 'in-reviews', 'completed'];
      if (!allowed.includes(booking_status)) {
        return res.status(400).json(errorResponse(1, 'FAILED', `Invalid status: ${booking_status}`));
      }
      booking.booking_status = booking_status;
      // Release held availability if the booking is no longer holding inventory
      if (['cancel', 'rejected'].includes(booking_status)) {
        await releaseBookingHold(req, booking);
      }
    }
    await booking.save({ validateBeforeSave: false });

    return res.status(200).json(successResponse(0, 'SUCCESS', 'Booking updated', {
      id: booking._id,
      notes: booking.notes,
      guests: booking.guests,
      booking_status: booking.booking_status
    }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || error));
  }
};

// Assign (or clear) the physical room on a booking — the room-rack "assign from Unassigned".
// Validates the room is the booking's type and has no overlapping assigned booking.
exports.assignRoomToBooking = async (req, res) => {
  try {
    const { Bookings: Booking, Rooms: Room } = req.M;
    if (!/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid booking id'));
    }
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Booking not found'));

    const { roomId } = req.body || {};

    // unassign
    if (!roomId) {
      booking.room_id = null;
      await booking.save({ validateBeforeSave: false });
      return res.status(200).json(successResponse(0, 'SUCCESS', 'Booking unassigned', { id: booking._id, room: null }));
    }
    if (!/^[0-9a-fA-F]{24}$/.test(roomId)) {
      return res.status(400).json(errorResponse(1, 'FAILED', 'Invalid room id'));
    }
    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json(errorResponse(4, 'NOT FOUND', 'Room not found'));

    // the room must be of the booking's type
    if (booking.roomTypeId && room.roomTypeId && String(room.roomTypeId) !== String(booking.roomTypeId)) {
      return res.status(400).json(errorResponse(1, 'WRONG TYPE', `Room ${room.room_name} is a different room type than this booking.`));
    }

    // the room must be free on those dates (no other active booking assigned there)
    const dateSet = new Set((booking.booking_dates || []).map((d) => new Date(d).toISOString().slice(0, 10)));
    const others = await Booking.find(
      { _id: { $ne: booking._id }, room_id: room._id, booking_status: { $in: ['pending', 'approved', 'in-reviews'] } },
      { booking_dates: 1 }
    ).lean();
    const clash = others.some((o) => (o.booking_dates || []).some((d) => dateSet.has(new Date(d).toISOString().slice(0, 10))));
    if (clash) {
      return res.status(409).json(errorResponse(1, 'CONFLICT', `Room ${room.room_name} already has a booking on those dates.`));
    }

    booking.room_id = room._id;
    await booking.save({ validateBeforeSave: false });
    return res.status(200).json(successResponse(0, 'SUCCESS', `Assigned to room ${room.room_name}`, {
      id: booking._id, room: { id: room._id, name: room.room_name }
    }));
  } catch (error) {
    return res.status(500).json(errorResponse(2, 'SERVER SIDE ERROR', error.message || 'Server error'));
  }
};

// Booking status state machine: defines valid transitions and side effects
const BOOKING_TRANSITIONS = {
  approved: {
    from: 'pending',
    validate: (booking) => {
      if (bookingDatesBeforeCurrentDate(booking?.booking_dates).isAnyDateInPast) {
        return 'Sorry! This booking cannot be `approved` because of booking data is past';
      }
      return null;
    },
    onSuccess: async (booking, room) => {
      booking.booking_status = 'approved';
      await booking.save({ validateBeforeSave: false });
      if (room) {
        room.room_status = 'booked';
        await room.save({ validateBeforeSave: false });
      }
    }
  },
  rejected: {
    from: 'pending',
    validate: () => null,
    onSuccess: async (booking, _room, release) => {
      booking.booking_status = 'rejected';
      await booking.save({ validateBeforeSave: false });
      await release();
    }
  },
  'in-reviews': {
    from: 'approved',
    validate: (booking) => {
      if (!bookingDatesBeforeCurrentDate(booking?.booking_dates).isAnyDateInPast) {
        return 'Sorry! This booking cannot be `in-reviews` because of booking data is not feature';
      }
      return null;
    },
    onSuccess: async (booking, room) => {
      booking.booking_status = 'in-reviews';
      await booking.save({ validateBeforeSave: false });
      if (room) {
        room.room_status = 'available';
        await room.save({ validateBeforeSave: false });
      }
    }
  }
};

// TODO: controller for updated booking order by admin
exports.updatedBookingOrderByAdmin = async (req, res) => {
  try {
    const { Rooms: Room, Bookings: Booking } = req.M;

    // finding by room by room id
    let booking = null;

    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      booking = await Booking.findOne({ _id: req.params.id });
    } else {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Something went wrong. Probably booking id missing/incorrect'
      ));
    }

    if (!booking) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Booking not found or you are not authorized to cancel this booking'
      ));
    }

    if (!req.body.booking_status) {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`booking_status` filed is required'
      ));
    }

    // the assigned physical room (may be null for type-only bookings — assignment is deferred)
    const myRoom = booking.room_id ? await Room.findById(booking.room_id) : null;

    // handle update booking status via state machine
    const targetStatus = req.body.booking_status;
    const transition = BOOKING_TRANSITIONS[targetStatus];

    if (!transition) {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        `Your provided booking_status '${targetStatus}' can't match our system. Please try again using a correct booking_status`
      ));
    }

    if (booking.booking_status !== transition.from) {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        `This booking cannot be \`${targetStatus}\` as it is no longer in the \`${transition.from}\` status`
      ));
    }

    const validationError = transition.validate(booking);
    if (validationError) {
      return res.status(400).json(errorResponse(1, 'FAILED', validationError));
    }

    await transition.onSuccess(booking, myRoom, () => releaseBookingHold(req, booking));

    // success response after canceling the booking
    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      `Booking order has been '${booking.booking_status}' successful`,
      booking
    ));
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};
