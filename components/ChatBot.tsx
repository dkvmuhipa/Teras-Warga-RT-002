import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles, RefreshCw, Sliders, Cpu, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { askRit } from '../services/geminiService';
import { getLocalAiStatus, getOllamaConfig, setOllamaConfig, LocalAiStatus } from '../services/localAiService';
import { Announcement, RondaSchedule, Official, House, CashFlow, Report } from '../types';
import { RT_NAME } from '../constants';

interface ChatBotProps {
  announcements: Announcement[];
  ronda: RondaSchedule[];
  officials: Official[];
  houses?: House[];
  cashFlow?: CashFlow[];
  reports?: Report[];
  settings?: any;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const SUGGESTIONS = [
  { text: 'Apa saja syarat mengurus Surat Pengantar RT?', label: '📋 Syarat Surat RT', icon: 'FileText', color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300' },
  { text: 'Apakah ada info pemadaman listrik PLN atau air PDAM hari ini?', label: '⚡ Info Pemadaman PLN', icon: 'Zap', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 hover:border-amber-300' },
  { text: 'Bisa carikan tukang bangunan atau teknisi AC di RT 02?', label: '🛠️ Cari Jasa & Tukang', icon: 'Wrench', color: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100 hover:border-sky-300' },
  { text: 'Berapa nominal iuran bulanan warga RT 02?', label: '💰 Iuran & Kas RT', icon: 'Wallet', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300' },
  { text: 'Siapa jadwal ronda malam hari ini?', label: '👮 Jadwal Ronda Malam', icon: 'Shield', color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300' },
  { text: 'Kapan jadwal pengangkutan sampah lingkungan?', label: '🗑️ Jadwal Sampah', icon: 'Trash2', color: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300' },
  { text: 'Minta nomor telepon darurat & kontak Pengurus RT', label: '📞 Nomor Darurat & RT', icon: 'Phone', color: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100 hover:border-teal-300' },
  { text: 'Bagaimana tata tertib tamu menginap lebih dari 24 jam?', label: '📑 Aturan Lapor Tamu', icon: 'BookOpen', color: 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200' },
];

export const ChatBot: React.FC<ChatBotProps> = ({ announcements, ronda, officials, houses, cashFlow, reports, settings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'default-1',
      text: `Halo warga! Saya **Rit**, Asisten Virtual Cerdas ${RT_NAME} 🤖✨\n\nAda yang bisa saya bantu carikan informasinya? Anda bisa menanyakan langsung hal-hal penting seputar:\n- **Jadwal ronda malam** hari ini\n- **Iuran warga** bulanan & detail kas\n- **Syarat berkas** pengurusan Surat Pengantar RT\n- **Kontak pengurus** yang bisa Anda hubungi\n- **Jadwal angkutan** bak sampah lingkungan\n\nSilakan klik salah satu tombol saran pertanyaan cepat di bawah atau ketik langsung pertanyaan Anda!`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showAiConfig, setShowAiConfig] = useState(false);
  const [aiStatus, setAiStatus] = useState<LocalAiStatus | null>(null);
  const [ollamaUrlInput, setOllamaUrlInput] = useState(() => getOllamaConfig().url);
  const [ollamaModelInput, setOllamaModelInput] = useState(() => getOllamaConfig().model);
  const [configSaved, setConfigSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      getLocalAiStatus().then(setAiStatus).catch(() => {});
    }
  }, [isOpen]);

  const handleSaveOllamaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setOllamaConfig(ollamaUrlInput, ollamaModelInput);
    const updated = await getLocalAiStatus();
    setAiStatus(updated);
    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      setShowAiConfig(false);
    }, 1200);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const answer = await askRit(textToSend, { announcements, ronda, officials, houses, cashFlow, reports, settings });

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
        text: "Maaf warga, koneksi rit sedang sibuk. Silakan kirimkan ulang atau tanya pengurus RT ya.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const pendingText = input;
    setInput('');
    handleSendMessage(pendingText);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    if (isTyping) return;
    handleSendMessage(suggestionText);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        text: `Percakapan telah disegarkan! 🔄✨\n\nHalo lagi, saya **Rit**, Asisten Cerdas Anda. Ada hal baru yang bisa saya bantu carikan hari ini? Silakan pilih tombol saran cepat di bawah atau bisa langsung ketik pertanyaan Bapak/Ibu!`,
        sender: 'bot',
        timestamp: new Date()
      }
    ]);
  };

  const renderMessageText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1.5 break-words">
        {lines.map((line, idx) => {
          // Check if line is bullet list
          const isListItem = line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*');
          const isHeader = line.trim().startsWith('###') || line.trim().startsWith('##');
          
          let cleanedLine = line;
          if (isListItem) {
            cleanedLine = line.replace(/^\s*[-•*]\s*/, '');
          } else if (isHeader) {
            cleanedLine = line.replace(/^\s*#{2,3}\s*/, '');
          }

          // Render bold parts: split by **
          const parts = cleanedLine.split(/(\*\*.*?\*\*)/g);
          const processedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-bold text-slate-900 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100/50">{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          if (isListItem) {
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 my-1">
                <span className="text-indigo-500 text-[10px] mt-1.5 shrink-0 select-none">✦</span>
                <span className="text-slate-700 leading-relaxed text-[13px]">{processedLine}</span>
              </div>
            );
          }

          if (isHeader) {
            return (
              <h4 key={idx} className="font-bold text-indigo-900 border-b border-indigo-50/50 pb-1 mt-3 mb-1 text-[13px]">
                {processedLine}
              </h4>
            );
          }

          if (line.trim() === '') {
            return <div key={idx} className="h-1.5" />;
          }

          return (
            <p key={idx} className="text-slate-700 leading-relaxed text-[13px]">
              {processedLine}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Trigger floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 md:bottom-10 md:right-10 z-[60] p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center border-2 border-white/80 cursor-pointer ${
          isOpen 
            ? 'bg-slate-900 text-white shadow-slate-900/40 rotate-180' 
            : 'bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-500 text-white hover:shadow-indigo-500/50'
        }`}
        aria-label="Tanya Asisten AI Lokal"
      >
        {isOpen ? (
          <X size={26} />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare size={24} fill="currentColor" />
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5">
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
            </span>
          </div>
        )}
      </button>

      {/* Modern Chat Window Container with Spring Physics */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-22 sm:bottom-24 right-3 sm:right-6 md:bottom-28 md:right-10 z-[95] w-[calc(100vw-1.5rem)] sm:w-[380px] max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            style={{ height: '520px', maxHeight: 'calc(100dvh - 7rem)' }}
          >
            {/* Header branding with Local AI Engine status */}
            <div className="bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-500 p-4 shrink-0 flex items-center justify-between text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-3 z-10 min-w-0">
                <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner flex items-center justify-center shrink-0">
                  <Bot size={22} className="text-white" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-[14px] tracking-wide text-white truncate">Rit - Asisten AI Lokal</h3>
                    <span className="bg-white/25 text-[9px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 shrink-0">
                      <Cpu size={9} className="text-amber-300" /> LOKAL
                    </span>
                  </div>
                  <p className="text-[10px] text-sky-100 flex items-center gap-1 font-medium mt-0.5 truncate">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0"></span>
                    <span className="truncate">{aiStatus ? `${aiStatus.label} (${aiStatus.modelName})` : 'AI Lokal: RAG Data RT Real-Time'}</span>
                  </p>
                </div>
              </div>

              {/* Utility config & reset action buttons */}
              <div className="flex items-center gap-1 z-10 shrink-0">
                <button
                  onClick={() => setShowAiConfig(!showAiConfig)}
                  title="Pengaturan Mesin AI Lokal (Ollama / Chrome AI)"
                  className={`p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-white/95 cursor-pointer ${showAiConfig ? 'bg-white/20' : ''}`}
                >
                  <Sliders size={15} />
                </button>
                <button
                  onClick={handleResetChat}
                  title="Segarkan Chat"
                  className="p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-white/95 cursor-pointer"
                >
                  <RefreshCw size={15} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/10 active:scale-95 transition-all text-white/95 md:hidden"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Collapsible Local AI Engine Configuration Panel */}
            {showAiConfig && (
              <form onSubmit={handleSaveOllamaConfig} className="p-3.5 bg-slate-900 text-white border-b border-slate-800 space-y-2.5 text-xs shrink-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                    <Cpu size={13} /> Mesin Hybrid AI Lokal (3-Lapis)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    100% Tanpa Biaya API
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Otomatis memakai <strong>TerasRAG Live Data</strong> (0 MB, semua HP warga), <strong>Chrome Gemini Nano</strong>, atau <strong>Ollama Lokal</strong> jika aktif.
                </p>
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Endpoint Ollama Lokal (Opsional):</label>
                    <input
                      type="text"
                      value={ollamaUrlInput}
                      onChange={(e) => setOllamaUrlInput(e.target.value)}
                      placeholder="http://localhost:11434"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-sky-400"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Model Ollama:</label>
                      <input
                        type="text"
                        value={ollamaModelInput}
                        onChange={(e) => setOllamaModelInput(e.target.value)}
                        placeholder="qwen2.5:3b"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-white font-mono text-[11px] focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      {configSaved ? <Check size={12} /> : null}
                      <span>{configSaved ? 'Tersimpan' : 'Uji & Simpan'}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Chat Body messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4 custom-scrollbar">
              {messages.map((msg, index) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index === 0 ? 0 : 0.05 }}
                  className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-slate-800 border-slate-700 text-white' 
                      : 'bg-white border-indigo-100 text-indigo-600'
                  }`}>
                    {msg.sender === 'user' ? <User size={13} /> : <Bot size={13} />}
                  </div>
                  
                  <div
                    className={`max-w-[78%] p-3.5 rounded-2xl shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-tr-none'
                        : 'bg-white border border-slate-150/80 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {renderMessageText(msg.text)}
                    
                    <span className={`block text-[8px] mt-1.5 text-right ${msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>
                      {msg.timestamp.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2.5"
                >
                  <div className="w-8 h-8 rounded-2xl bg-white border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-sm">
                    <Bot size={13} className="text-indigo-600 animate-bounce" />
                  </div>
                  <div className="bg-white border border-slate-150/80 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center">
                    <div className="flex gap-1 py-1 px-1.5">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions pill list box */}
            <div className="px-3 py-2 bg-white border-t border-slate-150/50 shrink-0">
              <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mb-1 px-0.5">
                <Sparkles size={10} className="text-indigo-500" />
                Saran Pertanyaan Cepat :
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar select-none" style={{ scrollbarWidth: 'none' }}>
                {SUGGESTIONS.map((s, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(s.text)}
                    disabled={isTyping}
                    className={`shrink-0 border px-3 py-1.5 rounded-full text-[11px] font-bold transition-all duration-150 active:scale-95 shadow-sm cursor-pointer ${s.color} hover:-translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input keyboard form */}
            <form onSubmit={handleFormSubmit} className="p-3 bg-white border-t border-slate-150/50 flex gap-2 items-center shrink-0">
              <input
                type="text"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
                placeholder="Tanya Rit jadwal ronda, iuran, sampah..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="p-3 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-2xl hover:brightness-105 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-100 active:scale-90 flex items-center justify-center cursor-pointer"
              >
                {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
