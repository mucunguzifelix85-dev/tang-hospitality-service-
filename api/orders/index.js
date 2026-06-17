import data from "../_data.js";
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
    if (req.headers["x-admin-token"] === correct) return res.status(200).json(data.orders);
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    return res.status(200).json(data.orders.filter(o => o.customerId === user.id));
  }
  if (req.method === "POST") {
    const user = getUser(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const { items, notes } = req.body;
    if (!items||!items.length) return res.status(400).json({ error: "No items" });
    let totalRWF=0, totalUSD=0;
    const orderItems = items.map(item => {
      const p = data.products.find(x => x.id === item.productId);
      if (!p) throw new Error("Product not found");
      const qty = Number(item.quantity)||1;
      totalRWF += p.priceRWF*qty; totalUSD += p.priceUSD*qty;
      return { productId: p.id, name: p.name, priceRWF: p.priceRWF, priceUSD: p.priceUSD, image: p.image, quantity: qty };
    });
    const id = "ORD-"+Date.now().toString(36).toUpperCase();
    const order = { id, customerId: user.id, customerName: user.name, items: orderItems, status: "Pending", totalRWF, totalUSD, createdAt: new Date().toISOString(), notes: notes||"" };
    data.orders.push(order);
    data.chats[id] = { orderId: id, messages: [{ id:"msg-"+Date.now(), senderId:"system", senderName:"Tang Hospitality Service", senderRole:"admin", text:"Thank you "+user.name+"! Order "+id+" received. Total: "+Math.round(totalRWF).toLocaleString()+" RWF ($"+totalUSD.toFixed(2)+"). We will confirm shortly.", timestamp: new Date().toISOString() }] };
    return res.status(201).json(order);
  }
  return res.status(405).json({ error: "Method not allowed" });
}