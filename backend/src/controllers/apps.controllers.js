/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const { errorResponse, successResponse } = require('../configs/app.response');
const User = require('../models/user.model');
const Room = require('../models/room.model');
const Booking = require('../models/booking.model');

// TODO: Controller for get users list for admin
exports.getDashboardData = async (req, res) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'User does not exist'
      ));
    }

    // finding all users data from database
    const totalUsers = await User.find();

    if (!totalUsers) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Sorry! Any user does not found'
      ));
    }

    // finding all users data from database specific criteria
    const adminRoleUsers = await User.find({ role: 'admin' });
    const userRoleUsers = await User.find({ role: 'user' });
    const registerStatusUsers = await User.find({ status: 'register' });
    const loginStatusUsers = await User.find({ status: 'login' });
    const logoutStatusUsers = await User.find({ status: 'logout' });
    const blockedStatusUsers = await User.find({ status: 'blocked' });
    const verifiedUsers = await User.find({ verified: true });

    // finding all room data from database specific criteria
    const totalRooms = await Room.find();
    const availableRooms = await Room.find({ room_status: 'available' });
    const unavailableRooms = await Room.find({ room_status: 'unavailable' });
    const bookedRooms = await Room.find({ room_status: 'booked' });

    // finding all booking data from database specific criteria
    const totalBookings = await Booking.find();
    const pendingBookings = await Booking.find({ booking_status: 'pending' });
    const cancelBookings = await Booking.find({ booking_status: 'cancel' });
    const approvedBookings = await Booking.find({ booking_status: 'approved' });
    const rejectedBookings = await Booking.find({ booking_status: 'rejected' });
    const inReviewsBookings = await Booking.find({ booking_status: 'in-reviews' });
    const completedBookings = await Booking.find({ booking_status: 'completed' });

    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Dashboard information get successful',
      {
        users_info: {
          total_users: totalUsers?.length || 0,
          admin_role_user: adminRoleUsers?.length || 0,
          user_role_user: userRoleUsers?.length || 0,
          register_status_user: registerStatusUsers?.length || 0,
          login_status_user: loginStatusUsers?.length || 0,
          logout_status_user: logoutStatusUsers?.length || 0,
          blocked_status_user: blockedStatusUsers?.length || 0,
          verified_user: verifiedUsers?.length || 0
        },
        rooms_info: {
          total_rooms: totalRooms?.length || 0,
          available_rooms: availableRooms?.length || 0,
          unavailable_rooms: unavailableRooms?.length || 0,
          booked_rooms: bookedRooms?.length || 0
        },
        booking_info: {
          total_bookings: totalBookings?.length || 0,
          pending_bookings: pendingBookings?.length || 0,
          cancel_bookings: cancelBookings?.length || 0,
          approved_bookings: approvedBookings?.length || 0,
          rejected_bookings: rejectedBookings?.length || 0,
          in_reviews_bookings: inReviewsBookings?.length || 0,
          completed_bookings: completedBookings?.length || 0
        }
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
