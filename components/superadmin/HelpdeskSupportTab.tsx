import React, { useState, useEffect, useMemo } from 'react';
import { 
  HelpCircle, MessageSquare, AlertCircle, CheckCircle2, Clock, 
  Search, Filter, Plus, ArrowRight, User, Phone, Check,
  X, AlertTriangle, ShieldCheck, Tag, Send, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Tenant, HelpdeskTicket } from '../../types';
import { 
  subscribeToSupportTickets, 
  createSupportTicket, 
  updateSupportTicket, 
  deleteSupportTicket 
} from '../../services/databaseService';
import { toast } from 'sonner';

interface HelpdeskSupportTabProps {
  tenants: Tenant[];
  onLogAudit: (action: string, category: any, targetTenantId?: string, details?: string) => void;
}

const TICKET_STORAGE_KEY = 'teras_superadmin_tickets';

export const HelpdeskSupportTab: React.FC<HelpdeskSupportTabProps> = ({
  tenants,
  onLogAudit
}) => {
  const [tickets, setTickets] = useState<HelpdeskTicket[]>(() => {
    try {
      const stored = localStorage.getItem(TICKET_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out any legacy dummy tickets
          const clean = parsed.filter(t => 
            t.id !== 'TCK-2026-001' && 
            t.id !== 'TCK-2026-002' && 
            t.senderPhone !== '081234567890' && 
            t.senderPhone !== '081298765432'
          );
          return clean;
        }
      }
    } catch (e) {
      console.error('Failed to parse tickets:', e);
    }
    return [];
  });

  // Subscribe to real-time Cloud Firestore Support Tickets
  useEffect(() => {
    const unsub = subscribeToSupportTickets((fireTickets) => {
      setTickets(fireTickets || []);
    });
    return () => unsub();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);
  const [responseInput, setResponseInput] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // New Ticket Form State
  const [newTenantId, setNewTenantId] = useState(tenants[0]?.id || '');
  const [newSenderName, setNewSenderName] = useState('');
  const [newSenderPhone, setNewSenderPhone] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<HelpdeskTicket['category']>('feature_request');
  const [newPriority, setNewPriority] = useState<HelpdeskTicket['priority']>('medium');
  const [newDescription, setNewDescription] = useState('');

  // Persist backup to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(tickets));
    } catch (e) {
      console.error('Failed to store tickets:', e);
    }
  }, [tickets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesSearch = 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tickets, searchQuery, statusFilter, priorityFilter]);

  // Update Ticket Status
  const handleUpdateStatus = async (ticketId: string, newStatus: 'open' | 'in_progress' | 'resolved') => {
    const updates: Partial<HelpdeskTicket> = {
      status: newStatus,
      resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : undefined
    };

    setTickets(prev => prev.map(t => (t.id === ticketId ? { ...t, ...updates } : t)));
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket(prev => (prev ? { ...prev, ...updates } : null));
    }

    try {
      await updateSupportTicket(ticketId, updates);
      const target = tickets.find(t => t.id === ticketId);
      onLogAudit(
        'Ubah Status Tiket',
        'support',
        target?.tenantId,
        `Status tiket ${ticketId} (${target?.title}) diubah menjadi ${newStatus}`
      );
      toast.success(`Status tiket diubah menjadi ${newStatus.toUpperCase()}`);
    } catch (err) {
      toast.error('Gagal memperbarui status di cloud');
    }
  };

  // Submit Admin Response
  const handleSubmitResponse = async () => {
    if (!selectedTicket || !responseInput.trim()) return;

    const updates: Partial<HelpdeskTicket> = {
      adminResponse: responseInput.trim(),
      status: selectedTicket.status === 'open' ? 'in_progress' : selectedTicket.status
    };

    setTickets(prev => prev.map(t => (t.id === selectedTicket.id ? { ...t, ...updates } : t)));
    setSelectedTicket(prev => (prev ? { ...prev, ...updates } : null));

    try {
      await updateSupportTicket(selectedTicket.id, updates);
      onLogAudit(
        'Balas Tiket Dukungan',
        'support',
        selectedTicket.tenantId,
        `Tanggapan resmi dikirimkan untuk tiket ${selectedTicket.id}`
      );
      toast.success('Tanggapan berhasil disimpan dan disinkronkan ke RT');
      setResponseInput('');
    } catch (err) {
      toast.error('Gagal mengirim tanggapan');
    }
  };

  // Create New Ticket
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim() || !newSenderName.trim()) {
      toast.error('Mohon lengkapi judul, pengirim, dan rincian masalah');
      return;
    }

    const tenantObj = tenants.find(t => t.id === newTenantId) || tenants[0];
    const newId = `TCK-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

    const created: HelpdeskTicket = {
      id: newId,
      tenantId: tenantObj?.id || 'general',
      tenantName: tenantObj?.name || 'General Platform',
      senderName: newSenderName.trim(),
      senderPhone: newSenderPhone.trim(),
      title: newTitle.trim(),
      category: newCategory,
      priority: newPriority,
      status: 'open',
      createdAt: new Date().toISOString(),
      description: newDescription.trim()
    };

    try {
      await createSupportTicket(created);
      setTickets(prev => [created, ...prev]);
      onLogAudit('Catat Tiket Dukungan Baru', 'support', created.tenantId, `Tiket ${created.id}: ${created.title}`);
      toast.success(`Tiket ${created.id} berhasil dicatat di Cloud Firestore`);

      // Reset & close
      setShowNewModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewSenderName('');
      setNewSenderPhone('');
    } catch (err) {
      toast.error('Gagal mencatat tiket di cloud');
    }
  };

  const openWhatsAppSender = (phone?: string, ticketId?: string) => {
    if (!phone) {
      toast.error('Nomor telepon pengirim tidak terdaftar');
      return;
    }
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '62' + clean.slice(1);
    const text = encodeURIComponent(
      `Halo Bpk/Ibu, salam dari Super Admin Teras Warga terkait tiket dukungan Anda [${ticketId}]. Kami sedang meninjau kendala yang dilaporkan...`
    );
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
  };

  // Counts
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  const criticalCount = tickets.filter(t => t.priority === 'critical' && t.status !== 'resolved').length;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Tiket Baru (Open)
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-600 tracking-tight font-mono">
            {openCount} <span className="text-xs font-bold text-slate-500 font-sans">Menunggu</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Belum ditanggapi oleh Super Admin
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Dalam Pengerjaan
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
            {inProgressCount} <span className="text-xs font-bold text-slate-500 font-sans">Proses</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Sedang diselesaikan teknis platform
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Tiket Kritis
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 tracking-tight font-mono">
            {criticalCount} <span className="text-xs font-bold text-slate-500 font-sans">Mendesak</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Perlu intervensi cepat dalam 24 jam
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Selesai Dituntaskan
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight font-mono">
            {resolvedCount} <span className="text-xs font-bold text-slate-500 font-sans">Tiket</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Solusi telah diverifikasi pengurus RT
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Cari ID tiket, judul masalah, atau nama RT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            {(['all', 'open', 'in_progress', 'resolved'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'all' ? 'Semua' : st === 'open' ? 'Baru' : st === 'in_progress' ? 'Proses' : 'Selesai'}
              </button>
            ))}
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">Semua Prioritas</option>
            <option value="critical">Kritis</option>
            <option value="high">Tinggi</option>
            <option value="medium">Sedang</option>
            <option value="low">Rendah</option>
          </select>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
        >
          <Plus size={14} />
          <span>Catat Tiket Manual</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.map(ticket => (
          <div
            key={ticket.id}
            onClick={() => {
              setSelectedTicket(ticket);
              setResponseInput(ticket.adminResponse || '');
            }}
            className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
          >
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {ticket.id}
                </span>

                {/* Priority Badge */}
                <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                  ticket.priority === 'critical'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : ticket.priority === 'high'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : ticket.priority === 'medium'
                    ? 'bg-sky-100 text-sky-800 border border-sky-300'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {ticket.priority}
                </span>

                {/* Category Badge */}
                <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                  {ticket.category === 'water_meter' ? '💧 Meteran Air' :
                   ticket.category === 'billing' ? '💳 Iuran & Keuangan' :
                   ticket.category === 'account' ? '🏠 Penataan Blok & Akun' :
                   ticket.category === 'feature_request' ? '💡 Permintaan Fitur' :
                   ticket.category === 'system_bug' ? '⚠️ Gangguan Teknis' : '📋 Umum'}
                </span>

                {/* Status Badge */}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ticket.status === 'open'
                    ? 'bg-indigo-100 text-indigo-800'
                    : ticket.status === 'in_progress'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {ticket.status === 'open' ? '● Baru' : ticket.status === 'in_progress' ? '◐ Diproses' : '✓ Selesai'}
                </span>
              </div>

              <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                {ticket.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-1">
                {ticket.description}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                <span className="font-bold text-slate-700">{ticket.tenantName}</span>
                <span>•</span>
                <span>Pengirim: <strong className="text-slate-800">{ticket.senderName}</strong></span>
                <span>•</span>
                <span className="font-mono">{ticket.createdAt}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center shrink-0">
              {ticket.senderPhone && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openWhatsAppSender(ticket.senderPhone, ticket.id);
                  }}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Hubungi via WhatsApp"
                >
                  <MessageSquare size={13} />
                  <span>WA</span>
                </button>
              )}
              <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                <ArrowRight size={15} />
              </div>
            </div>
          </div>
        ))}

        {filteredTickets.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <HelpCircle size={40} className="mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-bold text-slate-600">Tidak ada tiket bantuan yang sesuai filter</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Seluruh laporan dan permohonan telah ditangani dengan baik.</p>
          </div>
        )}
      </div>

      {/* Ticket Detail & Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    {selectedTicket.id}
                  </span>
                  <span className="text-xs text-slate-500 font-bold">
                    {selectedTicket.tenantName}
                  </span>
                </div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {selectedTicket.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Ticket Meta Info */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Pengirim</span>
                  <span className="font-bold text-slate-800 truncate block">{selectedTicket.senderName}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Prioritas</span>
                  <span className="font-black font-mono uppercase text-slate-800">{selectedTicket.priority}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status Saat Ini</span>
                  <span className="font-bold text-indigo-700 uppercase font-mono">{selectedTicket.status}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Waktu Lapor</span>
                  <span className="font-bold text-slate-800 text-[11px] block">{selectedTicket.createdAt}</span>
                </div>
              </div>

              {/* Problem Description */}
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-black uppercase text-slate-400 font-mono">
                  Uraian Laporan / Permohonan:
                </span>
                <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              {/* Status Action Switcher */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Perbarui Status Penanganan:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'open')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedTicket.status === 'open'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    ● Baru (Open)
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'in_progress')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedTicket.status === 'in_progress'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    ◐ Dalam Pengerjaan
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedTicket.status === 'resolved'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    ✓ Tuntas (Resolved)
                  </button>
                </div>
              </div>

              {/* Official Admin Response Input */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Tanggapan & Solusi Resmi Super Admin:</span>
                  {selectedTicket.senderPhone && (
                    <button
                      onClick={() => openWhatsAppSender(selectedTicket.senderPhone, selectedTicket.id)}
                      className="text-emerald-700 hover:underline flex items-center gap-1 text-[11px] font-bold"
                    >
                      <MessageSquare size={12} />
                      <span>Chat Langsung Pengurus via WA</span>
                    </button>
                  )}
                </label>
                <textarea
                  rows={3}
                  value={responseInput}
                  onChange={(e) => setResponseInput(e.target.value)}
                  placeholder="Ketik instruksi tindak lanjut, status teknis, atau konfirmasi penyelesaian..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                />
                <button
                  onClick={handleSubmitResponse}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Simpan Tanggapan Resmi</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Hapus tiket ini dari sistem?')) {
                    try {
                      await deleteSupportTicket(selectedTicket.id);
                      setTickets(prev => prev.filter(t => t.id !== selectedTicket.id));
                      setSelectedTicket(null);
                      toast.success('Tiket berhasil dihapus dari Cloud');
                    } catch (e) {
                      toast.error('Gagal menghapus tiket');
                    }
                  }
                }}
                className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Hapus Tiket</span>
              </button>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create New Ticket Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-800"
          >
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Catat Tiket Dukungan Manual
                </h2>
                <p className="text-xs text-slate-500">
                  Dokumentasikan kendala atau permintaan pengurus RT ke pusat
                </p>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Wilayah RT Pelapor
                </label>
                <select
                  value={newTenantId}
                  onChange={(e) => setNewTenantId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pengurus Pelapor
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Bpk. Irfan"
                    value={newSenderName}
                    onChange={(e) => setNewSenderName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Telepon / WA
                  </label>
                  <input
                    type="text"
                    placeholder="0812xxxx"
                    value={newSenderPhone}
                    onChange={(e) => setNewSenderPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Masalah
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="water_meter">💧 Meteran Air</option>
                    <option value="billing">💳 Iuran & Keuangan</option>
                    <option value="account">🏠 Penataan Blok & Akun</option>
                    <option value="feature_request">💡 Permintaan Fitur</option>
                    <option value="system_bug">⚠️ Gangguan Teknis</option>
                    <option value="other">📋 Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Rendah (Pertanyaan)</option>
                    <option value="medium">Sedang (Standar)</option>
                    <option value="high">Tinggi (Mendesak)</option>
                    <option value="critical">Kritis (Air/Darurat)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Tiket
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pengajuan sensor air digital blok B"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rincian Laporan / Keterangan Masalah
                </label>
                <textarea
                  rows={3}
                  placeholder="Jelaskan kronologi kendala atau spesifikasi kebutuhan..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
                >
                  Simpan Tiket
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
