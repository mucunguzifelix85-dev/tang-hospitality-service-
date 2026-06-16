import { useState } from 'react';
import { Order } from '../types.js';
import { MessageSquare, Check, RefreshCw, Calendar, Truck, ArrowRight, Clock, User } from 'lucide-react';

interface AdminOrdersProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onSelectChat: (orderId: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function AdminOrders({
  orders,
  onUpdateStatus,
  onSelectChat,
  onRefresh,
  loading
}: AdminOrdersProps) {
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Delivered'>('All');

  const filteredOrders = statusFilter === 'All'
    ? orders
    : orders.filter((o) => o.status === statusFilter);

  return (
    <div id="admin-orders-root" className="space-y-6">
      {/* Control Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold font-serif text-slate-900">Incoming Culinary Reservations</h2>
          <p className="text-xs text-slate-500">Track orders and communicate with dining groups live</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Status filtering toggle buttons */}
          <div className="flex bg-slate-50 border border-slate-150 p-1 rounded-xl w-full sm:w-auto text-xs font-semibold">
            {(['All', 'Pending', 'Confirmed', 'Delivered'] as const).map((filter) => (
              <button
                id={`admin-filter-${filter}`}
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-white shadow text-slate-950 font-bold border border-slate-100'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <button
            id="admin-refresh-orders"
            onClick={onRefresh}
            disabled={loading}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-205 text-slate-600 hover:text-slate-950 rounded-xl transition-colors cursor-pointer shrink-0"
            title="Refresh order history"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div id="admin-orders-empty" className="text-center py-16 bg-white border border-dashed border-slate-200 rounded-3xl">
          <p className="text-slate-400 text-sm">No incoming booking requests found matching role selection.</p>
        </div>
      ) : (
        <div id="admin-orders-list" className="grid grid-cols-1 gap-6">
          {filteredOrders.map((order) => (
            <div
              id={`admin-order-card-${order.id}`}
              key={order.id}
              className="bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Card Title Header bar */}
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold font-mono text-slate-950 bg-slate-200 px-2 py-0.5 rounded">
                    {order.id}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <User className="h-3.5 w-3.5 text-amber-500" />
                    <span>{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                    order.status === 'Pending'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : order.status === 'Confirmed'
                      ? 'bg-emerald-55/15 text-emerald-700 border border-emerald-100'
                      : 'bg-blue-50 text-blue-700 border border-blue-105'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Items grid row details */}
              <div className="p-5 flex-1 space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ordered Cuisines</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {order.items.map((item, id) => (
                      <div key={id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover bg-slate-200 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">${item.price.toFixed(2)} &times; {item.quantity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                    <span className="text-[10px] font-bold text-indigo-750 uppercase tracking-wider block">Customer Instruction Flags:</span>
                    <p className="text-xs text-indigo-800/90 mt-0.5 italic">"{order.notes}"</p>
                  </div>
                )}
              </div>

              {/* Actions Footer Bar */}
              <div className="p-4 bg-slate-50/20 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-500">Order Revenue:</span>
                  <span className="text-sm font-mono font-bold text-slate-950">${order.total.toFixed(2)}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Chat helper thread */}
                  <button
                    id={`admin-chat-trigger-${order.id}`}
                    onClick={() => onSelectChat(order.id)}
                    className="flex-1 sm:flex-initial py-2 px-3 bg-indigo-600 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-indigo-100"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Converse with Guest</span>
                  </button>

                  <div className="flex items-center border border-slate-200 bg-white rounded-xl p-0.5">
                    {order.status === 'Pending' && (
                      <button
                        id={`status-confirm-btn-${order.id}`}
                        onClick={() => onUpdateStatus(order.id, 'Confirmed')}
                        className="py-1 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Confirm Reservation</span>
                      </button>
                    )}

                    {order.status === 'Confirmed' && (
                      <button
                        id={`status-deliver-btn-${order.id}`}
                        onClick={() => onUpdateStatus(order.id, 'Delivered')}
                        className="py-1 px-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-0.5 cursor-pointer"
                      >
                        <Truck className="h-3.5 w-3.5" />
                        <span>Deliver &amp; Serve</span>
                      </button>
                    )}

                    {order.status === 'Delivered' && (
                      <span className="py-1 px-3 text-[10px] text-slate-400 font-bold flex items-center gap-1 uppercase tracking-wider">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        Served Successfully
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
