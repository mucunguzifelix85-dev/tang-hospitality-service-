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
  const { orderId } = req.query;
  if (!data.chats[orderId]) data.chats[orderId] = { orderId, messages: [] };
  if (req.method === "GET") return res.status(200).json(data.chats[orderId]);
  if (req.method === "POST") {
    const correct = process.env.ADMIN_PASSWORD || "Tang123";
    const isAdmin = req.headers["x-admin-token"] === correct;
    const user = getUser(req);
    if (!isAdmin && !user) return res.status(401).json({ error: "Unauthorized" });
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text" });
    const msg = { id:"msg-"+Date.now(), senderId: isAdmin?"admin":user.id, senderName: isAdmin?"Tang Hospitality Service":user.name, senderRole: isAdmin?"admin":"customer", text, timestamp: new Date().toISOString() };
    data.chats[orderId].messages.push(msg);
    return res.status(201).json(msg);
  }
  return res.status(405).json({ error: "Method not allowed" });
}