import { getOrders, setOrders, getChat, setChat } from "../../_data.js";
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization,X-Admin-Token");
}
export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "PUT") {
    const correct = process.env.ADMIN_PASSWORD || "Tang123";
    if (req.headers["x-admin-token"] !== correct) return res.status(401).json({ error: "Unauthorized" });
    const { id } = req.query;
    const { status } = req.body || {};
    if (!["Pending","Confirmed","Delivered"].includes(status)) return res.status(400).json({ error: "Invalid status" });
    const orders = await getOrders();
    const order = orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    order.status = status;
    await setOrders(orders);
    const chat = await getChat(id);
    chat.messages.push({ id:"msg-"+Date.now(), senderId:"system", senderName:"Tang Hospitality Service", senderRole:"admin", text:"Order status updated to: "+status, timestamp:new Date().toISOString() });
    await setChat(id, chat);
    return res.status(200).json(order);
  }
  return res.status(405).json({ error: "Method not allowed" });
}