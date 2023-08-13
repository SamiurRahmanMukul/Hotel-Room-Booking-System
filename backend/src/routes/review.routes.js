/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

const router = require('express').Router();
const { isAuthenticatedUser, isBlocked } = require('../middleware/app.authentication');
const { roomReviewAdd, getRoomReviewsList, editSelfRoomReview } = require('../controllers/review.controllers');

// route for add user room review
router.route('/room-review-add/:id').post(isAuthenticatedUser, isBlocked, roomReviewAdd);

// route for get a room review list
router.route('/get-room-reviews-list/:room_id').get(getRoomReviewsList);

// route for edit self room review
router.route('/edit-room-review/:review_id').put(isAuthenticatedUser, isBlocked, editSelfRoomReview);

module.exports = router;
