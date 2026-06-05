import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const events = Array.isArray(req.body) ? req.body : [req.body];
    if (!events.length) return res.json({ ok: true });

    const today = new Date().toISOString().slice(0, 10);
    const key = `analytics:${today}`;

    // Read existing events, append new ones, write back
    const existing = await kv.get(key);
    const list = Array.isArray(existing) ? existing : [];
    for (const ev of events) {
      list.push(ev);
    }
    await kv.set(key, JSON.stringify(list));
    await kv.expire(key, 60 * 60 * 24 * 7);

    res.json({ ok: true, stored: events.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
