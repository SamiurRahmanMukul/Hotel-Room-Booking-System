/**
 * Unit attribute routes (admin-only).
 */

const router = require('express').Router();
const { isAuthenticatedUser, isBlocked, isAdmin } = require('../middleware/app.authentication');
const {
  getAttributesList, createAttribute, updateAttribute, deleteAttribute
} = require('../controllers/attribute.controllers');

router.route('/attributes')
  .get(isAuthenticatedUser, isBlocked, isAdmin, getAttributesList)
  .post(isAuthenticatedUser, isBlocked, isAdmin, createAttribute);

router.route('/attributes/:id')
  .patch(isAuthenticatedUser, isBlocked, isAdmin, updateAttribute)
  .delete(isAuthenticatedUser, isBlocked, isAdmin, deleteAttribute);

module.exports = router;
