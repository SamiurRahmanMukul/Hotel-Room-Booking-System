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
  createRoom, getRoomsList, getRoomByIdOrSlugName, editRoomByAdmin, deleteRoomById, getFeaturedRoomsList,
  assignFloor, patchRoomDetails, bulkDeleteRooms
} = require('../controllers/room.controllers');

// route for create new room (legacy image-heavy form)
router.route('/create-room').post(isAuthenticatedUser, isAdmin, roomImageUpload.array('room_images', 5), createRoom);

// units are generated from room-type quantity; these number them by floor + manage them
router.route('/rooms/assign-floor').post(isAuthenticatedUser, isAdmin, assignFloor);
router.route('/rooms/:id/settings').patch(isAuthenticatedUser, isAdmin, patchRoomDetails);
router.route('/rooms/bulk-delete').post(isAuthenticatedUser, isAdmin, bulkDeleteRooms);

// routes for get all, single and featured rooms list
router.route('/all-rooms-list').get(getRoomsList);
router.route('/get-room-by-id-or-slug-name/:id').get(getRoomByIdOrSlugName);
router.route('/featured-rooms-list').get(getFeaturedRoomsList);

// routes for edit and delete room by admin
router.route('/edit-room/:id').put(isAuthenticatedUser, isAdmin, roomImageUpload.array('room_images', 5), editRoomByAdmin);
router.route('/delete-room/:id').delete(isAuthenticatedUser, isAdmin, deleteRoomById);

module.exports = router;
