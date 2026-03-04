
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2 } from 'lucide-react';
import { askRit } from '../services/geminiService';
import { Announcement, RondaSchedule, Official } from '../types';
import { RT_NAME } from '../constants';

interface ChatBotProps {
  announcements: Announcement[];
  ronda: RondaSchedule[];
  officials: Official[];
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatBot: React.FC<ChatBotProps> = ({ announcements, ronda, officials }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Halo! Saya Rit, asisten virtual ${RT_NAME}. Ada yang bisa saya bantu? Tanyakan soal jadwal ronda, iuran, atau pengumuman.`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Call Gemini Service with dynamic officials
      const answer = await askRit(input, { announcements, ronda, officials });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: answer,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Maaf, terjadi gangguan koneksi.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 md:bottom-10 md:right-10 z-50 p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center border-2 border-white ${
          isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-cyan-500/50'
        }`}
        aria-label="Chat dengan AI"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} fill="currentColor" />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-36 right-4 md:bottom-28 md:right-10 z-[55] w-[90vw] md:w-[350px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
        }`}
        style={{ height: '500px', maxHeight: '70vh' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-blue to-cyan-500 p-4 flex items-center gap-3 text-white shadow-md z-10">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Rit - Asisten RT</h3>
            <p className="text-[10px] text-blue-50 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_5px_#34d399]"></span> Online
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-slate-100 shadow-sm ${
                msg.sender === 'user' ? 'bg-white' : 'bg-brand-blue text-white'
              }`}>
                {msg.sender === 'user' ? <User size={14} className="text-slate-600" /> : <Bot size={14} />}
              </div>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-800 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-bl-none'
                }`}
              >
                {/* Simple Markdown parsing for bold text */}
                <span dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex items-center gap-2 animate-fade-in">
                <div className="w-8 h-8 bg-brand-blue text-white rounded-full flex items-center justify-center shadow-sm"><Bot size={14}/></div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm">
                   <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                   </div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
          <input
            type="text"
            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            placeholder="Tanya Rit sesuatu..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="p-2.5 bg-brand-blue text-white rounded-full hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 active:scale-90"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin"/> : <Send size={18} />}
          </button>
        </form>
      </div>
    </>
  );
};
