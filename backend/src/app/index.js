/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright Â©2023 â€• Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

// imports modules & dependencies
const express = require('express');
const favicon = require('serve-favicon');
const crossOrigin = require('cors');
const cookieParser = require('cookie-parser');
const appRoot = require('app-root-path');
const helmet = require('helmet');
const env = require('dotenv');

// imports application middleware and routes
const morganLogger = require('../middleware/morgan.logger');
const defaultController = require('../controllers/default.controller');
const { notFoundRoute, errorHandler } = require('../middleware/error.handler');
const { limiter } = require('../middleware/access.limiter');
const corsOptions = require('../configs/cors.config');
const authRoute = require('../routes/auth.routes');
const userRoute = require('../routes/user.routes');
const appsRoute = require('../routes/apps.routes');
const roomRoute = require('../routes/room.routes');
const bookingRoute = require('../routes/booking.route');
const reviewRoute = require('../routes/review.routes');

// load environment variables from .env file
env.config();

// initialize express app
const app = express();

// limiting middleware to all requests
app.use(limiter);

// application database connection establishment
const connectDatabase = require('../database/connect.mongo.db');

(async () => {
  await connectDatabase();
})();

// HTTP request logger middleware
if (process.env.APP_NODE_ENV !== 'production') {
  app.use(morganLogger());
}

// secure HTTP headers setting middleware
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// allow cross-origin resource sharing
app.use(crossOrigin(corsOptions));

// parse cookies from request
app.use(cookieParser());

// parse body of request
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// sets favicon in API routes
if (process.env.APP_NODE_ENV !== 'production') {
  app.use(favicon(`${appRoot}/public/favicon.ico`));
}

// sets static folder
app.use(express.static('public'));

// response default (welcome) route
app.get('/', defaultController);

// platform-scoped routes (super-admin) — mounted BEFORE tenantResolver so they bypass it
app.use('/platform-api', require('../routes/superadmin.routes'));

// resolve tenant for every API request: sets req.hotel, req.db, req.M
const tenantResolver = require('../middleware/tenant.resolver');
app.use('/api/v1', tenantResolver);

// sets application API's routes
app.use('/api/v1', authRoute); // auth routes
app.use('/api/v1', require('../routes/magic.link.routes')); // magic-link verify + set-password
app.use('/api/v1', require('../routes/onboarding.routes')); // checklist + publish + hotel settings
app.use('/api/v1', userRoute); // user routes
app.use('/api/v1', appsRoute); // apps routes
app.use('/api/v1', roomRoute); // room routes
app.use('/api/v1', require('../routes/room.type.routes')); // room type routes
app.use('/api/v1', require('../routes/attribute.routes')); // unit attribute routes
app.use('/api/v1', require('../routes/price.routes')); // price grid routes
app.use('/api/v1', require('../routes/service.routes')); // paid services routes
app.use('/api/v1', require('../routes/policy.routes')); // cancellation / no-show policy routes
app.use('/api/v1', bookingRoute); // booking routes
app.use('/api/v1', reviewRoute); // review routes

// 404 ~ not found error handler
app.use(notFoundRoute);

// 500 ~ internal server error handler
app.use(errorHandler);

// default export ~ app
module.exports = app;
