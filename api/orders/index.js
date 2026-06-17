import { getProducts, getOrders, setOrders, setChat } from "../_data.js";
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization,X-Admin-Token");
}
function getUser(req) {
  try { return JSON.parse(Buffer.from(req.headers["authorization"].replace("Bearer ",""),"base64").toString("utf8")); } catch { return null; }
}
export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  const correct = process.env.ADMIN_PASSWORD || "Tang123";
  if (req.method === "GET") {
    try {
      const orders = await getOrders();
      if (req.headers["x-admin-token"] === correct) return res.status(200).json(orders);
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      return res.status(200).json(orders.filter(o => o.customerId === user.id));
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }
  if (req.method === "POST") {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { items, notes } = req.body || {};
      if (!items || !items.length) return res.status(400).json({ error: "No items" });
      const products = await getProducts();
      let totalRWF = 0, totalUSD = 0;
      const orderItems = [];
      for (const item of items) {
        const p = products.find(x => x.id === item.productId);
        if (!p) return res.status(400).json({ error: "Product not found: " + item.productId });
        const qty = Number(item.quantity) || 1;
        totalRWF += p.priceRWF * qty; totalUSD += p.priceUSD * qty;
        orderItems.push({ productId:p.id, name:p.name, priceRWF:p.priceRWF, priceUSD:p.priceUSD, image:p.image, quantity:qty });
      }
      const id = "ORD-" + Date.now().toString(36).toUpperCase();
      const order = { id, customerId:user.id, customerName:user.name, items:orderItems, status:"Pending", totalRWF, totalUSD, createdAt:new Date().toISOString(), notes:notes||"" };
      const orders = await getOrders();
      orders.push(order);
      await setOrders(orders);
      await setChat(id, { orderId:id, messages:[{
        id:"msg-"+Date.now(), senderId:"system", senderName:"Tang Hospitality Service", senderRole:"admin",
        text:"Hello "+user.name+"! Your enquiry for order "+id+" has been received. Total: "+Math.round(totalRWF).toLocaleString()+" RWF ($"+totalUSD.toFixed(2)+"). How can we help you?",
        timestamp:new Date().toISOString()
      }]});
      return res.status(201).json(order);
    } catch(e) { return res.status(500).json({ error: e.message }); }
  }
  return res.status(405).json({ error: "Method not allowed" });
}