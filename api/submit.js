const BASE_ID = 'appF76QMj228DRECC';
const TABLE_ID = 'tblGg83zUt0k9Iwmg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KEY = process.env.AIRTABLE_KEY;
  if (!KEY) return res.status(500).json({ error: 'Airtable key not configured' });

  // 字段名必须与 Airtable 表头完全一致（大小写+空格）
  const F = (v, ua) => ({
    fields: {
      Valence: Number(v),
      Timestamp: new Date().toISOString().split('T')[0],
      'User Agent': ua.slice(0, 200)
    }
  });

  if (req.method === 'POST') {
    try {
      const resp = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records: [F(req.body.valence, req.headers['user-agent'] || '')]
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        const msg = data.error?.message || JSON.stringify(data.error);
        return res.status(500).json({ success: false, error: msg });
      }
      return res.status(200).json({ success: true, id: data.records?.[0]?.id });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const resp = await fetch(
        `https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?maxRecords=20&sort[0][field]=Timestamp&sort[0][direction]=desc`,
        { headers: { 'Authorization': `Bearer ${KEY}` } }
      );
      const data = await resp.json();
      if (!resp.ok) return res.status(500).json({ error: data.error?.message });
      const records = data.records?.map(r => ({
        Valence: r.fields.Valence,
        Timestamp: r.fields.Timestamp,
        'User Agent': r.fields['User Agent']
      })) || [];
      return res.status(200).json({ records });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
