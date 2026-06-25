const router = require('express').Router();
const { isAuthenticatedUser, isBlocked, isAdmin } = require('../middleware/app.authentication');
const { getPriceGrid, setPrices } = require('../controllers/price.controllers');

router.route('/prices')
  .get(isAuthenticatedUser, isBlocked, isAdmin, getPriceGrid)
  .post(isAuthenticatedUser, isBlocked, isAdmin, setPrices);

module.exports = router;
