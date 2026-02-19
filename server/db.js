import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root (parent of server/)
dotenv.config({ path: join(__dirname, '..', '.env') });

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

// Build URI from separate env vars (password encoded for special chars)
const MONGODB_URI = `mongodb+srv://${MONGODB_USER}:${encodeURIComponent(MONGODB_PASSWORD)}@${MONGODB_HOST}/${MONGODB_DATABASE}?retryWrites=true&w=majority&appName=${encodeURIComponent(MONGODB_APP_NAME)}`;

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB Atlas connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

export default mongoose;
