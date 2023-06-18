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
const { createRoom } = require('../controllers/room.controllers');

// routes for create new room
router.route('/create-room').post(isAuthenticatedUser, isAdmin, roomImageUpload.array('room_images', 5), createRoom);

module.exports = router;
