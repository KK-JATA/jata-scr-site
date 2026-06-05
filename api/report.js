import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Allow specifying date, default to yesterday
  let date = req.query.date;
  if (!date) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    date = d.toISOString().slice(0, 10);
  }
  const key = `analytics:${date}`;

  try {
    const raw = await kv.get(key);
    const events = Array.isArray(raw) ? raw : [];

    // Build summary
    const sessions = new Set();
    const countries = {};
    let pageExits = 0, heroTabs = 0, sectionViews = 0;

    for (const e of events) {
      sessions.add(e.session);
      if (e.country && e.country !== 'Unknown') {
        countries[e.country] = (countries[e.country] || 0) + 1;
      }
      switch (e.type) {
        case 'page_exit': pageExits++; break;
        case 'hero_tab_view': heroTabs++; break;
        case 'section_view': sectionViews++; break;
      }
    }

    const topCountries = Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([k, v]) => ({ country: k, visits: v }));

    res.json({
      date,
      totalEvents: events.length,
      summary: {
        pageViews: pageExits,
        uniqueSessions: sessions.size,
        countryCount: Object.keys(countries).length,
        heroTabViews: heroTabs,
        sectionViews,
      },
      topCountries,
      events,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
