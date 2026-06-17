import { getOrders, getChat, setChat } from "../_data.js";
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
  try {
    const { orderId } = req.query;
    const orders = await getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const correct = process.env.ADMIN_PASSWORD || "Tang123";
    const isAdmin = req.headers["x-admin-token"] === correct;
    const user = isAdmin ? null : getUser(req);
    if (!isAdmin) {
      if (!user) return res.status(401).json({ error: "Unauthorized" });
      if (order.customerId !== user.id) return res.status(403).json({ error: "Forbidden" });
    }
    const chat = await getChat(orderId);
    if (req.method === "GET") return res.status(200).json(chat);
    if (req.method === "POST") {
      const { text } = req.body || {};
      if (!text || !text.trim()) return res.status(400).json({ error: "Message text required" });
      const msg = {
        id: "msg-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7),
        senderId: isAdmin ? "admin" : user.id,
        senderName: isAdmin ? "Tang Hospitality Service" : user.name,
        senderRole: isAdmin ? "admin" : "customer",
        text: text.trim(),
        timestamp: new Date().toISOString()
      };
      chat.messages.push(msg);
      await setChat(orderId, chat);
      return res.status(201).json(msg);
    }
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
  return res.status(405).json({ error: "Method not allowed" });
}