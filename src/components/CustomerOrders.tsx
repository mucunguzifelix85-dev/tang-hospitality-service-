import { Order } from '../types.js';
import { MessageSquare, RefreshCw, Calendar, CheckCircle2, Truck, HelpCircle } from 'lucide-react';

interface CustomerOrdersProps {
  orders: Order[];
  onRefresh: () => void;
  onSelectChat: (orderId: string) => void;
  loading: boolean;
}

export function CustomerOrders({
  orders,
  onRefresh,
  onSelectChat,
  loading
}: CustomerOrdersProps) {
  
  function getStatusStyle(status: Order['status']) {
    switch (status) {
      case 'Pending':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
          text: 'Pending Review',
          color: 'text-amber-500'
        };
      case 'Confirmed':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          text: 'Preparing / Confirmed',
          color: 'text-emerald-500'
        };
      case 'Delivered':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-100',
          text: 'Served / Delivered',
          color: 'text-blue-500'
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-755 border-slate-100',
          text: 'Unknown',
          color: 'text-slate-500'
        };
    }
  }

  function getStatusIcon(status: Order['status']) {
    switch (status) {
      case 'Pending':
        return <RefreshCw className="h-4 w-4 animate-spin text-amber-500" />;
      case 'Confirmed':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'Delivered':
        return <Truck className="h-4 w-4 text-blue-500" />;
      default:
        return <HelpCircle className="h-4 w-4 text-slate-500" />;
    }
  }

  return (
    <div id="customer-orders-panel" className="space-y-4">
      {/* Header element */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">Your Booking History</h2>
          <p className="text-[11px] text-slate-400">Track and request modifications live with staff</p>
        </div>
        <button
          id="refresh-orders-btn"
          onClick={onRefresh}
          disabled={loading}
          className="p-1.5 hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-xs font-medium">Refresh</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <div id="bookings-empty-state" className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-2xl">
          <p className="text-slate-400 text-sm">You haven't placed any culinary requests yet.</p>
          <p className="text-[11px] text-slate-400 mt-1">Book an order to initiate a live consultation thread with the chef!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusConfig = getStatusStyle(order.status);
            return (
              <div
                id={`customer-order-card-${order.id}`}
                key={order.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Top header row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Booking ID:
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-950 bg-slate-100 px-2 py-0.5 rounded">
                        {order.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${statusConfig.bg} flex items-center gap-1.5`}>
                      {getStatusIcon(order.status)}
                      <span>{statusConfig.text}</span>
                    </div>
                  </div>
                </div>

                {/* Items container list */}
                <div className="py-4 space-y-3">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Booked Items</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 bg-slate-50/50 p-2 rounded-xl border border-slate-100/40">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover bg-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">${item.price.toFixed(2)} &times; {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="mt-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/10">
                      <p className="text-[11px] font-semibold text-amber-800">Dining Instruction Details:</p>
                      <p className="text-xs text-amber-700/90 mt-0.5 italic">"{order.notes}"</p>
                    </div>
                  )}
                </div>

                {/* Card Actions bottom bar */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Total Reservation Value</span>
                    <span className="text-sm font-mono font-bold text-slate-950">${order.total.toFixed(2)}</span>
                  </div>

                  <button
                    id={`order-chat-trigger-${order.id}`}
                    onClick={() => onSelectChat(order.id)}
                    className="py-1.5 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>Converse with Staff</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
