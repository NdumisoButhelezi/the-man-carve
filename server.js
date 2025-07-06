
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import admin from 'firebase-admin';
import { createRequire } from 'module';

dotenv.config();

const app = express();

const require = createRequire(import.meta.url);
let serviceAccount = null;
let useEnv = false;
try {
  serviceAccount = require('./tatatickets-9b513-firebase-adminsdk-fbsvc-c6a69040b9.json');
} catch (err) {
  // If file not found, use env vars (production)
  useEnv = true;
}

if (!admin.apps.length) {
  if (useEnv) {
    // Build service account from environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing one or more Firebase environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY');
    }
    if (privateKey && privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id || 'tatatickets-9b513',
    });
  }
}
const firestore = admin.firestore();

console.log('Backend Firebase project:', admin.app().options.projectId);
// --- Ticket fetch and update endpoints ---
// Fetch a ticket by ID
app.get('/api/ticket/:id', async (req, res) => {
  try {
    const doc = await firestore.collection('tickets').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a ticket by ID
app.put('/api/ticket/:id', async (req, res) => {
  try {
    await firestore.collection('tickets').doc(req.params.id).update(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Yoco webhook endpoint
app.post('/api/yoco-webhook', async (req, res) => {
  try {
    // Yoco sends event type and data
    const event = req.body;
    // Only handle payment success events
    if (event && event.type === 'checkout.succeeded') {
      const meta = event.data?.metadata || {};
      const ticketType = meta.ticketType;
      const userId = meta.userId;
      const userName = meta.customerName;
      const userEmail = meta.customerEmail;
      const userPhone = meta.customerPhone;
      const price = parseInt(event.data.amount) / 100;
      const paymentId = event.data.id;
      if (!ticketType || !userId) {
        return res.status(400).json({ error: 'Missing ticketType or userId in metadata' });
      }
      // Find an available ticket of this type
      const ticketsRef = firestore.collection('tickets');
      const availableSnap = await ticketsRef
        .where('ticketType', '==', ticketType)
        .where('status', '==', 'available')
        .where('ticketType', '!=', 'Unknown')
        .where('price', '>', 0)
        .limit(1)
        .get();
      if (availableSnap.empty) {
        return res.status(409).json({ error: 'No available tickets to assign' });
      }
      const ticketDoc = availableSnap.docs[0];
      await ticketDoc.ref.update({
        ticketType,
        price,
        userName,
        userEmail,
        userId,
        purchaseDate: new Date().toISOString(),
        status: 'confirmed',
        phone: userPhone,
        scanned: false,
        qrCodeGenerated: true,
        qrGeneratedAt: new Date().toISOString(),
        paymentId,
        paymentMethod: 'yoco',
      });
      return res.json({ success: true, ticketId: ticketDoc.id });
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rate limiting middleware (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.'
  }
});
app.use(limiter);
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'https://project-igovu.vercel.app',
  'https://themancarve.netlify.app' // Added Netlify production site
];
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      /^https:\/\/.*\.vercel\.app$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

const YOCO_API_URL = 'https://payments.yoco.com/api';
const YOCO_SECRET_KEY = process.env.VITE_YOCO_SECRET_KEY;

app.post('/api/yoco-checkout', async (req, res) => {
  try {
    const { token, ...payload } = req.body;
    const idempotencyKey = `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    if (payload.metadata) {
      for (const key in payload.metadata) {
        payload.metadata[key] = String(payload.metadata[key]);
      }
    }
    const yocoRes = await axios.post(
      `${YOCO_API_URL}/checkouts`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
          'Idempotency-Key': idempotencyKey,
        },
      }
    );
    res.status(yocoRes.status).json(yocoRes.data);
  } catch (err) {
    console.error('Yoco API Error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      stack: err.stack
    });
    res.status(err.response?.status || 500).json({
      error: err.response?.data || err.message,
    });
  }
});

app.get('/api/yoco-checkout/:id', async (req, res) => {
  try {
    const yocoRes = await axios.get(
      `${YOCO_API_URL}/checkouts/${req.params.id}`,
      {
        headers: {
          'Authorization': `Bearer ${YOCO_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.status(yocoRes.status).json(yocoRes.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      error: err.response?.data || err.message,
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Root route for quick server check
app.get('/', (req, res) => {
  res.send('Yoco proxy server is running!');
});


// Debug endpoint: List all available tickets by type
app.get('/api/debug/available-tickets', async (req, res) => {
  try {
    const ticketsRef = firestore.collection('tickets');
    const availableSnap = await ticketsRef.where('status', '==', 'available').get();
    const tickets = {};
    availableSnap.forEach(doc => {
      const data = doc.data();
      const type = data.ticketType || 'UNKNOWN';
      if (!tickets[type]) tickets[type] = [];
      tickets[type].push({ id: doc.id, ...data });
    });
    res.json({ availableTickets: tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint: List ALL tickets (for troubleshooting)
app.get('/api/debug/all-tickets', async (req, res) => {
  try {
    const ticketsRef = firestore.collection('tickets');
    const allSnap = await ticketsRef.get();
    const tickets = [];
    allSnap.forEach(doc => {
      tickets.push({ id: doc.id, ...doc.data() });
    });
    res.json({ allTickets: tickets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Yoco proxy server running on port ${PORT}`);
});
