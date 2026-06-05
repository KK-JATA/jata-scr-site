import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const key = req.query.key || 'analytics:2026-06-04';
  try {
    const raw = await kv.lrange(key, 0, -1);
    res.json({ key, count: raw ? raw.length : 0, raw: raw });
  } catch (e) {
    res.json({ error: e.message });
  }
}
