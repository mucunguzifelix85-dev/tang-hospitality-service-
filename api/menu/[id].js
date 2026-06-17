import data from "../_data.js";
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization,X-Admin-Token");
}
export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  const correct = process.env.ADMIN_PASSWORD || "Tang123";
  if (req.headers["x-admin-token"] !== correct) return res.status(401).json({ error: "Unauthorized" });
  const { id } = req.query;
  const idx = data.products.findIndex(p => p.id === id);
  if (idx === -1) return res.status(404).json({ error: "Product not found" });
  if (req.method === "GET") return res.status(200).json(data.products[idx]);
  if (req.method === "PUT") {
    const { name, category, subcategory, description, priceRWF, priceUSD, image, quantity, availability } = req.body || {};
    const current = data.products[idx];
    const qty = quantity !== undefined && quantity !== null && quantity !== "" ? Number(quantity) : current.quantity ?? 0;
    data.products[idx] = {
      ...current,
      ...(name !== undefined ? { name } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(subcategory !== undefined ? { subcategory } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(priceRWF !== undefined ? { priceRWF: Number(priceRWF) } : {}),
      ...(priceUSD !== undefined ? { priceUSD: Number(priceUSD) } : {}),
      ...(image !== undefined ? { image } : {}),
      quantity: qty,
      availability: qty > 0
    };
    return res.status(200).json(data.products[idx]);
  }
  if (req.method === "DELETE") {
    data.products.splice(idx, 1);
    return res.status(200).json({ success: true, message: "Product deleted" });
  }
  return res.status(405).json({ error: "Method not allowed" });
}