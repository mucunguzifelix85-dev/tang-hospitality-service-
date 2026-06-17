const data = require('../_data.js');
const { v4: uuidv4 } = require('uuid');

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Admin-Token');
}

function getUserFromReq(req) {
  const auth = req.headers['authorization'];
  if (!auth) return null;
  try {
    const token = auth.replace('Bearer ', '');
    return JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
  } catch { return null; }
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const adminToken = req.headers['x-admin-token'];
    if (adminToken === process.env.ADMIN_PASSWORD) {
      return res.status(200).json(data.orders);
    }
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const userOrders = data.orders.filter(o => o.customerId === user.id);
    return res.status(200).json(userOrders);
  }

  if (req.method === 'POST') {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { items, notes } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'No items' });

    const orderItems = [];
    let totalRWF = 0, totalUSD = 0;

    for (const item of items) {
      const product = data.products.find(p => p.id === item.productId);
      if (!product) return res.status(400).json({ error: `Product ${item.productId} not found` });
      const qty = Number(item.quantity) || 1;
      orderItems.push({
        productId: product.id,
        name: product.name,
        priceRWF: product.priceRWF,
        priceUSD: product.priceUSD,
        image: product.image,
        quantity: qty
      });
      totalRWF += product.priceRWF * qty;
      totalUSD += product.priceUSD * qty;
    }

    const order = {
      id: 'ORD-' + uuidv4().slice(0, 8).toUpperCase(),
      customerId: user.id,
      customerName: user.name,
      items: orderItems,
      status: 'Pending',
      totalRWF,
      totalUSD,
      createdAt: new Date().toISOString(),
      notes: notes || ''
    };

    data.orders.push(order);

    const welcomeMsg = {
      id: uuidv4(),
      senderId: 'system',
      senderName: 'Tang Hospitality Service',
      senderRole: 'admin',
      text: `Thank you ${user.name}! Your order ${order.id} has been received. Total: ${Math.round(totalRWF).toLocaleString()} RWF ($${totalUSD.toFixed(2)}). We will confirm shortly.`,
      timestamp: new Date().toISOString()
    };
    data.chats[order.id] = { orderId: order.id, messages: [welcomeMsg] };

    return res.status(201).json(order);
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
