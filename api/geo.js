export default function handler(req, res) {
  const country = req.headers['x-vercel-ip-country'] || 'Unknown';
  const city = req.headers['x-vercel-ip-city'] || '';
  const region = req.headers['x-vercel-ip-country-region'] || '';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');

  // Map ISO codes to full names
  const names = {
    US: 'United States', CN: 'China', JP: 'Japan', KR: 'South Korea',
    IN: 'India', SG: 'Singapore', MY: 'Malaysia', ID: 'Indonesia',
    TH: 'Thailand', VN: 'Vietnam', PH: 'Philippines', MM: 'Myanmar',
    BD: 'Bangladesh', PK: 'Pakistan', AE: 'United Arab Emirates',
    SA: 'Saudi Arabia', QA: 'Qatar', KW: 'Kuwait', OM: 'Oman',
    BH: 'Bahrain', IR: 'Iran', IL: 'Israel', BR: 'Brazil',
    MX: 'Mexico', AR: 'Argentina', CL: 'Chile', CO: 'Colombia',
    PE: 'Peru', VE: 'Venezuela', AU: 'Australia', NZ: 'New Zealand',
    ZA: 'South Africa', NG: 'Nigeria', EG: 'Egypt', KE: 'Kenya',
    MA: 'Morocco', ET: 'Ethiopia', DE: 'Germany', GB: 'United Kingdom',
    FR: 'France', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
    BE: 'Belgium', CH: 'Switzerland', AT: 'Austria', SE: 'Sweden',
    NO: 'Norway', DK: 'Denmark', FI: 'Finland', IS: 'Iceland',
    IE: 'Ireland', PT: 'Portugal', GR: 'Greece', PL: 'Poland',
    CZ: 'Czech Republic', RO: 'Romania', HU: 'Hungary', RU: 'Russia',
    UA: 'Ukraine', BY: 'Belarus', TR: 'Turkey', CA: 'Canada',
    TW: 'Taiwan', HK: 'Hong Kong', MO: 'Macau', LK: 'Sri Lanka',
    NP: 'Nepal', KH: 'Cambodia', LA: 'Laos', MN: 'Mongolia',
    KZ: 'Kazakhstan', UZ: 'Uzbekistan', KG: 'Kyrgyzstan', TJ: 'Tajikistan',
    TM: 'Turkmenistan', AZ: 'Azerbaijan', GE: 'Georgia', AM: 'Armenia',
    MD: 'Moldova', RS: 'Serbia', HR: 'Croatia', SI: 'Slovenia',
    SK: 'Slovakia', LT: 'Lithuania', LV: 'Latvia', EE: 'Estonia',
    LU: 'Luxembourg', MT: 'Malta', CY: 'Cyprus', BG: 'Bulgaria',
    AL: 'Albania', MK: 'North Macedonia', BA: 'Bosnia', ME: 'Montenegro',
    CU: 'Cuba', DO: 'Dominican Republic', GT: 'Guatemala', HN: 'Honduras',
    SV: 'El Salvador', NI: 'Nicaragua', CR: 'Costa Rica', PA: 'Panama',
    JM: 'Jamaica', BS: 'Bahamas', TT: 'Trinidad and Tobago', EC: 'Ecuador',
    BO: 'Bolivia', PY: 'Paraguay', UY: 'Uruguay', GY: 'Guyana', SR: 'Suriname',
    JO: 'Jordan', LB: 'Lebanon', IQ: 'Iraq', YE: 'Yemen', SY: 'Syria', PS: 'Palestine',
    TZ: 'Tanzania', GH: 'Ghana', UG: 'Uganda', DZ: 'Algeria', TN: 'Tunisia',
    LY: 'Libya', SD: 'Sudan', AO: 'Angola', MZ: 'Mozambique', ZW: 'Zimbabwe',
    ZM: 'Zambia', BW: 'Botswana', NA: 'Namibia', MU: 'Mauritius', SN: 'Senegal',
    CI: 'Ivory Coast', CM: 'Cameroon', RW: 'Rwanda', FJ: 'Fiji',
    PG: 'Papua New Guinea', SB: 'Solomon Islands', VU: 'Vanuatu', WS: 'Samoa'
  };

  res.json({
    country_name: names[country] || country || 'Unknown',
    country_code: country || 'XX',
    city: city || '',
    region: region || ''
  });
}
