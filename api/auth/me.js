function cors(res) {
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Methods","GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers","Content-Type,Authorization");
}
export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method === "GET") {
    try {
      const user = JSON.parse(Buffer.from(req.headers["authorization"].replace("Bearer ",""),"base64").toString("utf8"));
      return res.status(200).json(user);
    } catch { return res.status(401).json({ error: "Invalid token" }); }
  }
  if (req.method === "POST") {
    const { name } = req.body;
    const user = { id:"u-"+Date.now().toString(36), name: name||"Guest", email:"", role:"customer" };
    const token = Buffer.from(JSON.stringify(user)).toString("base64");
    return res.status(200).json({ user, token });
  }
  return res.status(405).json({ error: "Method not allowed" });
}