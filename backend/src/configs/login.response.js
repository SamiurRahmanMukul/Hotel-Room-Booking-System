const currentDateTime = require('../lib/current.date.time');

/**
 * function to success response login user with JWT access and refresh token
 * @param {*} res node/express app res objects
 * @param {*} user API response in login user information
 * @param {*} maintenance API provide any kind of maintenance information
 */
const loginResponse = (res, user, maintenance) => {
  const accessToken = user.getJWTToken();
  const refreshToken = user.getJWTRefreshToken();

  // options for cookie
  const options = {
    expires: new Date(Date.now() + process.env.JWT_TOKEN_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    httpOnly: true
  };

  res
    .status(200)
    .cookie('AccessToken', accessToken, options)
    .json({
      result_code: 0,
      time: currentDateTime(),
      maintenance_info: maintenance || null,
      access_token: accessToken,
      refresh_token: refreshToken,
      result: {
        title: 'SUCCESS',
        message: 'User login successful',
        data: {
          id: user._id,
          userName: user.userName,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          avatar: process.env.APP_BASE_URL + user.avatar,
          gender: user.gender,
          dob: user.dob,
          address: user.address,
          role: user.role,
          verified: user.verified,
          status: user.status,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
    });
};

module.exports = loginResponse;
