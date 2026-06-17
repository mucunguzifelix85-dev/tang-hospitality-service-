import { Order } from '../types.js';
import { useLang } from '../i18n/LangContext.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { MessageSquare, RefreshCw, PackageOpen, Clock, CheckCircle2, Truck } from 'lucide-react';

interface CustomerOrdersProps {
  orders: Order[];
  onRefresh: () => void;
  onSelectChat: (orderId: string) => void;
  loading: boolean;
}

const STATUS_STYLE: Record<Order['status'], { bg: string; icon: React.ReactNode }> = {
  Pending: { bg: 'bg-[var(--gold)]/10 text-[var(--gold)] border-[var(--gold)]/20', icon: <Clock className="h-3.5 w-3.5" /> },
  Confirmed: { bg: 'bg-[var(--sage)]/10 text-[var(--sage)] border-[var(--sage)]/20', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  Delivered: { bg: 'bg-black/5 text-[var(--ink)]/60 border-black/10', icon: <Truck className="h-3.5 w-3.5" /> }
};

export function CustomerOrders({ orders, onRefresh, onSelectChat, loading }: CustomerOrdersProps) {
  const { t } = useLang();
  const sorted = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div id="customer-orders-root" className="space-y-4">
      <div className="flex justify-between items-center bg-[var(--cream-card)] p-4 rounded-2xl border border-black/5 shadow-sm">
        <h2 className="text-sm font-bold font-display text-[var(--ink)]">{t('yourOrders')}</h2>
        <button
          id="refresh-orders-btn"
          onClick={onRefresh}
          className="p-2 bg-black/5 hover:bg-black/10 text-[var(--ink)]/60 rounded-xl transition-all cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 bg-[var(--cream-card)] border border-dashed border-black/10 rounded-3xl">
          <PackageOpen className="h-8 w-8 text-black/15 mx-auto mb-2" />
          <p className="text-[var(--ink)]/40 text-sm">{t('noOrders')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map(order => (
            <div key={order.id} id={`order-card-${order.id}`} className="bg-[var(--cream-card)] p-4 rounded-2xl border border-black/5 shadow-sm">
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <span className="text-[10px] font-mono text-[var(--ink)]/40">{order.id}</span>
                  <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${STATUS_STYLE[order.status].bg}`}>
                    {STATUS_STYLE[order.status].icon}
                    {order.status}
                  </div>
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

              <button
                id={`open-chat-${order.id}`}
                onClick={() => onSelectChat(order.id)}
                className="mt-3 w-full py-2 bg-[var(--clay)]/10 hover:bg-[var(--clay)]/15 text-[var(--clay)] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {t('chat')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
