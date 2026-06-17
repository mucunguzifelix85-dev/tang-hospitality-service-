import data from "../_data.js";
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization,X-Admin-Token");
}
export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") return res.status(200).json(data.products);
  if (req.method === "POST") {
    const correct = process.env.ADMIN_PASSWORD || "Tang123";
    if (req.headers["x-admin-token"] !== correct) return res.status(401).json({ error: "Unauthorized" });
    const { name, category, subcategory, description, priceRWF, priceUSD, image, availability } = req.body;
    if (!name || !priceRWF || !priceUSD) return res.status(400).json({ error: "Missing fields" });
    const product = { id: "p"+Date.now(), name, category, subcategory, description, priceRWF: Number(priceRWF), priceUSD: Number(priceUSD), image: image||"", availability: availability !== false };
    data.products.push(product);
    return res.status(201).json(product);
  }
  return res.status(405).json({ error: "Method not allowed" });
}