/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { api, getStoredToken, getStoredUser } from './lib/api.js';
import { User, Product, Order } from './types.js';
import { AuthPages } from './components/AuthPages.js';
import { MenuSection } from './components/MenuSection.js';
import { BookingCart } from './components/BookingCart.js';
import { CustomerOrders } from './components/CustomerOrders.js';
import { AdminOrders } from './components/AdminOrders.js';
import { AdminMenu } from './components/AdminMenu.js';
import { SupportChat } from './components/SupportChat.js';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  MessageSquare, 
  History, 
  LogOut, 
  Menu as HamburgerMenu, 
  ChefHat, 
  Activity, 
  CheckCircle,
  Clock,
  Briefcase
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Core working data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Navigation states
  const [customerTab, setCustomerTab] = useState<'menu' | 'bookings'>('menu');
  const [adminTab, setAdminTab] = useState<'reservations' | 'catalog'>('reservations');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);

  // Profile-less / Diner nickname changer states
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Loading indicator states
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Initial user token parsing check & automatic guest provisioning
  useEffect(() => {
    let token = getStoredToken();
    let stored = getStoredUser();

    if (!token || !stored) {
      // Provision an auto guest to enforce NO LOGIN / NO ACCOUNT signups
      const randomId = Math.floor(100000 + Math.random() * 900000);
      const guestName = "Gourmet Diner";
      token = `guest_${randomId}-customer-${encodeURIComponent(guestName)}`;
      stored = {
        id: `user-guest_${randomId}`,
        name: guestName,
        email: `guest_${randomId}@bistro-guest.com`,
        password: '',
        role: 'customer' as 'customer' | 'admin'
      };
      localStorage.setItem('bistro_auth_token', token);
      localStorage.setItem('bistro_auth_user', JSON.stringify(stored));
      localStorage.setItem('bistro_guest_user', JSON.stringify(stored));
      localStorage.setItem('bistro_guest_token', token);
    }

    setCurrentUser(stored);
    
    // Silently synchronize or fetch profiles
    api.getMe()
      .then(u => {
        setCurrentUser(u);
      })
      .catch((err) => {
        console.log('Running with offline/cached guest persona details: ', err.message);
      })
      .finally(() => setAuthInitialized(true));
  }, []);

  // Fetch products and active orders whenever user changes
  useEffect(() => {
    if (currentUser) {
      loadCatalog();
      loadOrders();
    }
  }, [currentUser]);

  async function loadCatalog() {
    setLoadingMenu(true);
    try {
      const data = await api.getMenu();
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load menu catalog:', err);
    } finally {
      setLoadingMenu(false);
    }
  }

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const data = await api.getOrders();
      setOrders(data || []);
    } catch (err) {
      console.error('Failed to load orders history:', err);
    } finally {
      setLoadingOrders(false);
    }
  }

  // Success timer toast
  function triggerToast(text: string) {
    setSuccessToast(text);
    setTimeout(() => {
      setSuccessToast('');
    }, 4500);
  }

  // Cart operations
  function handleAddToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        // Just increment quantity
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    triggerToast(`Added "${product.name}" to booking cart!`);
  }

  function handleUpdateCartQuantity(productId: string, delta: number) {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  }

  function handleRemoveCartItem(productId: string) {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }

  // Handle Order checkout Submission
  async function handleConfirmBookingOrder(notes: string) {
    if (cart.length === 0) return;
    const itemsPayload = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity
    }));

    try {
      const newOrder = await api.createOrder(itemsPayload, notes);
      setCart([]); // Reset Cart
      setIsCartOpen(false); // Close Cart
      
      // Refresh user's order lists
      loadOrders();
      
      // Auto redirect to Bookings tab and open live chat thread for this order
      setCustomerTab('bookings');
      setActiveChatOrderId(newOrder.id);
      
      triggerToast(`Order registered! Live chef chat initialized for reservation ${newOrder.id}`);
    } catch (err: any) {
      throw new Error(err.message || 'Booking submission failed.');
    }
  }

  // Admin menu operations proxy
  async function handleAdminCreateItem(item: Omit<Product, 'id'>) {
    await api.createMenuItem(item);
    loadCatalog();
    triggerToast(`Successfully added "${item.name}" to the menu!`);
  }

  async function handleAdminUpdateItem(id: string, item: Partial<Product>) {
    await api.updateMenuItem(id, item);
    loadCatalog();
    triggerToast(`Successfully modified catalog entry.`);
  }

  async function handleAdminDeleteItem(id: string) {
    await api.deleteMenuItem(id);
    loadCatalog();
    triggerToast(`Catalog item deleted from database.`);
  }

  // Admin status update proxy
  async function handleAdminUpdateStatus(id: string, status: Order['status']) {
    try {
      await api.updateOrderStatus(id, status);
      loadOrders();
      triggerToast(`Order ${id} is now updated to "${status}"`);
    } catch (err: any) {
      alert('Failed to modify status: ' + err.message);
    }
  }

  // Edit diner persona name
  function startEditingName() {
    if (!currentUser) return;
    setTempName(currentUser.name);
    setIsEditingName(true);
  }

  function saveDinerName() {
    if (!currentUser || !tempName.trim()) {
      setIsEditingName(false);
      return;
    }
    const cleanName = tempName.trim();
    const isGuest = currentUser.id.startsWith('user-guest_');
    const guestSuffix = isGuest ? currentUser.id.replace('user-guest_', '') : 'manual';
    
    const updatedUser = { ...currentUser, name: cleanName };
    const newToken = isGuest 
      ? `guest_${guestSuffix}-customer-${encodeURIComponent(cleanName)}`
      : `${currentUser.id}-customer-${encodeURIComponent(cleanName)}`;
      
    localStorage.setItem('bistro_auth_token', newToken);
    localStorage.setItem('bistro_auth_user', JSON.stringify(updatedUser));
    
    if (isGuest) {
      localStorage.setItem('bistro_guest_user', JSON.stringify(updatedUser));
      localStorage.setItem('bistro_guest_token', newToken);
    }
    
    setCurrentUser(updatedUser);
    setIsEditingName(false);
    triggerToast(`Diner name updated to "${cleanName}"!`);
  }

  // Double-agency simulator role toggle
  function handleToggleRole() {
    if (currentUser?.role === 'admin') {
      const storedGuestStr = localStorage.getItem('bistro_guest_user');
      const storedGuestToken = localStorage.getItem('bistro_guest_token');
      if (storedGuestStr && storedGuestToken) {
        localStorage.setItem('bistro_auth_token', storedGuestToken);
        localStorage.setItem('bistro_auth_user', storedGuestStr);
        setCurrentUser(JSON.parse(storedGuestStr));
      } else {
        const randomId = Math.floor(100000 + Math.random() * 900000);
        const guestName = "Gourmet Diner";
        const token = `guest_${randomId}-customer-${encodeURIComponent(guestName)}`;
        const user = {
          id: `user-guest_${randomId}`,
          name: guestName,
          email: `guest_${randomId}@bistro-guest.com`,
          password: '',
          role: 'customer' as const
        };
        localStorage.setItem('bistro_auth_token', token);
        localStorage.setItem('bistro_auth_user', JSON.stringify(user));
        localStorage.setItem('bistro_guest_user', JSON.stringify(user));
        localStorage.setItem('bistro_guest_token', token);
        setCurrentUser(user);
      }
      triggerToast('Switched to Diner Guest format! Browse dishes and chat to book.');
      setCustomerTab('menu');
    } else {
      if (currentUser) {
        localStorage.setItem('bistro_guest_user', JSON.stringify(currentUser));
        const tok = getStoredToken();
        if (tok) localStorage.setItem('bistro_guest_token', tok);
      }
      const adminUser = {
        id: 'user-admin',
        name: 'Sarah Executive (Admin)',
        email: 'admin@bistro.com',
        role: 'admin' as const
      };
      const adminToken = `user-admin-admin-${Date.now()}`;
      localStorage.setItem('bistro_auth_token', adminToken);
      localStorage.setItem('bistro_auth_user', JSON.stringify(adminUser));
      setCurrentUser(adminUser as any);
      triggerToast('Switched to Restaurant Staff Console! Manage bookings and reply to chats.');
    }
  }

  // Fulfill booking via chat triggered directly from product cards
  async function handleChatToBook(product: Product) {
    if (!currentUser) return;
    const itemsPayload = [{
      productId: product.id,
      quantity: 1
    }];

    try {
      const notes = `Diner wanted to book via direct chatting.`;
      const newOrder = await api.createOrder(itemsPayload, notes);
      
      // Auto-send a beautiful introductory booking question!
      await api.sendChatMessage(
        newOrder.id, 
        `Bonjour Chef! I saw the "${product.name}" (${product.category}) on your menu and I would love to reserve/book this dish. Could you prepare it for me?`
      );
      
      // Refresh list
      loadOrders();
      setCustomerTab('bookings');
      setActiveChatOrderId(newOrder.id);
      triggerToast(`Successfully started reservation chat thread for ${product.name}!`);
    } catch (err: any) {
      triggerToast(`Failed to initialize chef booking chat: ${err.message}`);
    }
  }

  // Reset/Clear Guest identity session
  function handleLogout() {
    api.logout();
    localStorage.removeItem('bistro_guest_user');
    localStorage.removeItem('bistro_guest_token');
    
    // Auto provision fresh guest identity for instant re-entry
    const randomId = Math.floor(100000 + Math.random() * 900000);
    const guestName = "Fresh Diner Guest";
    const token = `guest_${randomId}-customer-${encodeURIComponent(guestName)}`;
    const freshUser = {
      id: `user-guest_${randomId}`,
      name: guestName,
      email: `${randomId}@guest.com`,
      password: '',
      role: 'customer' as const
    };
    
    localStorage.setItem('bistro_auth_token', token);
    localStorage.setItem('bistro_auth_user', JSON.stringify(freshUser));
    localStorage.setItem('bistro_guest_user', JSON.stringify(freshUser));
    localStorage.setItem('bistro_guest_token', token);
    
    setCurrentUser(freshUser);
    setCart([]);
    setOrders([]);
    setCustomerTab('menu');
    setActiveChatOrderId(null);
    triggerToast('Diner session reset. A new anonymous guest identity has been created!');
  }

  if (!authInitialized) {
    return (
      <div id="master-loading" className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <UtensilsCrossed className="h-10 w-10 text-amber-500 animate-spin mx-auto" />
          <p className="text-sm font-serif font-bold text-slate-850">Connecting to Le Petit Bistro...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    // Fallback self-recovery if somehow currentUser is missing
    return (
      <div id="recovering-session" className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-xs"
          >
            Load Diner Menu
          </button>
        </div>
      </div>
    );
  }

  const activeChatOrder = orders.find(o => o.id === activeChatOrderId);

  return (
    <div id="bistro-app-shell" className="min-h-screen flex flex-col bg-slate-50/50">
      
      {/* Interactive Role Switcher Simulation Banner */}
      <div 
        id="demo-role-banner" 
        className={`text-center py-2 px-4 text-xs font-semibold flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 transition-colors shrink-0 z-50 ${
          currentUser.role === 'admin' 
            ? 'bg-indigo-600 text-white shadow-inner' 
            : 'bg-amber-600 text-white shadow-inner'
        }`}
      >
        <span>
          {currentUser.role === 'admin' 
            ? '👨‍🍳 STAFF SIMULATION: You are viewing as Bistro Crew. Manage incoming dinner bookings and respond to customer chats!' 
            : '🍷 NO LOGIN MODE: Scan QR or visit to view products. Like something? Click "💬 Chat to Book" to reserve instantly!'}
        </span>
        <button
          onClick={handleToggleRole}
          className="bg-white text-slate-900 border border-transparent hover:bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer shadow-sm shrink-0"
        >
          {currentUser.role === 'admin' ? 'Switch to Guest Viewer 🍷' : 'Switch to Staff Panel 👨‍🍳'}
        </button>
      </div>

      {/* Toast Alert Banner Notification */}
      {successToast && (
        <div id="global-toast" className="fixed top-5 right-5 z-55 max-w-sm bg-slate-900 border border-slate-850 text-white p-3.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200">
          <div className="h-5 w-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            ✓
          </div>
          <span className="text-xs font-medium">{successToast}</span>
        </div>
      )}

      {/* Primary Brand Navigation Bar */}
      <header id="main-header" className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div id="header-brand-logo" className="h-9 w-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-md shadow-amber-500/10 text-white">
                <ChefHat className="h-5 w-5" />
              </div>
              <div>
                <span className="font-serif font-bold text-slate-950 text-base tracking-tight block">Le Petit Bistro</span>
                <span className="text-[10px] text-slate-450 uppercase tracking-widest font-bold -mt-1 block">Live Suite</span>
              </div>
            </div>

            {/* Middle Nav Tab buttons depending on Current Role */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-50 p-1 border border-slate-150 rounded-xl text-xs font-semibold">
              {currentUser.role === 'admin' ? (
                <>
                  <button
                    id="admin-tab-btn-orders"
                    onClick={() => setAdminTab('reservations')}
                    className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                      adminTab === 'reservations' 
                        ? 'bg-white shadow text-slate-950 font-bold border border-slate-100' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Incoming Reservations ({orders.filter(o => o.status !== 'Delivered').length})
                  </button>
                  <button
                    id="admin-tab-btn-menu"
                    onClick={() => setAdminTab('catalog')}
                    className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                      adminTab === 'catalog' 
                        ? 'bg-white shadow text-slate-950 font-bold border border-slate-100' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Configure Menu ({products.length})
                  </button>
                </>
              ) : (
                <>
                  <button
                    id="client-tab-btn-menu"
                    onClick={() => setCustomerTab('menu')}
                    className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                      customerTab === 'menu' 
                        ? 'bg-white shadow text-slate-950 font-bold border border-slate-100' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Browse Gourmet Menu
                  </button>
                  <button
                    id="client-tab-btn-orders"
                    onClick={() => setCustomerTab('bookings')}
                    className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                      customerTab === 'bookings' 
                        ? 'bg-white shadow text-slate-950 font-bold border border-slate-100' 
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    My Dinner Reservations ({orders.length})
                  </button>
                </>
              )}
            </div>

            {/* Right Header Controls panel */}
            <div className="flex items-center gap-3">
              {/* User greeting and role display */}
              <div className="hidden md:block text-right">
                {currentUser.role === 'customer' ? (
                  isEditingName ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        maxLength={20}
                        className="border border-amber-300 rounded px-2 py-0.5 text-xs text-slate-900 bg-amber-50/55 focus:outline-none focus:ring-1 focus:ring-amber-500 w-28 font-semibold"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveDinerName();
                          if (e.key === 'Escape') setIsEditingName(false);
                        }}
                        autoFocus
                      />
                      <button 
                        onClick={saveDinerName}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded cursor-pointer"
                      >
                        Set
                      </button>
                    </div>
                  ) : (
                    <div>
                      <span className="text-xs font-bold text-slate-900 flex items-center justify-end gap-1">
                        <span>{currentUser.name}</span>
                        <button
                          onClick={startEditingName}
                          className="text-amber-500 hover:text-amber-600 p-0.5 transition-colors cursor-pointer"
                          title="Click to rename your Diner profile nickname"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center justify-end gap-1">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-550"></span>
                        Guest Diner
                      </span>
                    </div>
                  )
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">{currentUser.name}</span>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold flex items-center justify-end gap-1">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                      Staff Console
                    </span>
                  </div>
                )}
              </div>

              {/* Shopping Cart button trigger for Customers */}
              {currentUser.role === 'customer' && (
                <button
                  id="header-cart-trigger"
                  onClick={() => setIsCartOpen(true)}
                  className="relative p-2 text-slate-600 hover:text-slate-950 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded-xl transition-all cursor-pointer"
                  title="Open Reservation Cart"
                >
                  <ShoppingBag className="h-5 w-5" />
                  {cart.length > 0 && (
                    <span id="cart-counter-bubble" className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-mono leading-none font-extrabold shadow shadow-rose-500/10">
                      {cart.reduce((sum, item) => sum + item.quantity, 0)}
                    </span>
                  )}
                </button>
              )}

              {/* Logout Button resets physical guest token */}
              <button
                id="header-logout-btn"
                onClick={handleLogout}
                className="p-2 text-slate-550 hover:text-amber-600 hover:bg-amber-50 bg-slate-50 border border-slate-205 rounded-xl transition-all cursor-pointer animate-pulse"
                title="Reset/Clear Guest Active Cache & Start Fresh"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile-only Nav tab switcher */}
      <div id="mobile-tab-sub-nav" className="sm:hidden bg-white border-b border-slate-100 p-2.5 flex justify-center shrink-0">
        <div className="flex bg-slate-50 border border-slate-150 p-1 rounded-xl w-full text-xs font-semibold">
          {currentUser.role === 'admin' ? (
            <>
              <button
                id="mob-admin-tab-btn-orders"
                onClick={() => setAdminTab('reservations')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  adminTab === 'reservations' ? 'bg-white shadow text-slate-950 font-bold border border-slate-100' : 'text-slate-500'
                }`}
              >
                Reservations ({orders.filter(o => o.status !== 'Delivered').length})
              </button>
              <button
                id="mob-admin-tab-btn-menu"
                onClick={() => setAdminTab('catalog')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  adminTab === 'catalog' ? 'bg-white shadow text-slate-950 font-bold border border-slate-100' : 'text-slate-500'
                }`}
              >
                Catalogue ({products.length})
              </button>
            </>
          ) : (
            <>
              <button
                id="mob-client-tab-btn-menu"
                onClick={() => setCustomerTab('menu')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  customerTab === 'menu' ? 'bg-white shadow text-slate-950 font-bold border border-slate-100' : 'text-slate-500'
                }`}
              >
                Browse Menu
              </button>
              <button
                id="mob-client-tab-btn-orders"
                onClick={() => setCustomerTab('bookings')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  customerTab === 'bookings' ? 'bg-white shadow text-slate-950 font-bold border border-slate-100' : 'text-slate-500'
                }`}
              >
                My Bookings ({orders.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {currentUser.role === 'admin' ? (
          /* Admin Side Content */
          <div id="admin-main-viewport" className="space-y-6">
            
            {/* Quick stats grid for Bistro Executive staff */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="h-10 w-10 bg-amber-500/10 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pending Review</span>
                  <span className="text-base font-mono font-extrabold text-slate-950">
                    {orders.filter(o => o.status === 'Pending').length}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Confirmed Orders</span>
                  <span className="text-base font-mono font-extrabold text-slate-950">
                    {orders.filter(o => o.status === 'Confirmed').length}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="h-10 w-10 bg-blue-500/10 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Catalog Capacity</span>
                  <span className="text-base font-mono font-extrabold text-slate-950">{products.length} Items</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-500/10 text-indigo-650 rounded-lg flex items-center justify-center shrink-0">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Revenue Managed</span>
                  <span className="text-base font-mono font-extrabold text-slate-950">
                    ${orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {adminTab === 'reservations' ? (
              <AdminOrders
                orders={orders}
                onUpdateStatus={handleAdminUpdateStatus}
                onSelectChat={(orderId) => setActiveChatOrderId(orderId)}
                onRefresh={loadOrders}
                loading={loadingOrders}
              />
            ) : (
              <AdminMenu
                products={products}
                onCreateItem={handleAdminCreateItem}
                onUpdateItem={handleAdminUpdateItem}
                onDeleteItem={handleAdminDeleteItem}
              />
            )}
          </div>
        ) : (
          /* Customer Side Content */
          <div id="customer-main-viewport" className="space-y-6">
            {customerTab === 'menu' ? (
              <MenuSection
                products={products}
                onAddToCart={handleAddToCart}
                cartCount={cart.length}
                onOpenCart={() => setIsCartOpen(true)}
                selectedCartItemIds={cart.map(i => i.product.id)}
                onChatToBook={handleChatToBook}
              />
            ) : (
              <CustomerOrders
                orders={orders}
                onRefresh={loadOrders}
                onSelectChat={(orderId) => setActiveChatOrderId(orderId)}
                loading={loadingOrders}
              />
            )}
          </div>
        )}
      </main>

      {/* Drawer Overlay for Shopping Booking Cart */}
      {isCartOpen && (
        <div id="cart-drawer-overlay" className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl animate-in slide-in-from-right-12 duration-200">
              <BookingCart
                items={cart}
                onUpdateQuantity={handleUpdateCartQuantity}
                onRemoveItem={handleRemoveCartItem}
                onSubmitOrder={handleConfirmBookingOrder}
                onClose={() => setIsCartOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Live Support Conversation Modal Dialogue */}
      {activeChatOrderId && (
        <div id="active-chat-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden scale-in duration-150">
            <SupportChat
              orderId={activeChatOrderId}
              order={activeChatOrder}
              currentUserRole={currentUser.role}
              currentUserId={currentUser.id}
              onClose={() => setActiveChatOrderId(null)}
            />
          </div>
        </div>
      )}

      {/* Styled Dining Watermark Footer */}
      <footer id="app-footer" className="bg-slate-900 border-t border-slate-850 py-8 text-center text-xs text-slate-500 mt-auto shrink-0 leading-relaxed font-sans">
        <p className="font-serif italic text-slate-450">&ldquo;Gourmet cuisine, prepared with masterly attention to detail, orchestrated live.&rdquo;</p>
        <p className="mt-2 font-semibold">Le Petit Bistro Reservation Systems • 2026</p>
      </footer>
    </div>
  );
}
