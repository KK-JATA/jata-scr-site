import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // Delete old rpush-style keys that conflict with new get/set format
    const d = new Date();
    const keys = [];
    for (let i = 0; i < 3; i++) {
      keys.push(`analytics:${d.toISOString().slice(0, 10)}`);
      d.setDate(d.getDate() - 1);
    }
    for (const k of keys) {
      try { await kv.del(k); } catch (e) {}
    }
    res.json({ ok: true, cleaned: keys });
  } catch (e) {
    res.json({ error: e.message });
  }
}
