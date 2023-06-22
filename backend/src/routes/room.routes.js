/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const router = require('express').Router();
const roomImageUpload = require('../middleware/room.image.upload');
const { isAuthenticatedUser, isAdmin } = require('../middleware/app.authentication');

const {
  createRoom, getRoomsList, getRoomByIdOrSlugName, roomAddReview
} = require('../controllers/room.controllers');

// route for create new room
router.route('/create-room').post(isAuthenticatedUser, isAdmin, roomImageUpload.array('room_images', 5), createRoom);

// route for get all rooms list
router.route('/all-rooms-list').get(getRoomsList);

// route for get single room
router.route('/get-room-by-id-or-slug-name/:id').get(getRoomByIdOrSlugName);

// routes for a room add, edit or delete a review
router.route('/room-review-add/:id').post(isAuthenticatedUser, roomAddReview);

module.exports = router;
