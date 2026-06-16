import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api.js';
import { Order, Message } from '../types.js';
import { MessageSquare, Send, Calendar, Clock, Smile, Sparkles, ChefHat } from 'lucide-react';

interface SupportChatProps {
  orderId: string;
  order: Order | undefined;
  currentUserRole: 'customer' | 'admin';
  currentUserId: string;
  onClose: () => void;
}

export function SupportChat({
  orderId,
  order,
  currentUserRole,
  currentUserId,
  onClose
}: SupportChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [pollingRate, setPollingRate] = useState(3000); // Poll every 3 seconds for simulated live dialogue
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat messages and scroll to bottom
  async function fetchMessages() {
    try {
      const data = await api.getChatMessages(orderId);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to poll support details:', err);
    }
  }

  // Effect to pull messages on load and setup polling
  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, pollingRate);
    return () => clearInterval(interval);
  }, [orderId, pollingRate]);

  // Handle messages scrolling
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText || inputText.trim() === '') return;
    const body = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const newMsg = await api.sendChatMessage(orderId, body);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('We could not dispatch message:', err);
    } finally {
      setSending(false);
    }
  }

  // Suggest quick messages to tap on
  const customerSuggestions = [
    "Could I add some additional orders or items to this request?",
    "Is it possible to request seating outdoors for our reservation?",
    "Please flag a peanut and tree nut allergy to the kitchen crew."
  ];

  const adminSuggestions = [
    "Hello! Our chef has accepted your custom cooking requests.",
    "Your spectacular dinner is ready to be served!",
    "Would you like us to arrange a corresponding dessert wine?"
  ];

  const suggestions = currentUserRole === 'admin' ? adminSuggestions : customerSuggestions;

  async function sendQuickSuggestion(text: string) {
    if (sending) return;
    setSending(true);
    try {
      const newMsg = await api.sendChatMessage(orderId, text);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('We could not dispatch quick suggestion:', err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div id="support-chat-root" className="flex flex-col h-[70vh] bg-white border border-slate-150 rounded-2xl overflow-hidden shadow-xl shadow-slate-100/50">
      {/* Thread Title Header */}
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/15">
            <ChefHat className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold font-serif">Le Petit Bistro Staff</h3>
              <span className="h-2 w-2 bg-emerald-500 rounded-full animate-ping"></span>
            </div>
            <p className="text-[10px] text-slate-300 font-mono">Order Conversation: {orderId}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-amber-500 uppercase font-bold tracking-widest hidden sm:inline-block">
            {currentUserRole === 'admin' ? 'Co-working Portal' : 'Support Live'}
          </span>
          <button
            id="close-chat-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-semibold text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Associated Order Detail Summary */}
      {order && (
        <div className="bg-slate-50 border-b border-slate-100 p-3 flex justify-between items-center text-xs text-slate-600 shrink-0">
          <div>
            <span className="font-semibold text-slate-800">Booking Status:</span>{' '}
            <span className="px-2 py-0.5 bg-white border border-slate-150 rounded font-mono font-bold text-amber-600 text-[10px]">
              {order.status}
            </span>
          </div>
          <div className="text-[11px] font-mono">
            {order.items.reduce((sum, item) => sum + item.quantity, 0)} Items •{' '}
            <span className="font-bold text-slate-900">${order.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Message scroll viewport container */}
      <div
        id="messages-viewport"
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-2">
            <MessageSquare className="h-8 w-8 text-slate-300 animate-bounce" />
            <p className="text-xs font-semibold text-slate-400">Conversancy starting...</p>
            <p className="text-[10px] text-slate-400">Loading live order discussion details.</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.senderId === currentUserId;
            const isSystem = msg.senderId === 'system';
            
            if (isSystem) {
              return (
                <div
                  key={msg.id || i}
                  className="flex justify-center"
                >
                  <div className="bg-amber-500/5 border border-amber-500/10 text-amber-700 text-[10px] px-3.5 py-2 rounded-xl max-w-md text-center font-medium leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div
                id={`chat-bubble-${msg.id}`}
                key={msg.id || i}
                className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                {!isMe && (
                  <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-755 text-xs font-bold flex items-center justify-center shrink-0">
                    {msg.senderName.substring(0, 2).toUpperCase()}
                  </div>
                )}

                <div className="space-y-1 max-w-[70%]">
                  <div className="flex items-center gap-1.5 px-0.5">
                    <span className="text-[10px] font-bold text-slate-600">
                      {isMe ? 'You' : msg.senderName}
                    </span>
                    <span className="text-[8px] text-slate-400 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
                    isMe
                      ? 'bg-amber-500 text-white rounded-tr-none shadow-md shadow-amber-500/10 font-medium'
                      : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Suggested quick templates */}
      <div className="bg-slate-50 p-2 border-t border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0">
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-1 shrink-0 flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-amber-500" />
          Quick replies:
        </span>
        {suggestions.map((s, idx) => (
          <button
            id={`chat-suggestion-${idx}`}
            key={idx}
            onClick={() => sendQuickSuggestion(s)}
            className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 hover:text-amber-600 hover:border-amber-300 rounded-full text-[10px] whitespace-nowrap transition-colors cursor-pointer"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Sending inputs bar */}
      <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-150 flex items-center gap-2 shrink-0">
        <input
          id="chat-text-input"
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Type message to ${currentUserRole === 'admin' ? 'confirm details with guest...' : 'consult Le Petit Bistro staff...'}`}
          className="flex-1 py-2 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all text-slate-900"
        />
        <button
          id="submit-chat-msg-btn"
          type="submit"
          className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all cursor-pointer shadow shadow-amber-500/10 shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
