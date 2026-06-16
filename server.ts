import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { User, Product, Order, Chat, Message } from './src/types.js';

// Setup file/dir helpers for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'database.json');

// Interface for database structure
interface StorageDB {
  users: User[];
  products: Product[];
  orders: Order[];
  chats: Chat[];
}

// Default initial data
const initialProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Smoky BBQ Bacon Burger',
    category: 'Food',
    description: 'Double flame-grilled beef patties, crispy applewood smoked bacon, sharp cheddar cheese, and house-made BBQ sauce on an artisanal brioche bun.',
    price: 16.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
    availability: true
  },
  {
    id: 'prod-2',
    name: 'Truffle Mushroom Gnocchi',
    category: 'Food',
    description: 'Handmade potato gnocchi tossed in a decadent wild mushroom truffle cream sauce, topped with grated pecorino romano and fresh thyme.',
    price: 18.50,
    image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?auto=format&fit=crop&w=600&q=80',
    availability: true
  },
  {
    id: 'prod-3',
    name: 'Seared Atlantic Salmon',
    category: 'Food',
    description: 'Crispy skin Atlantic salmon served over baby spinach, roasted garlic fingerling potatoes, and drizzled with a citrus dill glaze.',
    price: 22.99,
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
    availability: true
  },
  {
    id: 'prod-4',
    name: 'Charred Caesar Salad',
    category: 'Food',
    description: 'Lightly charred artisan romaine, sourdough herb croutons, crispy parmesan frico, and our classic creamy Caesar dressing.',
    price: 13.50,
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=600&q=80',
    availability: true
  },
  {
    id: 'prod-5',
    name: 'Craft Mojito',
    category: 'Drinks',
    description: 'Super chilled silver rum, fresh-muddled lime wedges, organic mint leaves, and pure cane sugar topped with sparkling club soda.',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
    availability: true
  },
  {
    id: 'prod-6',
    name: 'Classic Old Fashioned',
    category: 'Drinks',
    description: 'Kentucky straight bourbon, aromatic Angostura bitters, a single demerara sugar cube, garnished with dry orange peel and a Luxardo cherry.',
    price: 11.50,
    image: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=600&q=80',
    availability: true
  },
  {
    id: 'prod-7',
    name: 'Espresso Martini',
    category: 'Drinks',
    description: 'A bold shake of freshly brewed arabica espresso, premium vodka, and smooth coffee liqueur with three floats of espresso beans.',
    price: 12.00,
    image: 'https://images.unsplash.com/photo-1545438102-799c3991ffb2?auto=format&fit=crop&w=600&q=80',
    availability: true
  },
  {
    id: 'prod-8',
    name: 'Warm Chocolate Lava Cake',
    category: 'Desserts',
    description: 'Rich dark chocolate cake with a molten liquid center. Served hot and dressed with organic vanilla bean gelato and raspberry coulis.',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
    availability: true
  },
  {
    id: 'prod-9',
    name: 'Madagascar Vanilla Crème Brûlée',
    category: 'Desserts',
    description: 'Silky Madagascar vanilla custard capped with a hard caramel shell, garnished with ripe fresh seasonal berries.',
    price: 9.50,
    image: 'https://images.unsplash.com/photo-1470324161839-ce2bb6fa6bc3?auto=format&fit=crop&w=600&q=80',
    availability: true
  }
];

const initialUsers: User[] = [
  {
    id: 'user-admin',
    name: 'Sarah Executive (Admin)',
    email: 'admin@bistro.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    id: 'user-customer',
    name: 'Felix Diner',
    email: 'customer@bistro.com',
    password: 'customer123',
    role: 'customer'
  }
];

// Load or seed the Database File helper
function loadDB(): StorageDB {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw) as StorageDB;
      return {
        users: loaded.users || initialUsers,
        products: loaded.products || initialProducts,
        orders: loaded.orders || [],
        chats: loaded.chats || []
      };
    }
  } catch (error) {
    console.error('Failed to load database. Re-initializing default state.', error);
  }
  const defaultDB: StorageDB = {
    users: initialUsers,
    products: initialProducts,
    orders: [],
    chats: []
  };
  saveDB(defaultDB);
  return defaultDB;
}

