import { useState, useEffect, useCallback } from 'react';
import { LangProvider, useLang } from './i18n/LangContext.js';
import { DepartmentMenu } from './components/DepartmentMenu.js';
import { BookingCart } from './components/BookingCart.js';
import { CustomerOrders } from './components/CustomerOrders.js';
import { AdminCatalog } from './components/AdminCatalog.js';
import { AdminOrders } from './components/AdminOrders.js';
import { AdminUnlockModal } from './components/AdminUnlockModal.js';
import { SupportChat } from './components/SupportChat.js';
import { api, setStoredToken, setStoredUser, getStoredUser, getStoredToken, getAdminToken, setAdminToken } from './lib/api.js';
import { Product, Order, Department } from './types.js';
import { ShoppingBag, Globe, ShieldCheck, LogOut, ChefHat } from 'lucide-react';

function AppInner() {
  const { t, lang, toggleLang } = useLang();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [activeDepartment, setActiveDepartment] = useState<Department>('Drinks');
  const [customerTab, setCustomerTab] = useState<'menu' | 'orders'>('menu');
  const [adminTab, setAdminTab] = useState<'catalog' | 'orders'>('catalog');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeChatOrderId, setActiveChatOrderId] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [toast, setToast] = useState('');

  function triggerToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  // Auto-create guest user on load
  useEffect(() => {
    async function init() {
      let user = getStoredUser();
      let token = getStoredToken();
      if (!user || !token) {
        try {
          const res = await fetch('/api/auth/me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Guest' })
          });
          const data = await res.json();
          setStoredToken(data.token);
          setStoredUser(data.user);
          user = data.user;
        } catch {}
      }
      setCurrentUser(user);
      const adminToken = getAdminToken();
      if (adminToken) setIsAdmin(true);
      loadProducts();
    }
    init();
  }, []);

  async function loadProducts() {
    try {
      const data = await api.getMenu();
      setProducts(data);
    } catch {}
  }

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch {} finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) loadOrders();
  }, [currentUser, loadOrders]);

  function handleAddToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1 }];
    });
  }

  function handleUpdateCartQuantity(productId: string, delta: number) {
    setCart(prev => prev.map(i => i.product.id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  }

  function handleRemoveCartItem(productId: string) {
    setCart(prev => prev.filter(i => i.product.id !== productId));
  }

  async function handleSubmitOrder(notes: string) {
    const items = cart.map(i => ({ productId: i.product.id, quantity: i.quantity }));
    await api.createOrder(items, notes);
    setCart([]);
    setIsCartOpen(false);
    loadOrders();
    setCustomerTab('orders');
    triggerToast('Order placed successfully!');
  }

  async function handleChatToBook(product: Product) {
    const items = [{ productId: product.id, quantity: 1 }];
    const order = await api.createOrder(items, 'Direct chat booking');
    await api.sendChatMessage(order.id, `Hello! I am interested in "${product.name}". Can you help me?`);
    loadOrders();
    setActiveChatOrderId(order.id);
    setCustomerTab('orders');
  }

  function handleAdminSuccess() {
    setIsAdmin(true);
    setShowAdminModal(false);
    loadOrders();
    triggerToast('Admin access granted!');
  }

  function handleAdminLock() {
    api.lockAdmin();
    setAdminToken(null);
    setIsAdmin(false);
    triggerToast('Admin session ended.');
  }

  async function handleCreateItem(item: Omit<Product, 'id'>) {
    await api.createMenuItem(item);
    loadProducts();
    triggerToast('Product added!');
  }

  async function handleUpdateItem(id: string, item: Partial<Product>) {
    await api.updateMenuItem(id, item);
    loadProducts();
    triggerToast('Product updated!');
  }

  async function handleDeleteItem(id: string) {
    await api.deleteMenuItem(id);
    loadProducts();
    triggerToast('Product deleted!');
  }

  async function handleUpdateStatus(id: string, status: Order['status']) {
    await api.updateOrderStatus(id, status);
    loadOrders();
    triggerToast('Order status updated!');
  }

  const activeChatOrder = orders.find(o => o.id === activeChatOrderId);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--linen)', color: 'var(--ink)' }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] bg-[var(--ink)] text-white px-4 py-3 rounded-xl text-xs font-bold shadow-2xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--cream-card)] border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 bg-[var(--clay)] rounded-xl flex items-center justify-center">
                <ChefHat className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-display font-bold text-[var(--ink)] text-sm block">{t('brand')}</span>
                <span className="text-[9px] text-[var(--ink)]/40 uppercase tracking-widest block">{t('tagline').slice(0, 30)}...</span>
              </div>
            </div>

            {/* Nav tabs */}
            {!isAdmin && (
              <div className="hidden sm:flex items-center gap-1 bg-black/5 p-1 rounded-xl text-xs font-semibold">
                <button onClick={() => setCustomerTab('menu')} className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${customerTab === 'menu' ? 'bg-white shadow text-[var(--ink)] font-bold' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}>
                  Menu
                </button>
                <button onClick={() => { setCustomerTab('orders'); loadOrders(); }} className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${customerTab === 'orders' ? 'bg-white shadow text-[var(--ink)] font-bold' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}>
                  {t('myBookings')} ({orders.length})
                </button>
              </div>
            )}

            {isAdmin && (
              <div className="hidden sm:flex items-center gap-1 bg-black/5 p-1 rounded-xl text-xs font-semibold">
                <button onClick={() => setAdminTab('catalog')} className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${adminTab === 'catalog' ? 'bg-white shadow text-[var(--ink)] font-bold' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}>
                  {t('manageCatalog')}
                </button>
                <button onClick={() => { setAdminTab('orders'); loadOrders(); }} className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${adminTab === 'orders' ? 'bg-white shadow text-[var(--ink)] font-bold' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}>
                  {t('incomingOrders')} ({orders.length})
                </button>
              </div>
            )}

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <button onClick={toggleLang} className="px-2.5 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
                <Globe className="h-3.5 w-3.5" />
                {lang === 'en' ? 'RW' : 'EN'}
              </button>

              {!isAdmin ? (
                <button onClick={() => setShowAdminModal(true)} className="px-3 py-1.5 bg-[var(--ink)] hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {t('admin')}
                </button>
              ) : (
                <button onClick={handleAdminLock} className="px-3 py-1.5 bg-red-500 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                  <LogOut className="h-3.5 w-3.5" />
                  {t('exitAdmin')}
                </button>
              )}

              {!isAdmin && (
                <button onClick={() => setIsCartOpen(true)} className="relative p-2 bg-black/5 hover:bg-black/10 rounded-xl cursor-pointer transition-all">
                  <ShoppingBag className="h-5 w-5 text-[var(--ink)]" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-[var(--clay)] text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                      {cart.reduce((s, i) => s + i.quantity, 0)}
                    </span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="sm:hidden border-t border-black/5 p-2 flex gap-1">
          {!isAdmin ? (
            <>
              <button onClick={() => setCustomerTab('menu')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${customerTab === 'menu' ? 'bg-[var(--clay)] text-white' : 'bg-black/5 text-[var(--ink)]/60'}`}>Menu</button>
              <button onClick={() => { setCustomerTab('orders'); loadOrders(); }} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${customerTab === 'orders' ? 'bg-[var(--clay)] text-white' : 'bg-black/5 text-[var(--ink)]/60'}`}>{t('myBookings')}</button>
            </>
          ) : (
            <>
              <button onClick={() => setAdminTab('catalog')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${adminTab === 'catalog' ? 'bg-[var(--clay)] text-white' : 'bg-black/5 text-[var(--ink)]/60'}`}>{t('manageCatalog')}</button>
              <button onClick={() => { setAdminTab('orders'); loadOrders(); }} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${adminTab === 'orders' ? 'bg-[var(--clay)] text-white' : 'bg-black/5 text-[var(--ink)]/60'}`}>{t('incomingOrders')}</button>
            </>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isAdmin ? (
          adminTab === 'catalog' ? (
            <AdminCatalog products={products} onCreateItem={handleCreateItem} onUpdateItem={handleUpdateItem} onDeleteItem={handleDeleteItem} />
          ) : (
            <AdminOrders orders={orders} onUpdateStatus={handleUpdateStatus} onSelectChat={setActiveChatOrderId} onRefresh={loadOrders} loading={loadingOrders} />
          )
        ) : (
          customerTab === 'menu' ? (
            <DepartmentMenu products={products} activeDepartment={activeDepartment} onChangeDepartment={setActiveDepartment} onAddToCart={handleAddToCart} selectedCartItemIds={cart.map(i => i.product.id)} onChatToBook={handleChatToBook} />
          ) : (
            <CustomerOrders orders={orders} onRefresh={loadOrders} onSelectChat={setActiveChatOrderId} loading={loadingOrders} />
          )
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[var(--ink)] text-white/40 text-center text-xs py-6">
        <p className="font-display italic text-white/60">{t('brand')}</p>
        <p className="mt-1">{t('tagline')}</p>
      </footer>

      {/* Cart drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl">
            <BookingCart items={cart} onUpdateQuantity={handleUpdateCartQuantity} onRemoveItem={handleRemoveCartItem} onSubmitOrder={handleSubmitOrder} onClose={() => setIsCartOpen(false)} />
          </div>
        </div>
      )}

      {/* Chat modal */}
      {activeChatOrderId && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <SupportChat orderId={activeChatOrderId} order={activeChatOrder} isAdmin={isAdmin} currentUserId={currentUser.id} onClose={() => setActiveChatOrderId(null)} />
          </div>
        </div>
      )}

      {/* Admin unlock modal */}
      {showAdminModal && (
        <AdminUnlockModal onClose={() => setShowAdminModal(false)} onSuccess={handleAdminSuccess} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}
