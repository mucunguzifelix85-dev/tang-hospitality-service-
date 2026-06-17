import { Order } from '../types.js';
import { useLang } from '../i18n/LangContext.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { MessageSquare, RefreshCw, PackageOpen } from 'lucide-react';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onSelectChat: (orderId: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

const STATUSES: Order['status'][] = ['Pending', 'Confirmed', 'Delivered'];

export function AdminOrders({ orders, onUpdateStatus, onSelectChat, onRefresh, loading }: AdminOrdersProps) {
  const { t } = useLang();
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div id="admin-orders-root" className="space-y-4">
      <div className="flex justify-between items-center bg-[var(--cream-card)] p-4 rounded-2xl border border-black/5 shadow-sm">
        <h2 className="text-sm font-bold font-display text-[var(--ink)]">{t('incomingOrders')}</h2>
        <button onClick={onRefresh} className="p-2 bg-black/5 hover:bg-black/10 text-[var(--ink)]/60 rounded-xl transition-all cursor-pointer">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-[var(--cream-card)] border border-dashed border-black/10 rounded-3xl">
          <PackageOpen className="h-8 w-8 text-black/15 mx-auto mb-2" />
          <p className="text-[var(--ink)]/40 text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(order => (
            <div key={order.id} id={`admin-order-card-${order.id}`} className="bg-[var(--cream-card)] p-4 rounded-2xl border border-black/5 shadow-sm">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] font-mono text-[var(--ink)]/40">{order.id}</span>
                  <div className="text-sm font-bold text-[var(--ink)]">{order.customerName}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-[var(--gold)] text-sm">{formatRWF(order.totalRWF)}</div>
                  <div className="font-mono text-[10px] text-[var(--ink)]/40">{formatUSD(order.totalUSD)}</div>
                </div>
              </div>

              <div className="mt-3 space-y-1">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs text-[var(--ink)]/70">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-mono">{formatRWF(item.priceRWF * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {order.notes && (
                <p className="mt-2 text-[11px] text-[var(--ink)]/50 italic bg-black/[0.03] p-2 rounded-lg">{order.notes}</p>
              )}

              <button
                id={`admin-open-chat-${order.id}`}
                onClick={() => onSelectChat(order.id)}
                className="mt-3 w-full py-2.5 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Chat with {order.customerName}</span>
              </button>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-[var(--ink)]/40 uppercase tracking-wider mr-1">
                  {t('orderStatus')}:
                </span>
                <div className="flex gap-1 bg-black/5 p-1 rounded-xl">
                  {STATUSES.map(status => (
                    <button
                      key={status}
                      id={`status-btn-${order.id}-${status}`}
                      onClick={() => onUpdateStatus(order.id, status)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        order.status === status ? 'bg-[var(--clay)] text-white' : 'text-[var(--ink)]/50 hover:text-[var(--ink)]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}