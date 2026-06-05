import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    // Check if env vars exist
    const vars = {
      KV_URL: process.env.KV_URL ? 'set' : 'MISSING',
      KV_REST_API_URL: process.env.KV_REST_API_URL ? 'set' : 'MISSING',
      KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'set' : 'MISSING',
    };

    // Try a simple KV operation
    let kvResult = '';
    try {
      await kv.set('test-key', 'hello');
      kvResult = await kv.get('test-key');
      await kv.del('test-key');
    } catch (kvErr) {
      kvResult = 'KV ERROR: ' + kvErr.message;
    }

    res.json({ vars, kvResult });
  } catch (e) {
    res.json({ error: e.message, stack: e.stack });
  }
}
