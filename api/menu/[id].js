const data = require('../_data.js');
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Token');
}
module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  const correct = process.env.ADMIN_PASSWORD || 'Tang123';
  if (req.headers['x-admin-token'] !== correct) return res.status(401).json({ error: 'Unauthorized' });
  const { id } = req.query;
  const idx = data.products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  if (req.method === 'PUT') { data.products[idx] = { ...data.products[idx], ...req.body }; return res.status(200).json(data.products[idx]); }
  if (req.method === 'DELETE') { data.products.splice(idx, 1); return res.status(200).json({ success: true, message: 'Deleted' }); }
  return res.status(405).json({ error: 'Method not allowed' });
};