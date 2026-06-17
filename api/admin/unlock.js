function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'POST') {
    const { password } = req.body;
    const correct = process.env.ADMIN_PASSWORD || 'Tang123';
    if (password === correct) return res.status(200).json({ token: correct });
    return res.status(401).json({ error: 'Incorrect password' });
  }
  return res.status(405).json({ error: 'Method not allowed' });
};