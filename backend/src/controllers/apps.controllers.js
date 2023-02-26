const { errorResponse, successResponse } = require('../configs/app.response');
const User = require('../models/user.model');

// TODO: Controller for get users list for admin
exports.getDashboardData = async (req, res) => {
  try {
    const { user } = req;

    if (!user) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'User does not exist'
      ));
    }

    // finding all users data from database
    const totalUsers = await User.find();

    if (!totalUsers) {
      return res.status(404).json(errorResponse(
        4,
        'UNKNOWN ACCESS',
        'Sorry! Any user does not found'
      ));
    }

    // finding all users data from database specific criteria
    const adminRoleUsers = await User.find({ role: 'admin' });
    const userRoleUsers = await User.find({ role: 'user' });
    const registerStatusUsers = await User.find({ status: 'register' });
    const loginStatusUsers = await User.find({ status: 'login' });
    const logoutStatusUsers = await User.find({ status: 'logout' });
    const blockedStatusUsers = await User.find({ status: 'blocked' });
    const verifiedUsers = await User.find({ verified: true });

    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      'Dashboard information get successful',
      {
        users_info: {
          total_users: totalUsers?.length || 0,
          admin_role_user: adminRoleUsers?.length || 0,
          user_role_user: userRoleUsers?.length || 0,
          register_status_user: registerStatusUsers?.length || 0,
          login_status_user: loginStatusUsers?.length || 0,
          logout_status_user: logoutStatusUsers?.length || 0,
          blocked_status_user: blockedStatusUsers?.length || 0,
          verified_user: verifiedUsers?.length || 0
        }
      }
    ));
  } catch (error) {
    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  }
};
