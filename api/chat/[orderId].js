import data from "../_data.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Token");
}

function getUser(req) {
  try {
    return JSON.parse(Buffer.from(req.headers["authorization"].replace("Bearer ", ""), "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function isAdminRequest(req) {
  const correct = process.env.ADMIN_PASSWORD || "Tang123";
  return req.headers["x-admin-token"] === correct;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { orderId } = req.query;
  const order = data.orders.find(o => o.id === orderId);
  if (!order) return res.status(404).json({ error: "Order not found" });

  const admin = isAdminRequest(req);
  const user = admin ? null : getUser(req);

  // Authorization: admin can access any chat. Customer can only access their own order's chat.
  if (!admin) {
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    if (order.customerId !== user.id) return res.status(403).json({ error: "Forbidden" });
  }

  // Ensure chat thread exists even for orders created before this fix, or if it was never initialized.
  if (!data.chats[orderId]) {
    data.chats[orderId] = { orderId, messages: [] };
  }

  if (req.method === "GET") {
    return res.status(200).json(data.chats[orderId]);
  }

  if (req.method === "POST") {
    const { text } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: "Message text is required" });

    const senderId = admin ? "admin" : user.id;
    const senderName = admin ? "Tang Hospitality Service" : user.name;
    const senderRole = admin ? "admin" : "customer";

    const message = {
      id: "msg-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
      senderId,
      senderName,
      senderRole,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    data.chats[orderId].messages.push(message);
    return res.status(201).json(message);
  }

  return res.status(405).json({ error: "Method not allowed" });
}