function saveDB(data: StorageDB) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save database state:', error);
  }
}

// Initialize working dataset
let db = loadDB();

// Setup Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Helper for JWT/Auth Token Mock verification
function getAuthenticatedUser(req: express.Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  
  if (!token) return null;

  const parts = token.split('-');
  if (parts.length < 2) return null;

  // Handle dynamic Guest Tokens (format: guest_<id>-customer-<url-encoded-name>)
  if (token.startsWith('guest_')) {
    const guestId = parts[0];
    let guestName = 'Bistro Guest';
    if (parts.length > 2) {
      try {
        guestName = decodeURIComponent(parts.slice(2).join('-'));
      } catch (e) {
        guestName = parts.slice(2).join('-');
      }
    }
    const userId = `user-${guestId}`;
    const guestUser: User = {
      id: userId,
      name: guestName,
      email: `${guestId}@bistro-guest.com`,
      password: '',
      role: 'customer'
    };

    // Save/update this guest in db.users memory
    const existingIndex = db.users.findIndex(u => u.id === userId);
    if (existingIndex >= 0) {
      db.users[existingIndex].name = guestName;
    } else {
      db.users.push(guestUser);
    }
    saveDB(db);
    return guestUser;
  }

  const userId = parts[0];
  const user = db.users.find(u => u.id === userId);
  return user || null;
}

// AUTH ENDPOINTS
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing name, email, or password' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email address already registered' });
  }

  const userRole = role === 'admin' ? 'admin' : 'customer';
  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email: email.toLowerCase(),
    password,
    role: userRole
  };

  db.users.push(newUser);
  saveDB(db);

  const token = `${newUser.id}-${newUser.role}-${Date.now()}`;
  res.status(201).json({
    user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
    token
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  const user = db.users.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = `${user.id}-${user.role}-${Date.now()}`;
  res.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    token
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized credentials' });
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});


// PRODUCTS / MENU ENDPOINTS
app.get('/api/menu', (req, res) => {
  res.json(db.products);
});

// Admin-only Menu Creators/Mutators
app.post('/api/menu', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Admins only.' });
  }

  const { name, category, description, price, image, availability } = req.body;
  if (!name || !category || !price) {
    return res.status(400).json({ error: 'Missing name, category, or price' });
  }

  const newProduct: Product = {
    id: `prod-${Date.now()}`,
    name,
    category,
    description: description || '',
    price: Number(price),
    image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
    availability: availability !== undefined ? Boolean(availability) : true
  };

  db.products.push(newProduct);
  saveDB(db);
  res.status(201).json(newProduct);
});

app.put('/api/menu/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Admins only.' });
  }

  const { id } = req.params;
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, category, description, price, image, availability } = req.body;
  db.products[index] = {
    ...db.products[index],
    name: name !== undefined ? name : db.products[index].name,
    category: category !== undefined ? category : db.products[index].category,
    description: description !== undefined ? description : db.products[index].description,
    price: price !== undefined ? Number(price) : db.products[index].price,
    image: image !== undefined ? image : db.products[index].image,
    availability: availability !== undefined ? Boolean(availability) : db.products[index].availability
  };

  saveDB(db);
  res.json(db.products[index]);
});

app.delete('/api/menu/:id', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Admins only.' });
  }

  const { id } = req.params;
  const filtered = db.products.filter(p => p.id !== id);
  if (filtered.length === db.products.length) {
    return res.status(404).json({ error: 'Product not found' });
  }

  db.products = filtered;
  saveDB(db);
  res.json({ success: true, message: 'Item deleted' });
});


// ORDERS ENDPOINTS
app.get('/api/orders', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized credentials' });
  }

  if (user.role === 'admin') {
    res.json(db.orders);
  } else {
    // Return only this customer's orders
    const history = db.orders.filter(o => o.customerId === user.id);
    res.json(history);
  }
});

