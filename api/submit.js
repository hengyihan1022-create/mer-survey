const BASE_ID = 'appF76QMj228DRECC';
const TABLE_ID = 'tblGg83zUt0k9Iwmg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const AIRTABLE_KEY = process.env.AIRTABLE_KEY;
  if (!AIRTABLE_KEY) {
    return res.status(500).json({ error: 'Airtable key not configured' });
  }
  const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`;

  if (req.method === 'POST') {
    try {
      const record = {
        fields: {
          valence: req.body.valence,
          timestamp: req.body.timestamp || new Date().toISOString(),
          user_agent: req.headers['user-agent'] || ''
        }
      };
      const atResp = await fetch(AIRTABLE_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [record] })
      });
      if (!atResp.ok) {
        const e = await atResp.json();
        return res.status(500).json({ success: false, error: e.error?.message });
      }
      const atData = await atResp.json();
      return res.status(200).json({
        success: true,
        id: atData.records?.[0]?.id,
        url: `https://airtable.com/${BASE_ID}/${TABLE_ID}/${atData.records?.[0]?.id}`
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'GET') {
    const atResp = await fetch(`${AIRTABLE_URL}?maxRecords=5&sort[0][field]=timestamp&sort[0][direction]=desc`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_KEY}` }
    });
    const atData = await atResp.json();
    return res.status(200).json({ records: atData.records?.map(r => r.fields) || [] });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
