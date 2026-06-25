/**
 * Room type routes (admin-only). Phase 1: count-mode CRUD.
 */

const router = require('express').Router();
const { isAuthenticatedUser, isBlocked, isAdmin } = require('../middleware/app.authentication');
const {
  getRoomTypesList, createRoomType, updateRoomType, deleteRoomType
} = require('../controllers/room.type.controllers');

router.route('/room-types')
  .get(isAuthenticatedUser, isBlocked, isAdmin, getRoomTypesList)
  .post(isAuthenticatedUser, isBlocked, isAdmin, createRoomType);

router.route('/room-types/:id')
  .patch(isAuthenticatedUser, isBlocked, isAdmin, updateRoomType)
  .delete(isAuthenticatedUser, isBlocked, isAdmin, deleteRoomType);

module.exports = router;