app.post('/api/orders', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized credentials' });
  }

  const { items, notes } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Booking order must have at least one valid item' });
  }

  // Calculate order items and total cost
  const orderItems = items.map((item: any) => {
    const originalProd = db.products.find(p => p.id === item.productId);
    return {
      productId: item.productId,
      name: originalProd ? originalProd.name : item.name,
      price: originalProd ? originalProd.price : Number(item.price),
      image: originalProd ? originalProd.image : item.image,
      quantity: Number(item.quantity || 1)
    };
  });

  const totalSum = orderItems.reduce((acc, val) => acc + (val.price * val.quantity), 0);
  const roundedTotal = Math.round(totalSum * 100) / 100;

  const orderId = `order-${Date.now()}`;
  const newOrder: Order = {
    id: orderId,
    customerId: user.id,
    customerName: user.name,
    items: orderItems,
    status: 'Pending',
    total: roundedTotal,
    createdAt: new Date().toISOString(),
    notes: notes || ''
  };

  db.orders.push(newOrder);

  // Automatically trigger a chat initialization for this booking
  const welcomeMessage: Message = {
    id: `msg-${Date.now()}-welcome`,
    senderId: 'system',
    senderName: 'Bistro Host',
    senderRole: 'admin',
    text: `Hello ${user.name}! Thank you for booking with us. We have received your order request (${orderId}) and are currently reviewing it. Let us know if you want to make any modifications or confirm special dining preferences here in the live support chat.`,
    timestamp: new Date().toISOString()
  };

  const newChat: Chat = {
    orderId: orderId,
    messages: [welcomeMessage]
  };

  db.chats.push(newChat);
  saveDB(db);

  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Permission denied. Admins only.' });
  }

  const { id } = req.params;
  const { status } = req.body; // 'Pending' | 'Confirmed' | 'Delivered'
  if (!status || !['Pending', 'Confirmed', 'Delivered'].includes(status)) {
    return res.status(400).json({ error: 'Invalid order status value' });
  }

  const orderIndex = db.orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const oldStatus = db.orders[orderIndex].status;
  db.orders[orderIndex].status = status;

  // Add a status-change log message inside the order chat thread
  const updateMsg: Message = {
    id: `msg-${Date.now()}-status`,
    senderId: 'system',
    senderName: 'Bistro Updates',
    senderRole: 'admin',
    text: `🔔 ORDER UPDATE: Your booking status was updated from "${oldStatus}" to "${status}".`,
    timestamp: new Date().toISOString()
  };

  const chat = db.chats.find(c => c.orderId === id);
  if (chat) {
    chat.messages.push(updateMsg);
  } else {
    db.chats.push({
      orderId: id,
      messages: [updateMsg]
    });
  }

  saveDB(db);
  res.json(db.orders[orderIndex]);
});


// CHAT ENDPOINTS
app.get('/api/chat/:orderId', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized credentials' });
  }

  const { orderId } = req.params;
  // Ensure non-admins only see chats for their own orders
  if (user.role !== 'admin') {
    const order = db.orders.find(o => o.id === orderId && o.customerId === user.id);
    if (!order) {
      return res.status(403).json({ error: 'Access denied to this order conversation' });
    }
  }

  const chat = db.chats.find(c => c.orderId === orderId);
  if (!chat) {
    return res.json({ orderId, messages: [] });
  }
  res.json(chat);
});

app.post('/api/chat/:orderId', (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized credentials' });
  }

  const { orderId } = req.params;
  const { text } = req.body;
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  // Permission validation
  if (user.role !== 'admin') {
    const order = db.orders.find(o => o.id === orderId && o.customerId === user.id);
    if (!order) {
      return res.status(403).json({ error: 'Access denied' });
    }
  }

  let chat = db.chats.find(c => c.orderId === orderId);
  if (!chat) {
    chat = { orderId, messages: [] };
    db.chats.push(chat);
  }

  const newMessage: Message = {
    id: `msg-${Date.now()}`,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    text: text.trim(),
    timestamp: new Date().toISOString()
  };

  chat.messages.push(newMessage);
  saveDB(db);

  res.status(201).json(newMessage);
});


// INTEGRATE VITE DEVELOPMENT MIDDLEWARE OR SERVE PRODUCTION ASSETS
async function run() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bistro Server running on port ${PORT}`);
  });
}

run().catch(err => {
  console.error('Server failure starting:', err);
});
