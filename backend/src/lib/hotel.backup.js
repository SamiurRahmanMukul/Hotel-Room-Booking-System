const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');
const execPromise = util.promisify(exec);
const { getPlatformConnection } = require('./platform.connection');

const BACKUP_DIR = path.join(__dirname, '../../../backups');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function getBaseUri() {
  return process.env.MONGO_BASE_URI || 'mongodb://localhost:27017';
}

async function backupHotel(slug) {
  const { models } = getPlatformConnection();
  const hotel = await models.Hotel.findOne({ slug });
  if (!hotel) throw new Error('Hotel not found');

  const dbName = hotel.dbName;
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archivePath = path.join(BACKUP_DIR, `${dbName}_${timestamp}.gzip`);
  
  // Mongodump command using gzip archive format for single file portability
  const uri = `${getBaseUri()}/${dbName}`;
  const cmd = `mongodump --uri="${uri}" --archive="${archivePath}" --gzip`;

  try {
    await execPromise(cmd);
    return { success: true, backupFileName: path.basename(archivePath), message: 'Backup created successfully' };
  } catch (error) {
    throw new Error(`Backup failed: ${error.message}`);
  }
}

async function restoreHotel(slug, backupFileName) {
  const { models } = getPlatformConnection();
  const hotel = await models.Hotel.findOne({ slug });
  if (!hotel) throw new Error('Hotel not found');

  const dbName = hotel.dbName;
  const archivePath = path.join(BACKUP_DIR, backupFileName);

  if (!fs.existsSync(archivePath)) {
    throw new Error(`Backup archive not found at: ${archivePath}`);
  }

  const uri = `${getBaseUri()}/${dbName}`;
  // Use --drop to overwrite the db cleanly
  const cmd = `mongorestore --uri="${uri}" --archive="${archivePath}" --gzip --drop`;

  try {
    await execPromise(cmd);
    return { success: true, message: 'Database restored successfully' };
  } catch (error) {
    throw new Error(`Restore failed: ${error.message}`);
  }
}

async function listBackups(slug) {
  const { models } = getPlatformConnection();
  const hotel = await models.Hotel.findOne({ slug });
  if (!hotel) throw new Error('Hotel not found');

  const dbName = hotel.dbName;
  if (!fs.existsSync(BACKUP_DIR)) return [];
  
  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith(dbName + '_') && file.endsWith('.gzip'))
    .map(file => {
      const stats = fs.statSync(path.join(BACKUP_DIR, file));
      return {
        fileName: file,
        sizeBytes: stats.size,
        createdAt: stats.mtime
      };
    });
  
  return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Newest first
}

module.exports = {
  backupHotel,
  restoreHotel,
  listBackups
};
