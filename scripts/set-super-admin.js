/* eslint-disable no-console */
/**
 * Point the existing super admin at ADMIN_EMAIL / ADMIN_PASSWORD from .env.
 *
 * The server only seeds a super admin when none exists, so changing those two values in .env
 * does nothing to an existing database. Run this once after changing them:
 *
 *   node scripts/set-super-admin.js --dry-run   # show what would change
 *   node scripts/set-super-admin.js
 *
 * It also clears the stored refresh token, so sessions opened with the old login end at their
 * next refresh.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const dryRun = process.argv.includes('--dry-run');

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'whatsapp-bsp';
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!uri) throw new Error('MONGODB_URI is not set');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('ADMIN_EMAIL is not a valid email');
  if (password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    throw new Error('ADMIN_PASSWORD needs 8+ characters with an upper case letter, a lower case letter and a digit');
  }

  await mongoose.connect(uri, { dbName, serverSelectionTimeoutMS: 15000 });
  const users = mongoose.connection.collection('users');

  const admins = await users.find({ role: 'super_admin' }, { projection: { email: 1 } }).toArray();
  if (admins.length === 0) {
    console.log('No super admin yet. Start the server once and it will be created from .env.');
    return;
  }
  if (admins.length > 1) {
    throw new Error(`Found ${admins.length} super admins (${admins.map((a) => a.email).join(', ')}); update one by hand.`);
  }

  const admin = admins[0];
  const clash = await users.findOne({ email, _id: { $ne: admin._id } }, { projection: { role: 1 } });
  if (clash) throw new Error(`${email} already belongs to another user (${clash.role}).`);

  console.log(`Super admin ${admin._id}: ${admin.email} -> ${email}${dryRun ? ' (dry run, nothing written)' : ''}`);
  if (dryRun) return;

  const hashed = await bcrypt.hash(password, 12);
  await users.updateOne(
    { _id: admin._id, role: 'super_admin' },
    { $set: { email, password: hashed, updatedAt: new Date() }, $unset: { refreshToken: '' } },
  );

  const saved = await users.findOne({ _id: admin._id }, { projection: { email: 1, password: 1 } });
  const ok = saved.email === email && (await bcrypt.compare(password, saved.password));
  if (!ok) throw new Error('Update did not stick — check the database.');
  console.log('Done. Log in with the new email and password.');
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
