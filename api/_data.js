import { Redis } from "@upstash/redis";

const SEED = [
  { id:"p1", name:"Fanta Orange", category:"Drinks", subcategory:"Soft Drinks", description:"Chilled Fanta Orange, 500ml.", priceRWF:1500, priceUSD:1.20, image:"https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=600&q=80", availability:true, quantity:80 },
  { id:"p2", name:"Fresh Mango Juice", category:"Drinks", subcategory:"Juices", description:"Freshly squeezed mango juice, served cold.", priceRWF:2500, priceUSD:2.00, image:"https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80", availability:true, quantity:50 },
  { id:"p3", name:"Mineral Water 1L", category:"Drinks", subcategory:"Water", description:"Pure mineral water, 1 litre.", priceRWF:1000, priceUSD:0.80, image:"https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=600&q=80", availability:true, quantity:120 },
  { id:"p4", name:"Grilled Chicken & Rice", category:"Food", subcategory:"Meals", description:"Tender grilled chicken with seasoned rice.", priceRWF:8000, priceUSD:6.50, image:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&q=80", availability:true, quantity:35 },
  { id:"p5", name:"Beef Burger", category:"Food", subcategory:"Fast Food", description:"Juicy beef burger with fries.", priceRWF:6000, priceUSD:4.80, image:"https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80", availability:true, quantity:40 },
  { id:"p6", name:"Chocolate Cake Slice", category:"Food", subcategory:"Desserts", description:"Rich chocolate cake, freshly baked.", priceRWF:3500, priceUSD:2.80, image:"https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80", availability:true, quantity:25 },
  { id:"p7", name:"Standard Room (1 Night)", category:"Hospitality", subcategory:"Hotel Services", description:"Comfortable room with breakfast.", priceRWF:60000, priceUSD:48.00, image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80", availability:true, quantity:10 },
  { id:"p8", name:"Event Hall Booking", category:"Hospitality", subcategory:"Event Services", description:"Spacious hall for events.", priceRWF:200000, priceUSD:160.00, image:"https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80", availability:true, quantity:5 },
  { id:"p9", name:"Catering Package", category:"Hospitality", subcategory:"Catering Services", description:"Full catering for up to 50 people.", priceRWF:150000, priceUSD:120.00, image:"https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80", availability:true, quantity:8 }
];

const MEM = { products:null, orders:[], chats:{} };

function makeRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token || url.includes("YOUR-REAL") || token.includes("YOUR-REAL")) return null;
  try { return new Redis({ url, token }); } catch { return null; }
}

async function rGet(key) {
  const r = makeRedis();
  if (!r) return null;
  try {
    const v = await r.get(key);
    if (v === null || v === undefined) return null;
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch(e) { console.error("Redis GET", key, e.message); return null; }
}

async function rSet(key, val) {
  const r = makeRedis();
  if (!r) return false;
  try { await r.set(key, JSON.stringify(val)); return true; }
  catch(e) { console.error("Redis SET", key, e.message); return false; }
}

export async function getProducts() {
  const data = await rGet("tang:products");
  if (data) return data;
  if (MEM.products) return MEM.products;
  MEM.products = JSON.parse(JSON.stringify(SEED));
  await rSet("tang:products", MEM.products);
  return MEM.products;
}

export async function setProducts(products) {
  MEM.products = products;
  return rSet("tang:products", products);
}

export async function getOrders() {
  const data = await rGet("tang:orders");
  if (data) return data;
  return MEM.orders;
}

export async function setOrders(orders) {
  MEM.orders = orders;
  // Also store each order individually so chat can find it cross-instance
  for (const o of orders) {
    await rSet("tang:order:" + o.id, o);
    MEM.chats[o.id] = MEM.chats[o.id] || null;
  }
  return rSet("tang:orders", orders);
}

export async function getChat(orderId) {
  const data = await rGet("tang:chat:" + orderId);
  if (data) return data;
  // Return empty chat — never 404 just because order is in another instance
  return MEM.chats[orderId] || { orderId, messages: [] };
}

export async function setChat(orderId, chat) {
  MEM.chats[orderId] = chat;
  return rSet("tang:chat:" + orderId, chat);
}