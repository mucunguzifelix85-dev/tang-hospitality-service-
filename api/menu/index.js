import { getProducts, setProducts } from "../_data.js";
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization,X-Admin-Token");
}
export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    try {
      const products = await getProducts();
      return res.status(200).json(products);
    } catch (e) {
      return res.status(500).json({ error: "Could not load products: " + e.message });
    }
  }
  if (req.method === "POST") {
    const correct = process.env.ADMIN_PASSWORD || "Tang123";
    if (req.headers["x-admin-token"] !== correct) return res.status(401).json({ error: "Unauthorized" });
    try {
      const { name, category, subcategory, description, priceRWF, priceUSD, image, quantity } = req.body || {};
      if (!name || !name.trim()) return res.status(400).json({ error: "Product name is required." });
      if (!priceRWF || isNaN(Number(priceRWF))) return res.status(400).json({ error: "Valid RWF price is required." });
      if (!priceUSD || isNaN(Number(priceUSD))) return res.status(400).json({ error: "Valid USD price is required." });
      const imgStr = image || "";
      if (imgStr.length > 900000) return res.status(400).json({ error: "Image is too large. Please use a smaller image (under 700KB)." });
      const qty = quantity !== undefined && quantity !== "" ? Math.max(0, Number(quantity)) : 0;
      const product = {
        id: "p" + Date.now(),
        name: name.trim(),
        category: category || "Drinks",
        subcategory: subcategory || "",
        description: (description || "").trim(),
        priceRWF: Number(priceRWF),
        priceUSD: Number(priceUSD),
        image: imgStr,
        quantity: qty,
        availability: qty > 0
      };
      const products = await getProducts();
      products.push(product);
      const saved = await setProducts(products);
      if (!saved) return res.status(500).json({ error: "Product created but could not be saved to database. Check Redis credentials." });
      return res.status(201).json(product);
    } catch (e) {
      return res.status(500).json({ error: "Server error: " + e.message });
    }
  }
  return res.status(405).json({ error: "Method not allowed" });
}