// Rename this file to yoco-checkout.cjs to fix the "module is not defined in ES module scope" error.
// Netlify detects ".js" as ESM if your package.json has "type": "module".
// Changing the extension to ".cjs" will force CommonJS mode, which is required for Netlify functions using require().

const axios = require('axios');

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { Allow: 'POST' },
      body: `Method ${event.httpMethod} Not Allowed`
    };
  }

  const YOCO_API_URL = 'https://payments.yoco.com/api';
  // Use only the live secret key from env
  const YOCO_SECRET_KEY = process.env.VITE_YOCO_SECRET_KEY || process.env.YOCO_SECRET_KEY;

  if (!YOCO_SECRET_KEY || YOCO_SECRET_KEY.startsWith('sk_test')) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Yoco secret key is missing or is a test key. Please set your live key in the environment variables.'
      })
    };
  }

  try {
    const reqBody = JSON.parse(event.body);
    const { token, ...payload } = reqBody;
    const idempotencyKey = `checkout_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    if (payload.metadata) {
      for (const key in payload.metadata) {
        payload.metadata[key] = String(payload.metadata[key]);
      }
    }
    // Debug: log payload and endpoint
    console.log('Yoco Checkout Payload:', payload);
    console.log('Yoco Endpoint:', `${YOCO_API_URL}/checkouts`);
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
    // Debug: log Yoco response
    console.log('Yoco API Response:', yocoRes.data);
    return {
      statusCode: yocoRes.status,
      body: JSON.stringify(yocoRes.data)
    };
  } catch (err) {
    // Debug: log error details
    console.error('Yoco API Error:', err.response?.data || err.message);
    return {
      statusCode: err.response?.status || 500,
      body: JSON.stringify({
        error: err.response?.data || err.message,
      })
    };
  }
};
