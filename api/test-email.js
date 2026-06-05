import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Write test data to yesterday's key
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().slice(0, 10);
  const key = `analytics:${yesterday}`;

  const testEvents = [
    { session: 'test-a1b2', country: 'United States', type: 'page_exit', value: '45s' },
    { session: 'test-a1b2', country: 'United States', type: 'section_view', value: '{"section":"hero","duration_ms":12000,"total_page_ms":45000}' },
    { session: 'test-a1b2', country: 'United States', type: 'hero_tab_view', value: '{"tab":"About Us","tab_index":0,"duration_ms":8000}' },
    { session: 'test-c3d4', country: 'Germany', type: 'page_exit', value: '22s' },
    { session: 'test-c3d4', country: 'Germany', type: 'section_view', value: '{"section":"services","duration_ms":10000,"total_page_ms":22000}' },
  ];

  for (const ev of testEvents) {
    await kv.rpush(key, JSON.stringify(ev));
  }
  await kv.expire(key, 60 * 60 * 24 * 7);

  res.json({ ok: true, key, events: testEvents.length });
}
