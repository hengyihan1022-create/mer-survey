let submissions = [];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method === 'POST') {
    const data = req.body || {};
    const entry = {
      id: submissions.length + 1,
      valence: data.valence,
      timestamp: data.timestamp || new Date().toISOString(),
      received_at: new Date().toISOString(),
      user_agent: req.headers['user-agent'] || ''
    };
    submissions.push(entry);
    return res.status(200).json({ success: true, id: entry.id, received_at: entry.received_at });
  }
  if (req.method === 'GET') {
    return res.status(200).json({ total: submissions.length, submissions });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
