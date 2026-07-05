const KEY = process.env.AIRTABLE_KEY;
const BID = 'appF76QMj228DRECC';
const TID = 'tblGg83zUt0k9Iwmg';
const URL = `https://api.airtable.com/v0/${BID}/${TID}`;

const HEADERS = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Step 1: Try to read 1 record to see existing field names
  const results = {};
  try {
    const r = await fetch(`${URL}?maxRecords=1`, { headers: HEADERS });
    const d = await r.json();
    results.read = { status: r.status, ok: r.ok };
    if (r.ok && d.records?.length > 0) {
      results.existing_fields = Object.keys(d.records[0].fields);
      results.sample_record = d.records[0].fields;
    } else if (r.ok) {
      results.existing_fields = '(table is empty, no records to read)';
    } else {
      results.error = d;
    }
  } catch (e) { results.read_error = e.message; }

  // Step 2: Try writing with different field name variations
  const candidates = [
    { Valence: 50, Timestamp: '2026-07-05', 'User Agent': 'test' },
    { valence: 50, timestamp: '2026-07-05', user_agent: 'test' },
    { valence: 50, Timestamp: '2026-07-05', UserAgent: 'test' },
    { 'Valence ': 50, 'Timestamp ': '2026-07-05', 'User Agent ': 'test' },
    { VALENCE: 50, TIMESTAMP: '2026-07-05', 'USER AGENT': 'test' },
  ];
  results.write_tests = [];
  for (const fields of candidates) {
    try {
      const r = await fetch(URL, {
        method: 'POST', headers: HEADERS,
        body: JSON.stringify({ records: [{ fields }] })
      });
      const d = await r.json();
      const fieldNames = Object.keys(fields);
      if (r.ok) {
        results.write_tests.push({ fields: fieldNames, status: r.status, ok: true });
        // Clean up test record
        await fetch(`${URL}/${d.records?.[0]?.id}`, { method: 'DELETE', headers: HEADERS });
        break; // First successful write = we found the right names
      } else {
        const err = d.error?.message || JSON.stringify(d);
        results.write_tests.push({ fields: fieldNames, status: r.status, error: err });
      }
    } catch (e) {
      results.write_tests.push({ fields: Object.keys(fields), error: e.message });
    }
  }

  // Step 3: Also list the table structure via a different endpoint
  try {
    const r = await fetch(`https://api.airtable.com/v0/meta/bases/${BID}/tables`, {
      headers: HEADERS
    });
    const d = await r.json();
    if (r.ok) {
      for (const t of d.tables || []) {
        if (t.id === TID || t.name === 'User Event Logs') {
          results.table_schema = {
            name: t.name,
            fields: t.fields.map(f => ({ name: f.name, type: f.type }))
          };
        }
      }
    } else {
      results.table_schema_error = d;
    }
  } catch (e) { results.meta_error = e.message; }

  return res.status(200).json(results);
}
