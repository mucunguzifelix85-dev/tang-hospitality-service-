import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { Order, Message } from '../types.js';
import { useLang } from '../i18n/LangContext.js';
import { formatRWF, formatUSD } from '../lib/currency.js';
import { MessageSquare, Send, ChefHat } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  async function fetchMessages() {
    try {
      const data = await api.getChatMessages(orderId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to poll chat:', err);
    }
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;
    const body = inputText.trim();
    setInputText('');
    setSending(true);
    try {
      const newMsg = await api.sendChatMessage(orderId, body);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Could not send message:', err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div id="support-chat-root" className="flex flex-col h-[70vh] bg-[var(--cream-card)] rounded-2xl overflow-hidden">
      <div className="bg-[var(--ink)] text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[var(--clay)] rounded-full flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold font-display">{t('brand')}</h3>
            <p className="text-[10px] text-white/50 font-mono">{orderId}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/50 hover:text-white text-lg font-bold cursor-pointer">&times;</button>
      </div>

      {order && (
        <div className="bg-black/[0.03] border-b border-black/5 p-3 flex justify-between items-center text-xs text-[var(--ink)]/70 shrink-0">
          <div>
            <span className="font-semibold">{t('orderStatus')}:</span>{' '}
            <span className="px-2 py-0.5 bg-white border border-black/10 rounded font-mono font-bold text-[var(--clay)] text-[10px]">{order.status}</span>
          </div>
          <div className="text-[11px] font-mono">
            {formatRWF(order.totalRWF)} <span className="text-[var(--ink)]/40">. {formatUSD(order.totalUSD)}</span>
          </div>
        </div>
      )}

      <div id="messages-viewport" ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/[0.015]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <MessageSquare className="h-8 w-8 text-black/15" />
            <p className="text-xs font-semibold text-[var(--ink)]/40">Loading conversation...</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = isAdmin ? msg.senderRole === 'admin' : msg.senderId === currentUserId;
            const isSystem = msg.senderId === 'system';

            if (isSystem) {
              return (
                <div key={msg.id || i} className="flex justify-center">
                  <div className="bg-[var(--gold)]/10 border border-[var(--gold)]/20 text-[var(--gold)] text-[10px] px-3.5 py-2 rounded-xl max-w-md text-center font-medium leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div id={`chat-bubble-${msg.id}`} key={msg.id || i} className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                {!isMe && (
                  <div className="h-8 w-8 rounded-full bg-black/10 text-[var(--ink)] text-xs font-bold flex items-center justify-center shrink-0">
                    {msg.senderName.substring(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="space-y-1 max-w-[70%]">
                  <div className="flex items-center gap-1.5 px-0.5">
                    <span className="text-[10px] font-bold text-[var(--ink)]/60">{isMe ? 'You' : msg.senderName}</span>
                    <span className="text-[8px] text-[var(--ink)]/30 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe ? 'bg-[var(--clay)] text-white rounded-tr-none' : 'bg-white border border-black/10 text-[var(--ink)] rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSendMessage} className="p-3 bg-[var(--cream-card)] border-t border-black/5 flex items-center gap-2 shrink-0">
        <input
          id="chat-text-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('typeMessage')}
          className="flex-1 py-2 px-3 border border-black/10 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/15 focus:border-[var(--clay)] transition-all bg-white"
        />
        <button id="submit-chat-msg-btn" type="submit" disabled={sending} className="p-2 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl transition-all cursor-pointer shrink-0 disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
