/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const { errorResponse, successResponse } = require('../configs/app.response');

// TODO: Controller for get users list for admin
exports.getDashboardData = async (req, res) => {
  try {
    const { Rooms: Room, Bookings: Booking, Users: User, BookingClaims: BookingClaim, Reviews: Review } = req.M;

    const { user } = req;

    if (!user) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'User does not exist'
      ));
    }

    // finding all users data from database using countDocuments for performance
    const [
      totalUsers,
      adminRoleUsers,
      userRoleUsers,
      registerStatusUsers,
      loginStatusUsers,
      logoutStatusUsers,
      blockedStatusUsers,
      verifiedUsers,
      totalRooms,
      availableRooms,
      unavailableRooms,
      bookedRooms,
      totalBookings,
      pendingBookings,
      cancelBookings,
      approvedBookings,
      rejectedBookings,
      inReviewsBookings,
      completedBookings
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ status: 'register' }),
      User.countDocuments({ status: 'login' }),
      User.countDocuments({ status: 'logout' }),
      User.countDocuments({ status: 'blocked' }),
      User.countDocuments({ verified: true }),
      Room.countDocuments(),
      Room.countDocuments({ room_status: 'available' }),
      Room.countDocuments({ room_status: 'unavailable' }),
      Room.countDocuments({ room_status: 'booked' }),
      Booking.countDocuments(),
      Booking.countDocuments({ booking_status: 'pending' }),
      Booking.countDocuments({ booking_status: 'cancel' }),
      Booking.countDocuments({ booking_status: 'approved' }),
      Booking.countDocuments({ booking_status: 'rejected' }),
      Booking.countDocuments({ booking_status: 'in-reviews' }),
      Booking.countDocuments({ booking_status: 'completed' })
    ]);

    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Dashboard information get successful',
      {
        users_info: {
          total_users: totalUsers,
          admin_role_user: adminRoleUsers,
          user_role_user: userRoleUsers,
          register_status_user: registerStatusUsers,
          login_status_user: loginStatusUsers,
          logout_status_user: logoutStatusUsers,
          blocked_status_user: blockedStatusUsers,
          verified_user: verifiedUsers
        },
        rooms_info: {
          total_rooms: totalRooms,
          available_rooms: availableRooms,
          unavailable_rooms: unavailableRooms,
          booked_rooms: bookedRooms
        },
        booking_info: {
          total_bookings: totalBookings,
          pending_bookings: pendingBookings,
          cancel_bookings: cancelBookings,
          approved_bookings: approvedBookings,
          rejected_bookings: rejectedBookings,
          in_reviews_bookings: inReviewsBookings,
          completed_bookings: completedBookings
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
