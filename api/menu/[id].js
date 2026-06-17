import { getProducts, setProducts } from "../_data.js";
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
  try {
    const { id } = req.query;
    const products = await getProducts();
    const idx = products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: "Product not found" });
    if (req.method === "GET") return res.status(200).json(products[idx]);
    if (req.method === "PUT") {
      const { name, category, subcategory, description, priceRWF, priceUSD, image, quantity } = req.body || {};
      const cur = products[idx];
      const qty = (quantity !== undefined && quantity !== "") ? Math.max(0, Number(quantity)) : cur.quantity ?? 0;
      products[idx] = { ...cur,
        ...(name !== undefined && { name: name.trim() }),
        ...(category !== undefined && { category }),
        ...(subcategory !== undefined && { subcategory }),
        ...(description !== undefined && { description: description.trim() }),
        ...(priceRWF !== undefined && { priceRWF: Number(priceRWF) }),
        ...(priceUSD !== undefined && { priceUSD: Number(priceUSD) }),
        ...(image !== undefined && { image }),
        quantity: qty, availability: qty > 0
      };
      await setProducts(products);
      return res.status(200).json(products[idx]);
    }
    if (req.method === "DELETE") {
      products.splice(idx, 1);
      await setProducts(products);
      return res.status(200).json({ success: true, message: "Product deleted" });
    }
  } catch(e) {
    return res.status(500).json({ error: "Server error: " + e.message });
  }
  return res.status(405).json({ error: "Method not allowed" });
}