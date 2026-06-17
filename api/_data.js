import { Redis } from "@upstash/redis";

let redis;
try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} catch (e) {
  console.error("Redis init failed:", e.message);
}

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

async function safeGet(key) {
  try {
    const raw = await redis.get(key);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (e) {
    console.error("Redis GET error:", key, e.message);
    return null;
  }
}

async function safeSet(key, value) {
  try {
    await redis.set(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error("Redis SET error:", key, e.message);
    return false;
  }
}

export async function getProducts() {
  if (!redis) return SEED;
  const data = await safeGet("tang:products");
  if (!data) {
    await safeSet("tang:products", SEED);
    return SEED;
  }
  return data;
}

export async function setProducts(products) {
  if (!redis) return false;
  return safeSet("tang:products", products);
}

export async function getOrders() {
  if (!redis) return [];
  return (await safeGet("tang:orders")) || [];
}

export async function setOrders(orders) {
  if (!redis) return false;
  return safeSet("tang:orders", orders);
}

export async function getChat(orderId) {
  if (!redis) return { orderId, messages: [] };
  return (await safeGet("tang:chat:" + orderId)) || { orderId, messages: [] };
}

export async function setChat(orderId, chat) {
  if (!redis) return false;
  return safeSet("tang:chat:" + orderId, chat);
}