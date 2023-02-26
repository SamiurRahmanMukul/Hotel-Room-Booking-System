const fs = require('fs');
const path = require('path');
const appRoot = require('app-root-path');
const morgan = require('morgan');

function morganLogger() {
  const LOGS_FOLDER = `${appRoot}/logs`;

  if (!fs.existsSync(LOGS_FOLDER)) {
    fs.mkdirSync(LOGS_FOLDER);
  }

  const accessLogStream = fs.createWriteStream(path.join(LOGS_FOLDER, 'app-access.log'), { flags: 'a' });
  return (morgan('combined', { stream: accessLogStream }));
}

module.exports = morganLogger;
