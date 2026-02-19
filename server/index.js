import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose, { connectDB } from './db.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import adminOpenaiRouter from './routes/adminOpenai.js';
import adminHealthRouter from './routes/adminHealth.js';
import sellerRouter from './routes/seller.js';
import shelterRouter from './routes/shelter.js';
import eventsRouter from './routes/events.js';
import fundraisingRouter from './routes/fundraising.js';
import ordersRouter from './routes/orders.js';
import petsRouter from './routes/pets.js';
import adoptionRequestsRouter from './routes/adoptionRequests.js';
import meRouter from './routes/me.js';
import adoptionReviewsRouter from './routes/adoptionReviews.js';
import matchmakingRouter from './routes/matchmaking.js';
import { Category } from './models/Category.js';
import { setIO, notifyCategoriesChanged } from './socket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
setIO(io);
app.use(cors());
app.use(express.json());

// Serve product images from data/products
const productsUploadsDir = path.join(__dirname, 'data', 'products');
app.use('/api/products/uploads', express.static(productsUploadsDir));
// Serve seller logos from data/seller
const sellerUploadsDir = path.join(__dirname, 'data', 'seller');
app.use('/api/seller/uploads', express.static(sellerUploadsDir));
// Serve shelter logos from data/shelter
const shelterUploadsDir = path.join(__dirname, 'data', 'shelter');
app.use('/api/shelter/uploads', express.static(shelterUploadsDir));
// Serve pet images from data/pets (shelter uploads; reference stored in Pet.image)
const petsUploadsDir = path.join(__dirname, 'data', 'pets');
app.use('/api/pets/uploads', express.static(petsUploadsDir));
// Serve event banner images from data/event
const eventUploadsDir = path.join(__dirname, 'data', 'event');
app.use('/api/shelter/events/uploads', express.static(eventUploadsDir));
// Fundraising campaign images from data/funds
const fundsUploadsDir = path.join(__dirname, 'data', 'funds');
app.use('/api/shelter/campaigns/uploads', express.static(fundsUploadsDir));
// Adoption review images (happy matches)
const adoptionReviewsUploadsDir = path.join(__dirname, 'data', 'adoption-reviews');
app.use('/api/adoption-reviews/uploads', express.static(adoptionReviewsUploadsDir));

// Explicit POST /api/categories so add-category always works (router also handles GET/PUT/DELETE)
app.post('/api/categories', async (req, res) => {
  try {
    const { name, order } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const doc = await Category.create({
      name: String(name).trim(),
      order: order != null ? Number(order) : 0,
    });
    const created = doc.toJSON();
    notifyCategoriesChanged();
    return res.status(201).json(created);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Category name already exists' });
    return res.status(400).json({ error: err.message });
  }
});
// Mount categories router (GET list, PUT/DELETE by id)
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin/openai', adminOpenaiRouter);
app.use('/api/admin/health', adminHealthRouter);
app.use('/api/admin', adminRouter);
app.use('/api/seller', sellerRouter);
app.use('/api/shelter', shelterRouter);
app.use('/api/events', eventsRouter);
app.use('/api/fundraising', fundraisingRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/pets', petsRouter);
app.use('/api/adoption-requests', adoptionRequestsRouter);
app.use('/api/me', meRouter);
app.use('/api/adoption-reviews', adoptionReviewsRouter);
app.use('/api/matchmaking', matchmakingRouter);

// Health check (also confirms DB is up)
app.get('/api/health', (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    res.json({
      ok: state === 1,
      mongodb: states[state] ?? 'unknown',
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Seed default categories if none exist
async function seedCategories() {
  const count = await Category.countDocuments();
  if (count > 0) return;
  await Category.insertMany([
    { name: 'Food', order: 0 },
    { name: 'Toys', order: 1 },
    { name: 'Accessories', order: 2 },
  ]);
  console.log('Seeded default categories');
}

// Connect to MongoDB then start server
connectDB().then(async () => {
  await seedCategories();
  httpServer.listen(PORT, () => {
    console.log(`PawPop API running at http://localhost:${PORT}`);
  });
});
