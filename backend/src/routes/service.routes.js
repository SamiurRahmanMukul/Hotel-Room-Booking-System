const router = require('express').Router();
const { isAuthenticatedUser, isBlocked, isAdmin } = require('../middleware/app.authentication');
const {
  getServicesList, createService, updateService, deleteService
} = require('../controllers/service.controllers');

router.route('/services')
  .get(isAuthenticatedUser, isBlocked, isAdmin, getServicesList)
  .post(isAuthenticatedUser, isBlocked, isAdmin, createService);

router.route('/services/:id')
  .patch(isAuthenticatedUser, isBlocked, isAdmin, updateService)
  .delete(isAuthenticatedUser, isBlocked, isAdmin, deleteService);

module.exports = router;
