/**
 * Create or promote an admin user. Uses same DB and hashing as the API.
 * Run from project root: node server/scripts/promote-admin.js
 *
 * Default: admin@gmail.com / admin@123 (change below or pass EMAIL PASSWORD as env)
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const SALT_ROUNDS = 10;

const email = (process.env.EMAIL || process.argv[2] || 'admin@gmail.com').trim().toLowerCase();
const password = process.env.PASSWORD || process.argv[3] || 'admin@123';

const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD;
const MONGODB_HOST = process.env.MONGODB_HOST;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'pawpop';
const MONGODB_APP_NAME = process.env.MONGODB_APP_NAME || 'pawpop';

const required = [
  ['MONGODB_USER', MONGODB_USER],
  ['MONGODB_PASSWORD', MONGODB_PASSWORD],
  ['MONGODB_HOST', MONGODB_HOST],
];
const missing = required.filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  console.error('Missing in .env:', missing.join(', '));
  process.exit(1);
}

if (password.length < 8) {
  console.error('Password must be at least 8 characters');
  process.exit(1);
}

const uri = `mongodb+srv://${MONGODB_USER}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}/${MONGODB_DATABASE}?retryWrites=true&w=majority&appName=${encodeURIComponent(MONGODB_APP_NAME)}`;

async function main() {
  await mongoose.connect(uri);
  console.log('MongoDB connected');

  const existing = await User.findOne({ email }).lean();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  if (existing) {
    await User.updateOne(
      { email },
      { $set: { role: 'admin', status: 'active', passwordHash } }
    );
    console.log('Updated existing user to admin:', email);
  } else {
    await User.create({
      email,
      passwordHash,
      role: 'admin',
      status: 'active',
      name: 'Admin',
    });
    console.log('Created admin user:', email);
  }

  console.log('You can sign in with:', email, '/', password);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
