import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pawpop-dev-secret-change-in-production';
const SALT_ROUNDS = 10;

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/** POST /api/auth/signup – register Adopter, Seller, or Shelter (AWO) */
router.post('/signup', async (req, res) => {
  try {
    const body = req.body || {};
    const role = body.role === 'adopter' || body.role === 'seller' || body.role === 'shelter' ? body.role : null;
    if (!role) {
      return res.status(400).json({ error: 'Role must be adopter, seller, or shelter' });
    }
    // Shelter uses ownerEmail/ownerName as account email/name
    const email = String(body.email ?? body.ownerEmail ?? '').trim().toLowerCase();
    const password = body.password;
    const name = String(body.name ?? body.fullName ?? body.ownerName ?? '').trim();
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const userDoc = {
      email,
      passwordHash,
      role,
      name,
    };

    if (role === 'adopter') {
      userDoc.status = 'active';
      userDoc.contactNumber = body.contactNumber ? String(body.contactNumber).trim() : null;
    }

    if (role === 'seller') {
      userDoc.status = 'pending';
      userDoc.shopName = body.shopName ? String(body.shopName).trim() : null;
      userDoc.pickupAddress = body.pickupAddress ? String(body.pickupAddress).trim() : null;
      userDoc.contactNumber = body.contactNumber ? String(body.contactNumber).trim() : null;
    }

    if (role === 'shelter') {
      userDoc.status = 'pending';
      userDoc.organizationName = body.organizationName ? String(body.organizationName).trim() : null;
      userDoc.address = body.address ? String(body.address).trim() : null;
      userDoc.district = body.district ? String(body.district).trim() : null;
      userDoc.contactEmail = body.contactEmail ? String(body.contactEmail).trim() : null;
      userDoc.contactNumberShelter = body.contactNumber ? String(body.contactNumber).trim() : null;
      userDoc.description = body.description ? String(body.description).trim() : null;
      userDoc.website = body.website ? String(body.website).trim() : null;
      userDoc.logoUrl = body.logoUrl ? String(body.logoUrl).trim() : null;
      userDoc.ownerName = body.ownerName ? String(body.ownerName).trim() : null;
      userDoc.ownerEmail = body.ownerEmail ? String(body.ownerEmail).trim() : null;
      userDoc.ownerPhone = body.ownerPhone ? String(body.ownerPhone).trim() : null;
    }

    const user = await User.create(userDoc);
    const userJson = user.toJSON();
    const token = signToken(userJson);
    return res.status(201).json({ user: userJson, token });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Email already registered' });
    return res.status(500).json({ error: err.message });
  }
});

/** POST /api/auth/signin – login Seller or Shelter */
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const emailStr = String(email || '').trim().toLowerCase();
    if (!emailStr || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: emailStr });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    if (user.status === 'blocked') {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact support.' });
    }

    const userJson = user.toJSON();
    const token = signToken(userJson);
    return res.json({ user: userJson, token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
