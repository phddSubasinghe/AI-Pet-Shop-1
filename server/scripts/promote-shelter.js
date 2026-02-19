/**
 * Set a user's role to 'shelter' (and optionally status to 'active') by email.
 * Use when the database has the wrong role (e.g. shelter signup didn't persist correctly).
 * Run from project root: node server/scripts/promote-shelter.js <email>
 * Or: EMAIL=user@example.com node server/scripts/promote-shelter.js
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const email = (process.env.EMAIL || process.argv[2] || '').trim().toLowerCase();
if (!email) {
  console.error('Usage: node server/scripts/promote-shelter.js <email>');
  console.error('   or: EMAIL=user@example.com node server/scripts/promote-shelter.js');
  process.exit(1);
}

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

const uri = `mongodb+srv://${MONGODB_USER}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}/${MONGODB_DATABASE}?retryWrites=true&w=majority&appName=${encodeURIComponent(MONGODB_APP_NAME)}`;

async function main() {
  await mongoose.connect(uri);
  console.log('MongoDB connected');

  const user = await User.findOne({ email }).lean();
  if (!user) {
    console.error('No user found with email:', email);
    await mongoose.disconnect();
    process.exit(1);
  }

  await User.updateOne(
    { email },
    { $set: { role: 'shelter', status: 'active' } }
  );
  console.log('Updated user to shelter (and active):', email);
  console.log('They can sign in again to use the shelter dashboard.');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
