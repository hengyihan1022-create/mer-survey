const BASE_ID = 'appF76QMj228DRECC';
const TABLE_ID = 'tblGg83zUt0k9Iwmg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KEY = process.env.AIRTABLE_KEY;
  if (!KEY) return res.status(500).json({ error: 'Airtable key not configured' });

  if (req.method === 'POST') {
    try {
      const resp = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [{ fields: { Valence: Number(req.body.valence), Timestamp: new Date().toISOString().split('T')[0], 'User Agent': (req.headers['user-agent'] || '').slice(0, 200) } }] })
      });
      const data = await resp.json();
      if (!resp.ok) return res.status(500).json({ success: false, error: data.error?.message });
      return res.status(200).json({ success: true, id: data.records?.[0]?.id });
    } catch (err) { return res.status(500).json({ success: false, error: err.message }); }
  }
  if (req.method === 'GET') {
    const resp = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?maxRecords=10&sort[0][field]=Timestamp&sort[0][direction]=desc`, { headers: { 'Authorization': `Bearer ${KEY}` } });
    const data = await resp.json();
    return res.status(200).json({ records: data.records?.map(r => r.fields) || [] });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
