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
  const YOCO_SECRET_KEY = process.env.VITE_YOCO_SECRET_KEY || process.env.YOCO_SECRET_KEY;

  try {
    const reqBody = JSON.parse(event.body);
    const { token, ...payload } = reqBody;
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
    return {
      statusCode: yocoRes.status,
      body: JSON.stringify(yocoRes.data)
    };
  } catch (err) {
    return {
      statusCode: err.response?.status || 500,
      body: JSON.stringify({
        error: err.response?.data || err.message,
      })
    };
  }
};
