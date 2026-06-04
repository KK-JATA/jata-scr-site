import { kv } from '@vercel/kv';

const SMTP = {
  host: 'smtp.163.com',
  port: 465,
  user: 'grs1999@163.com',
  pass: 'KYTUGafijHBduEE9',
  to: 'grs1999@163.com',
};

async function sendEmail(subject, body) {
  const { host, port, user, pass, to } = SMTP;
  const encoded = Buffer.from(subject, 'utf-8').toString('base64');
  const msg = `From: ${user}\r\nTo: ${to}\r\nSubject: =?UTF-8?B?${encoded}?=\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`;

  // Use Node.js net + tls to send directly (no dependency needed)
  const tls = await import('tls');
  return new Promise((resolve, reject) => {
    const socket = tls.connect({ host, port, rejectUnauthorized: false }, () => {
      let buf = '';
      socket.on('data', (d) => { buf += d.toString(); });

      const cmd = (s) => new Promise((r) => socket.write(s + '\r\n', () => setTimeout(r, 100)));

      const go = async () => {
        try {
          await cmd(`EHLO ${host}`);
          await cmd('AUTH LOGIN');
          await cmd(Buffer.from(user).toString('base64'));
          await cmd(Buffer.from(pass).toString('base64'));
          await cmd(`MAIL FROM:<${user}>`);
          await cmd(`RCPT TO:<${to}>`);
          await cmd('DATA');
          await cmd(msg + '\r\n.');
          await cmd('QUIT');
          socket.end();
          resolve(true);
        } catch (e) {
          reject(e);
        }
      };
      go();
    });
    socket.on('error', reject);
    socket.setTimeout(15000, () => { socket.destroy(); reject(new Error('timeout')); });
  });
}

export default async function handler(req, res) {
  // Only allow cron (with secret) or authorized requests
  if (req.query.secret !== 'jata-daily-report-2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Read yesterday's data (the cron fires at 8:00 AM, so report on yesterday)
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const yesterday = d.toISOString().slice(0, 10);
    const key = `analytics:${yesterday}`;

    const raw = await kv.lrange(key, 0, -1);

    if (!raw || raw.length === 0) {
      return res.json({ ok: true, message: 'No analytics data for yesterday' });
    }

    // Parse all events
    const events = raw.map((s) => {
      try { return JSON.parse(s); } catch (e) { return null; }
    }).filter(Boolean);

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
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n') || '  (none)';

    const body = [
      `JATA SCR Independent Site — Daily Analytics Report`,
      `Date: ${yesterday}`,
      ``,
      `=== Summary ===`,
      `Total Page Views:   ${pageExits}`,
      `Unique Sessions:    ${sessions.size}`,
      `Countries:          ${Object.keys(countries).length}`,
      `Hero Tab Views:     ${heroTabs}`,
      `Section Views:      ${sectionViews}`,
      ``,
      `=== Top Countries ===`,
      topCountries,
      ``,
      `=== Raw Data (JSON) ===`,
      `Total events: ${events.length}`,
      ``,
      JSON.stringify(events, null, 2),
    ].join('\n');

    await sendEmail(`JATA Analytics Daily Report - ${yesterday}`, body);

    // Clear the key after sending
    await kv.del(key);

    res.json({ ok: true, sent: events.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
