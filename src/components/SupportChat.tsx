import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { Order, Message } from '../types.js';
import { useLang } from '../i18n/LangContext.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { Send, ChefHat, Check, CheckCheck } from 'lucide-react';

interface SupportChatProps {
  orderId: string;
  order: Order | undefined;
  isAdmin: boolean;
  currentUserId: string;
  onClose: () => void;
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (isSameDay(date, today)) return 'Today';
  if (isSameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

export function SupportChat({ orderId, order, isAdmin, currentUserId, onClose }: SupportChatProps) {
  const { t } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastCountRef = useRef(0);

  async function fetchMessages(isFirst = false) {
    try {
      const data = await api.getChatMessages(orderId);
      const incoming = data.messages || [];
      setMessages(incoming);
      if (isFirst) setInitialLoad(false);
      lastCountRef.current = incoming.length;
    } catch (err) {
      console.error('Failed to poll chat:', err);
      if (isFirst) setInitialLoad(false);
    }
  }

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const body = inputText.trim();
    if (!body || sending) return;
    setInputText('');
    setSending(true);

    const optimistic: Message = {
      id: 'temp-' + Date.now(),
      senderId: isAdmin ? 'admin' : currentUserId,
      senderName: isAdmin ? 'Tang Hospitality Service' : 'You',
      senderRole: isAdmin ? 'admin' : 'customer',
      text: body,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      const newMsg = await api.sendChatMessage(orderId, body);
      setMessages(prev => prev.map(m => (m.id === optimistic.id ? newMsg : m)));
    } catch (err) {
      console.error('Could not send message:', err);
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInputText(body);
    } finally {
      setSending(false);
    }
  }

  const grouped: { type: 'day' | 'msg'; date?: string; msg?: Message }[] = [];
  let lastDay = '';
  for (const m of messages) {
    const day = new Date(m.timestamp).toDateString();
    if (day !== lastDay) {
      grouped.push({ type: 'day', date: m.timestamp });
      lastDay = day;
    }
    grouped.push({ type: 'msg', msg: m });
  }

  return (
    <div
      id="support-chat-root"
      className="flex flex-col h-[78vh] sm:h-[70vh] rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#e9ddc8' }}
    >
      <div className="bg-[var(--ink)] text-white p-3.5 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 bg-[var(--clay)] rounded-full flex items-center justify-center shrink-0">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold font-display truncate">
              {isAdmin ? (order ? order.customerName : 'Customer') : t('brand')}
            </h3>
            <p className="text-[10px] text-white/50 font-mono flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
              {orderId}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-2xl font-light cursor-pointer leading-none px-2 shrink-0"
        >
          &times;
        </button>
      </div>

      {order && (
        <div className="bg-black/[0.06] border-b border-black/5 px-3.5 py-2 flex justify-between items-center text-xs text-[var(--ink)]/70 shrink-0">
          <div>
            <span className="font-semibold">{t('orderStatus')}:</span>{' '}
            <span className="px-2 py-0.5 bg-white border border-black/10 rounded font-mono font-bold text-[var(--clay)] text-[10px]">
              {order.status}
            </span>
          </div>
          <div className="text-[11px] font-mono">
            {formatRWF(order.totalRWF)} <span className="text-[var(--ink)]/40">. {formatUSD(order.totalUSD)}</span>
          </div>
        </div>
      )}

      <div
        id="messages-viewport"
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20px 20px, rgba(0,0,0,0.035) 2px, transparent 0), radial-gradient(circle at 60px 60px, rgba(0,0,0,0.025) 2px, transparent 0)',
          backgroundSize: '80px 80px'
        }}
      >
        {initialLoad ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-7 w-7 border-2 border-[var(--clay)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[var(--ink)]/40">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 px-8">
            <div className="h-14 w-14 rounded-full bg-black/5 flex items-center justify-center mb-1">
              <ChefHat className="h-7 w-7 text-black/20" />
            </div>
            <p className="text-xs font-semibold text-[var(--ink)]/40">No messages yet. Say hello!</p>
          </div>
        ) : (
          grouped.map((item, idx) => {
            if (item.type === 'day') {
              return (
                <div key={'day-' + idx} className="flex justify-center my-3">
                  <span className="bg-white/80 text-[var(--ink)]/50 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                    {formatDayLabel(item.date!)}
                  </span>
                </div>
              );
            }

            const msg = item.msg!;
            const isMe = isAdmin ? msg.senderRole === 'admin' : msg.senderId === currentUserId;
            const isSystem = msg.senderId === 'system';
            const isPending = msg.id.startsWith('temp-');

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-[var(--gold)]/15 border border-[var(--gold)]/25 text-[var(--gold)] text-[11px] px-3.5 py-2 rounded-xl max-w-[85%] text-center font-medium leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                id={`chat-bubble-${msg.id}`}
                key={msg.id}
                className={`flex gap-2 mb-1.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="h-7 w-7 rounded-full bg-[var(--ink)] text-white text-[10px] font-bold flex items-center justify-center shrink-0 self-end mb-1">
                    {msg.senderName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div
                  className={`relative max-w-[75%] px-3 py-2 text-[13px] leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-[var(--clay)] text-white rounded-2xl rounded-br-md'
                      : 'bg-white text-[var(--ink)] rounded-2xl rounded-bl-md'
                  } ${isPending ? 'opacity-60' : ''}`}
                >
                  {!isMe && (
                    <div className="text-[10px] font-bold text-[var(--clay)] mb-0.5">{msg.senderName}</div>
                  )}
                  <div className="break-words whitespace-pre-wrap pr-10">{msg.text}</div>
                  <div
                    className={`absolute bottom-1 right-2.5 flex items-center gap-0.5 text-[9px] ${
                      isMe ? 'text-white/70' : 'text-[var(--ink)]/35'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (isPending ? <Check className="h-3 w-3" /> : <CheckCheck className="h-3 w-3" />)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-[var(--cream-card)] border-t border-black/5 flex items-center gap-2 shrink-0"
      >
        <input
          id="chat-text-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('typeMessage')}
          autoComplete="off"
          className="flex-1 py-2.5 px-4 border border-black/10 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)] transition-all bg-white"
        />
        <button
          id="submit-chat-msg-btn"
          type="submit"
          disabled={sending || !inputText.trim()}
          className="h-10 w-10 flex items-center justify-center bg-[var(--clay)] hover:opacity-90 text-white rounded-full transition-all cursor-pointer shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}