import data from "../_data.js";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Admin-Token");
}

function getUser(req) {
  const auth = req.headers["authorization"];
  if (!auth || typeof auth !== "string") return null;
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (!token) return null;
  try {
    return JSON.parse(Buffer.from(token, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const { orderId } = req.query;
  if (!orderId) return res.status(400).json({ error: "Missing orderId" });

  if (!data.chats[orderId]) {
    data.chats[orderId] = { orderId, messages: [] };
  }

  if (req.method === "GET") {
    return res.status(200).json(data.chats[orderId]);
  }

  if (req.method === "POST") {
    const correct = process.env.ADMIN_PASSWORD || "Tang123";
    const isAdmin = req.headers["x-admin-token"] === correct;
    const user = getUser(req);

    if (!isAdmin && !user) {
      return res.status(401).json({ error: "Unauthorized: no valid admin token or user session found" });
    }

    const { text } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Message text is required" });
    }

    const msg = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      senderId: isAdmin ? "admin" : user.id,
      senderName: isAdmin ? "Tang Hospitality Service" : (user.name || "Guest"),
      senderRole: isAdmin ? "admin" : "customer",
      text: text.trim(),
      timestamp: new Date().toISOString()
    };

    data.chats[orderId].messages.push(msg);
    return res.status(201).json(msg);
  }

  return res.status(405).json({ error: "Method not allowed" });
}