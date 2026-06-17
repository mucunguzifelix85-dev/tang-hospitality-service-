import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { Order, Message } from '../types.js';
import { useLang } from '../i18n/LangContext.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { Send, ChefHat, AlertCircle, Check, CheckCheck } from 'lucide-react';

interface SupportChatProps {
  orderId: string;
  order: Order | undefined;
  isAdmin: boolean;
  currentUserId: string;
  onClose: () => void;
}

export function SupportChat({ orderId, order, isAdmin, currentUserId, onClose }: SupportChatProps) {
  const { t } = useLang();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [sendError, setSendError] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchMessages(isFirstLoad = false) {
    try {
      const data = await api.getChatMessages(orderId);
      setMessages(data.messages || []);
      setLoadError('');
    } catch (err: any) {
      setLoadError(err.message || 'Could not load conversation.');
    } finally {
      if (isFirstLoad) setInitialLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const body = inputText.trim();
    if (!body) return;

    setSendError('');
    setSending(true);

    const optimisticId = 'pending-' + Date.now();
    const optimisticMsg: Message = {
      id: optimisticId,
      senderId: isAdmin ? 'admin' : currentUserId,
      senderName: isAdmin ? 'Tang Hospitality Service' : 'You',
      senderRole: isAdmin ? 'admin' : 'customer',
      text: body,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setInputText('');

    try {
      const newMsg = await api.sendChatMessage(orderId, body);
      setMessages(prev => prev.map(m => (m.id === optimisticId ? newMsg : m)));
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setSendError(err.message || 'Message failed to send. Please try again.');
      setInputText(body);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      id="support-chat-root"
      className="flex flex-col h-[78vh] sm:h-[70vh] rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#E5DDD0' }}
    >
      <div className="bg-[var(--ink)] text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 bg-[var(--clay)] rounded-full flex items-center justify-center shrink-0">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold font-display truncate">{t('brand')}</h3>
            <p className="text-[10px] text-white/50 font-mono truncate">{orderId}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white/60 hover:text-white text-xl font-bold cursor-pointer shrink-0 px-2"
        >
          &times;
        </button>
      </div>

      {order && (
        <div className="bg-white/70 border-b border-black/5 px-4 py-2 flex justify-between items-center text-xs text-[var(--ink)]/70 shrink-0">
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

      {loadError && (
        <div className="bg-red-50 border-b border-red-200 text-red-700 text-xs px-4 py-2 flex items-center gap-1.5 shrink-0">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <div
        id="messages-viewport"
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-2"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)",
          backgroundSize: '20px 20px'
        }}
      >
        {initialLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <div className="h-6 w-6 border-2 border-[var(--clay)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold text-[var(--ink)]/40">Loading conversation...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2 px-6">
            <div className="h-12 w-12 rounded-full bg-white/70 flex items-center justify-center">
              <ChefHat className="h-6 w-6 text-[var(--clay)]/50" />
            </div>
            <p className="text-xs font-semibold text-[var(--ink)]/40">
              No messages yet. Say hello to start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = isAdmin ? msg.senderRole === 'admin' : msg.senderId === currentUserId;
            const isSystem = msg.senderId === 'system';
            const isPending = msg.id.startsWith('pending-');

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <div className="bg-[var(--gold)]/15 border border-[var(--gold)]/25 text-[#7a5a14] text-[10.5px] px-3.5 py-2 rounded-xl max-w-md text-center font-medium leading-relaxed shadow-sm">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`relative max-w-[78%] sm:max-w-[65%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    isMine
                      ? 'bg-[#DCF8C6] text-[#111] rounded-tr-sm'
                      : 'bg-white text-[#111] rounded-tl-sm'
                  } ${isPending ? 'opacity-60' : ''}`}
                >
                  {!isMine && (
                    <div className="text-[10.5px] font-bold mb-0.5" style={{ color: 'var(--clay)' }}>
                      {msg.senderName}
                    </div>
                  )}
                  <div className="whitespace-pre-wrap break-words pr-10">{msg.text}</div>
                  <div className="flex items-center justify-end gap-1 mt-1 -mb-0.5">
                    <span className="text-[10px] text-black/35">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMine && (
                      isPending ? (
                        <Check className="h-3 w-3 text-black/30" />
                      ) : (
                        <CheckCheck className="h-3 w-3 text-[#4FC3F7]" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {sendError && (
        <div className="bg-red-50 border-t border-red-200 text-red-700 text-xs px-4 py-2 flex items-center gap-1.5 shrink-0">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{sendError}</span>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="p-2.5 sm:p-3 bg-[var(--cream-card)] border-t border-black/5 flex items-center gap-2 shrink-0"
      >
        <input
          id="chat-text-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('typeMessage')}
          className="flex-1 py-2.5 px-4 border border-black/10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)] transition-all bg-white"
        />
        <button
          id="submit-chat-msg-btn"
          type="submit"
          disabled={sending || !inputText.trim()}
          className="h-10 w-10 flex items-center justify-center bg-[var(--clay)] hover:opacity-90 text-white rounded-full transition-all cursor-pointer shrink-0 disabled:opacity-40"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
}