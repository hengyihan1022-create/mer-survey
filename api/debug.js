const AIRTABLE_KEY = process.env.AIRTABLE_KEY;
const BASE_ID = 'appF76QMj228DRECC';
const TABLE_ID = 'tblGg83zUt0k9Iwmg';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (!AIRTABLE_KEY) return res.status(500).json({ error: 'No key' });

  const results = {};

  // 1. Try listing records
  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}?maxRecords=1`, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_KEY}` }
    });
    const d = await r.json();
    results.list_records = { status: r.status, data: d };
  } catch (e) { results.list_records = { error: e.message }; }

  // 2. Try writing a test record
  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${AIRTABLE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ records: [{ fields: { valence: 50, timestamp: '2026-07-05', user_agent: 'test' } }] })
    });
    const d = await r.json();
    results.write_test = { status: r.status, data: d };

    // If write succeeded, check what field names came back
    if (r.ok && d.records) {
      results.fields_seen = Object.keys(d.records[0].fields);
    }

    // 3. If write succeeded, delete test record
    if (r.ok && d.records?.[0]?.id) {
      const del = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${TABLE_ID}/${d.records[0].id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${AIRTABLE_KEY}` }
      });
      results.cleanup = { status: del.status };
    }
  } catch (e) { results.write_test = { error: e.message }; }

  return res.status(200).json(results);
}
