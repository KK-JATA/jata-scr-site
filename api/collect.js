import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    if (!events.length) return res.json({ ok: true });

    // Store under daily key: analytics:2026-06-04
    const today = new Date().toISOString().slice(0, 10);
    const key = `analytics:${today}`;

    // Push all events to a Redis list, expire after 7 days
    for (const ev of events) {
      await kv.rpush(key, JSON.stringify(ev));
    }
    await kv.expire(key, 60 * 60 * 24 * 7);

    res.json({ ok: true, stored: events.length });
  } catch (e) {
    res.status(500).json({ error: 'Failed to store events' });
  }
}
