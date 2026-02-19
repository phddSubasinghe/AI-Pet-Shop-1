import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'pawpop-dev-secret-change-in-production';

/**
 * Optional auth: if valid Bearer token present, sets req.userId and req.authUser.
 * Does not reject request if no token or invalid (use requireAuth for that).
 */
export async function optionalAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return next();
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).lean();
    if (!user) return next();
    req.userId = decoded.userId;
    req.authUser = user;
    next();
  } catch {
    next();
  }
}

/**
 * Require auth: returns 401 if no valid Bearer token or user not found.
 */
export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).lean();
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.userId = decoded.userId;
    req.authUser = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require admin: use after requireAuth. Returns 403 if user is not an admin.
 */
export function requireAdmin(req, res, next) {
  if (req.authUser?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}
