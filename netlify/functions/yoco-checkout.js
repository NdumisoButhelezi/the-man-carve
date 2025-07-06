import axios from 'axios';

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const YOCO_API_URL = 'https://payments.yoco.com/api';
  const YOCO_SECRET_KEY = process.env.VITE_YOCO_SECRET_KEY;

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
    return res.status(yocoRes.status).json(yocoRes.data);
  } catch (err) {
    console.error('Yoco API Error:', {
      message: err.message,
      status: err.response?.status,
      data: err.response?.data,
      stack: err.stack
    });
    return res.status(err.response?.status || 500).json({
      error: err.message,
      details: err.response?.data || null
    });
  }
};
