const router = require('express').Router();
const { isAuthenticatedUser, isBlocked, isAdmin } = require('../middleware/app.authentication');
const {
  getPoliciesList, createPolicy, updatePolicy, deletePolicy
} = require('../controllers/policy.controllers');

router.route('/policies')
  .get(isAuthenticatedUser, isBlocked, isAdmin, getPoliciesList)
  .post(isAuthenticatedUser, isBlocked, isAdmin, createPolicy);

router.route('/policies/:id')
  .patch(isAuthenticatedUser, isBlocked, isAdmin, updatePolicy)
  .delete(isAuthenticatedUser, isBlocked, isAdmin, deletePolicy);

module.exports = router;
