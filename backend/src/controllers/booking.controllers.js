/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const Room = require('../models/room.model');
const Booking = require('../models/booking.model');
const { errorResponse, successResponse } = require('../configs/app.response');
const MyQueryHelper = require('../configs/api.feature');
const { bookingDatesBeforeCurrentDate } = require('../lib/booking.dates.validator');

// TODO: controller for placed booking order
exports.placedBookingOrder = async (req, res) => {
  try {
    // finding by room id
    let myRoom = null;

    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      myRoom = await Room.findById(req.params.id);
    } else {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Something went wrong. Probably room id missing/incorrect'
      ));
    }

    // check room available
    if (!myRoom) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Room does not exist'
      ));
    }

    // check room status is`unavailable`
    if (myRoom.room_status === 'unavailable') {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Sorry! Current your sleeted room can\'t available'
      ));
    }

    // check room status is `booked`
    if (myRoom.room_status === 'booked') {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Sorry! Current your sleeted already booked. Please try again later'
      ));
    }

    // prepared user provided data to store database
    const data = {
      room_id: req.params.id,
      booking_dates: req.body.booking_dates,
      booking_by: req.user.id
    };

    // save room data in database
    const booking = await Booking.create(data);

    // success response with register new user
    res.status(201).json(successResponse(
      0,
      'SUCCESS',
      'Your room booking order placed successful. Please wait for confirmation.',
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

// TODO: controller for get all specific user booking order
exports.getBookingOrderByUserId = async (req, res) => {
  try {
    const myBooking = await Booking.find({ booking_by: req.user.id })
      .populate('room_id')
      .populate('booking_by')
      .populate({
        path: 'reviews',
        populate: { path: 'user_id', model: 'Users' }
      });

    // if no bookings found for the user id, return an error response
    if (!myBooking || myBooking.length === 0) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'No bookings found for the specified user'
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
      booking_status: data?.booking_status,
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
    const myBooking = await Booking.find()
      .populate('room_id')
      .populate('booking_by')
      .populate({
        path: 'reviews',
        populate: { path: 'user_id', model: 'Users' }
      });

    // if no bookings found for the user id, return an error response
    if (!myBooking || myBooking.length === 0) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'No bookings found for the specified user'
      ));
    }

    // filtering booking orders based on different types query
    const bookingQuery = new MyQueryHelper(Booking.find()
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
      booking_status: data?.booking_status,
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

// TODO: controller for updated booking order by admin
exports.updatedBookingOrderByAdmin = async (req, res) => {
  try {
    // finding by room by room id
    let booking = null;

    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      // find the booking by id and check if the booking_by user id matches the authenticated user id
      booking = await Booking.findOne({ _id: req.params.id });
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

    // check `booking_status` filed exits
    if (!req.body.booking_status) {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        '`booking_status` filed is required'
      ));
    }

    // finding by room by room id
    let myRoom = null;

    if (/^[0-9a-fA-F]{24}$/.test(req.params.id)) {
      myRoom = await Room.findById(booking.room_id);
    } else {
      return res.status(400).json(errorResponse(
        1,
        'FAILED',
        'Something went wrong. Probably room id missing/incorrect'
      ));
    }

    // check room available
    if (!myRoom) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Room does not exist'
      ));
    }

    // handle update booking status
    switch (req.body.booking_status) {
      case 'approved':
        if (booking.booking_status === 'pending') {
          if (!bookingDatesBeforeCurrentDate(booking?.booking_dates).isAnyDateInPast) {
            // update the booking status to `approved`
            booking.booking_status = 'approved';
            await booking.save();

            // update the room status to 'booked'
            myRoom.room_status = 'booked';
            await myRoom.save();
          } else {
            return res.status(400).json(errorResponse(
              1,
              'FAILED',
              'Sorry! This booking cannot be `approved` because of booking data is past'
            ));
          }
        } else {
          return res.status(400).json(errorResponse(
            1,
            'FAILED',
            'This booking cannot be `approved` as it is no longer in the `pending` status'
          ));
        }
        break;
      case 'rejected':
        if (booking.booking_status === 'pending') {
          // update the booking status to `rejected`
          booking.booking_status = 'rejected';
          await booking.save({ validateBeforeSave: false });
        } else {
          return res.status(400).json(errorResponse(
            1,
            'FAILED',
            'This booking cannot be `rejected` as it is no longer in the `pending` status'
          ));
        }
        break;
      case 'in-reviews':
        if (booking.booking_status === 'approved') {
          if (bookingDatesBeforeCurrentDate(booking?.booking_dates).isAnyDateInPast) {
            // update the booking status to `in-reviews`
            booking.booking_status = 'in-reviews';
            await booking.save();

            // update the room status to 'available'
            myRoom.room_status = 'available';
            await myRoom.save();
          } else {
            return res.status(400).json(errorResponse(
              1,
              'FAILED',
              'Sorry! This booking cannot be `in-reviews` because of booking data is not feature'
            ));
          }
        } else {
          return res.status(400).json(errorResponse(
            1,
            'FAILED',
            'This booking cannot be `in-reviews` as it is no longer in the `approved` status'
          ));
        }
        break;
      default:
        return res.status(400).json(errorResponse(
          1,
          'FAILED',
          `Your provided booking_status '${booking.booking_status}' can't match our system. Please try again using a correct booking_status`
        ));
    }

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
