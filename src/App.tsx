import { useState, useEffect, useCallback } from 'react';
import { LangProvider, useLang } from './i18n/LangContext.js';
import { DepartmentMenu } from './components/DepartmentMenu.js';
import { BookingCart } from './components/BookingCart.js';
import { CustomerOrders } from './components/CustomerOrders.js';
import { AdminCatalog } from './components/AdminCatalog.js';
import { AdminOrders } from './components/AdminOrders.js';
import { AdminUnlockModal } from './components/AdminUnlockModal.js';
import { SupportChat } from './components/SupportChat.js';
import { api, ensureIdentity, setStoredToken, setStoredUser, getStoredUser, getStoredToken, getAdminToken, setAdminToken } from './lib/api.js';
import { Product, Order, Department } from './types.js';
import {
  ShoppingBag, Globe, ShieldCheck, LogOut, ChefHat,
  Users, ArrowRight, MessageSquare
} from 'lucide-react';

function RoleSelectionScreen({ onSelectClient, onSelectAdmin }: {
  onSelectClient: () => void;
  onSelectAdmin: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--linen)' }}>
      <div className="flex items-center justify-center gap-3 py-8">
        <div className="h-12 w-12 bg-[var(--clay)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--clay)]/20">
          <ChefHat className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-[var(--ink)] text-xl leading-tight">Tang Hospitality Service</h1>
          <p className="text-[10px] text-[var(--ink)]/40 uppercase tracking-widest">Drinks · Food · Hospitality</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">
        <div className="text-center mb-10 max-w-sm">
          <h2 className="font-display font-bold text-3xl text-[var(--ink)] leading-tight mb-3">
            Welcome.<br />
            <span style={{ color: 'var(--clay)' }}>Who are you?</span>
          </h2>
          <p className="text-sm text-[var(--ink)]/50 leading-relaxed">
            Select your access type to continue. No account needed.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
          <button
            onClick={onSelectClient}
            className="group relative bg-[var(--cream-card)] border-2 border-black/5 hover:border-[var(--clay)]/40 rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden"
          >
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(194,81,28,0.1)' }}>
                <Users className="h-7 w-7" style={{ color: 'var(--clay)' }} />
              </div>
              <h3 className="font-display font-bold text-xl text-[var(--ink)] mb-2">Client</h3>
              <p className="text-sm text-[var(--ink)]/55 leading-relaxed mb-6">
                Browse our drinks, food, and hospitality services. Chat directly with us to order or ask questions.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Drinks', 'Food', 'Hospitality'].map(label => (
                  <span key={label} className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide" style={{ background: 'rgba(194,81,28,0.08)', color: 'var(--clay)' }}>
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--clay)' }}>
                <span>Browse now</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>

          <button
            onClick={onSelectAdmin}
            className="group relative bg-[var(--ink)] border-2 border-[var(--ink)] hover:border-[var(--gold)] rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-xl cursor-pointer overflow-hidden"
          >
            <div className="relative">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(185,135,31,0.15)' }}>
                <ShieldCheck className="h-7 w-7" style={{ color: 'var(--gold)' }} />
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-2">Tang Hospitality Service</h3>
              <p className="text-sm text-white/50 leading-relaxed mb-6">
                Manage your catalog, view orders, and reply to customer messages in real time.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['Products', 'Orders', 'Messages'].map(label => (
                  <span key={label} className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wide" style={{ background: 'rgba(185,135,31,0.15)', color: 'var(--gold)' }}>
                    {label}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2 font-bold text-sm" style={{ color: 'var(--gold)' }}>
                <span>Staff login</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-8 mt-12 text-center">
          {['Drinks', 'Food', 'Hospitality', 'Live Chat'].map((label) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <div className="h-10 w-10 rounded-xl bg-black/5 flex items-center justify-center text-[var(--ink)]/40">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-bold text-[var(--ink)]/35 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <footer className="text-center py-6 text-[10px] text-[var(--ink)]/30 font-medium">
        Tang Hospitality Service · Kigali, Rwanda · 2026
      </footer>
    </div>
  );
}

function AppInner() {
  const { t, lang, toggleLang } = useLang();
  const [role, setRole] = useState<'none' | 'client' | 'admin'>('none');
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

  useEffect(() => {
    async function initGuest() {
      try {
        // Always call ensureIdentity on load — creates or restores guest session
        const user = await ensureIdentity();
        setCurrentUser(user);
      } catch (e) {
        console.error('Guest identity failed:', e);
      }
    }
    initGuest();
    loadProducts();
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
    if (currentUser && (role === 'client' || role === 'admin')) loadOrders();
  }, [currentUser, role, loadOrders]);

  function handleSelectClient() {
    setRole('client');
    setCustomerTab('menu');
  }

  function handleSelectAdmin() {
    const adminToken = getAdminToken();
    if (adminToken) {
      setIsAdmin(true);
      setRole('admin');
      loadOrders();
    } else {
      setShowAdminModal(true);
    }
  }

  function handleAdminSuccess() {
    setIsAdmin(true);
    setShowAdminModal(false);
    setRole('admin');
    loadOrders();
    triggerToast('Welcome, Tang Hospitality Service!');
  }

  function handleAdminLock() {
    api.lockAdmin();
    setAdminToken(null);
    setIsAdmin(false);
    setRole('none');
    triggerToast('Admin session ended.');
  }

  function handleBackToSelection() {
    setRole('none');
    setIsCartOpen(false);
    setActiveChatOrderId(null);
  }

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
    triggerToast('Order placed! Tang Hospitality Service will confirm shortly.');
  }

  async function handleChatToBook(product: Product) {
    // Guarantee a valid identity token before doing anything
    let user = currentUser;
    if (!user) {
      try {
        user = await ensureIdentity();
        setCurrentUser(user);
      } catch (err) {
        throw new Error('Could not create guest session. Please refresh and try again.');
      }
    }

    // Create order (this also auto-creates the chat thread on the server)
    let order: Order;
    try {
      order = await api.createOrder([{ productId: product.id, quantity: 1 }], 'Chat enquiry');
    } catch (err: any) {
      console.error('createOrder failed:', err);
      throw new Error(err.message || 'Could not create order. Please try again.');
    }

    // Send opening message
    try {
      await api.sendChatMessage(order.id, `Hello! I am interested in "${product.name}". Can you help me?`);
    } catch {
      // Non-fatal: chat thread still opens even if the first message fails
    }

    await loadOrders();
    setActiveChatOrderId(order.id);
    setCustomerTab('orders');
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

  if (role === 'none') {
    return (
      <>
        <RoleSelectionScreen onSelectClient={handleSelectClient} onSelectAdmin={handleSelectAdmin} />
        {showAdminModal && (
          <AdminUnlockModal onClose={() => setShowAdminModal(false)} onSuccess={handleAdminSuccess} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--linen)', color: 'var(--ink)' }}>
      {toast && (
        <div className="fixed top-5 right-5 z-[100] bg-[var(--ink)] text-white px-4 py-3 rounded-xl text-xs font-bold shadow-2xl max-w-xs">
          {toast}
        </div>
      )}

      <header className="sticky top-0 z-40 bg-[var(--cream-card)] border-b border-black/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <button onClick={handleBackToSelection} className="h-9 w-9 bg-[var(--clay)] rounded-xl flex items-center justify-center shadow cursor-pointer hover:opacity-90 transition-opacity shrink-0" title="Back to selection">
                <ChefHat className="h-5 w-5 text-white" />
              </button>
              <div>
                <span className="font-display font-bold text-[var(--ink)] text-sm block">{t('brand')}</span>
                <span className="text-[9px] text-[var(--ink)]/40 uppercase tracking-widest block">
                  {role === 'admin' ? 'Staff Console' : 'Client'}
                </span>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1 bg-black/5 p-1 rounded-xl text-xs font-semibold">
              {role === 'client' ? (
                <>
                  <button onClick={() => setCustomerTab('menu')} className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${customerTab === 'menu' ? 'bg-white shadow text-[var(--ink)] font-bold' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}>Browse</button>
                  <button onClick={() => { setCustomerTab('orders'); loadOrders(); }} className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${customerTab === 'orders' ? 'bg-white shadow text-[var(--ink)] font-bold' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}>{t('myBookings')} ({orders.length})</button>
                </>
              ) : (
                <>
                  <button onClick={() => setAdminTab('catalog')} className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${adminTab === 'catalog' ? 'bg-white shadow text-[var(--ink)] font-bold' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}>{t('manageCatalog')}</button>
                  <button onClick={() => { setAdminTab('orders'); loadOrders(); }} className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${adminTab === 'orders' ? 'bg-white shadow text-[var(--ink)] font-bold' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'}`}>{t('incomingOrders')} ({orders.length})</button>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={toggleLang} className="px-2.5 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all">
                <Globe className="h-3.5 w-3.5" />
                {lang === 'en' ? 'RW' : 'EN'}
              </button>
              {role === 'admin' ? (
                <button onClick={handleAdminLock} className="px-3 py-1.5 bg-red-500 hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all">
                  <LogOut className="h-3.5 w-3.5" />
                  {t('exitAdmin')}
                </button>
              ) : (
                <button onClick={handleBackToSelection} className="px-3 py-1.5 bg-black/5 hover:bg-black/10 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all text-[var(--ink)]/60">
                  <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                  Switch
                </button>
              )}
              {role === 'client' && (
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

        <div className="sm:hidden border-t border-black/5 p-2 flex gap-1">
          {role === 'client' ? (
            <>
              <button onClick={() => setCustomerTab('menu')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${customerTab === 'menu' ? 'bg-[var(--clay)] text-white' : 'bg-black/5 text-[var(--ink)]/60'}`}>Browse</button>
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {role === 'admin' ? (
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

      <footer className="bg-[var(--ink)] text-white/40 text-center text-xs py-6">
        <p className="font-display italic text-white/60">{t('brand')}</p>
        <p className="mt-1">{t('tagline')}</p>
      </footer>

      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl">
            <BookingCart items={cart} onUpdateQuantity={handleUpdateCartQuantity} onRemoveItem={handleRemoveCartItem} onSubmitOrder={handleSubmitOrder} onClose={() => setIsCartOpen(false)} />
          </div>
        </div>
      )}

      {activeChatOrderId && currentUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl">
            <SupportChat orderId={activeChatOrderId} order={activeChatOrder} isAdmin={isAdmin} currentUserId={currentUser.id} onClose={() => setActiveChatOrderId(null)} />
          </div>
        </div>
      )}

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