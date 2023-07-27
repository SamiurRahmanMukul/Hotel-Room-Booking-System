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
const { roomReviewAdd } = require('../controllers/review.controllers');

// route for add user room review
router.route('/room-review-add/:id').post(isAuthenticatedUser, isBlocked, roomReviewAdd);

// routes for get all and specific room review list
// router.route('/get-all-reviews-list').get(isAuthenticatedUser, isBlocked, isAdmin, getAllReviewsList);
// router.route('/get-room-reviews-list/:id').get(isAuthenticatedUser, isBlocked, isAdmin, getRoomReviewsList);

// routes for edit and delete an room review
// router.route('/edit-room-review/:id').put(isAuthenticatedUser, isBlocked, editRoomReview);
// router.route('/delete-room-review/:id').delete(isAuthenticatedUser, isBlocked, isAdmin, deleteRoomReview);

module.exports = router;
