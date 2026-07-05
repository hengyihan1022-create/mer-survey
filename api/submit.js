const BASE_ID = 'appF76QMj228DRECC';
const TABLE_ID = 'tblGg83zUt0k9Iwmg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const AIRTABLE_KEY = process.env.AIRTABLE_KEY;
  if (!AIRTABLE_KEY) return res.status(500).json({ error: 'Airtable key not configured' });

  const AURL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

  if (req.method === 'POST') {
    try {
      const now = new Date();
      // 用 YYYY-MM-DD 格式，兼容各种日期格式设置
      const dateStr = now.toISOString().split('T')[0];
      const ua = (req.headers['user-agent'] || '').slice(0, 200);

      const record = { fields: {
        valence: Number(req.body.valence),
        timestamp: dateStr,
        user_agent: ua
      }};

      const resp = await fetch(AURL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [record] })
      });
      const data = await resp.json();
      if (!resp.ok) {
        return res.status(500).json({ success: false, error: data.error?.message, detail: data.error?.type });
      }
      return res.status(200).json({ success: true, id: data.records?.[0]?.id });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const resp = await fetch(`${AURL}?maxRecords=20&sort[0][field]=timestamp&sort[0][direction]=desc`, {
        headers: { 'Authorization': `Bearer ${AIRTABLE_KEY}` }
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(500).json({ error: data.error?.message });
      return res.status(200).json({ records: data.records?.map(r => r.fields) || [] });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
