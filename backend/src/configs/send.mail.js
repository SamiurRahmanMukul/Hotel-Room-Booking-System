const sgMail = require('@sendgrid/mail');
const { successResponse, errorResponse } = require('./app.response');

const sendEmail = async (res, user, url, subjects, message, title) => {
  sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

  const msg = {
    to: user.email,
    from: process.env.SEND_SENDER_MAIL,
    subject: subjects,
    text: message,
    html: `<div>
      <h4>${title}</h4>
      <a href="${url}" target="_blank"> >>> Click Here</a>
    </div>`
  };

  await sgMail.send(msg).then(() => {
    res.status(200).json(successResponse(
      0,
      'SUCCESS',
      `Email sent to ${user.email} successful`
    ));
  }).catch(async (error) => {
    // eslint-disable-next-line no-param-reassign
    user.resetPasswordToken = undefined;
    // eslint-disable-next-line no-param-reassign
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(500).json(errorResponse(
      2,
      'SERVER SIDE ERROR',
      error
    ));
  });
};

module.exports = sendEmail;
