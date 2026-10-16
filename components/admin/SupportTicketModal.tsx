import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, MessageSquare, Plus, CheckCircle2, Clock, 
  AlertCircle, AlertTriangle, Send, X, Shield, Phone, ExternalLink 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTenant } from '../../context/TenantContext';
import { HelpdeskTicket } from '../../types';
import { subscribeToSupportTickets, createSupportTicket } from '../../services/databaseService';
import { toast } from 'sonner';

interface SupportTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupportTicketModal: React.FC<SupportTicketModalProps> = ({
  isOpen,
  onClose
}) => {
  const { currentTenant } = useTenant();
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [activeView, setActiveView] = useState<'list' | 'create'>('list');
  const [selectedTicket, setSelectedTicket] = useState<HelpdeskTicket | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HelpdeskTicket['category']>('feature_request');
  const [priority, setPriority] = useState<HelpdeskTicket['priority']>('medium');
  const [description, setDescription] = useState('');
  const [senderName, setSenderName] = useState(currentTenant.chairmanName || 'Pengurus RT');
  const [senderPhone, setSenderPhone] = useState(currentTenant.chairmanPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to tickets for this specific tenant
  useEffect(() => {
    if (!isOpen || !currentTenant?.id) return;
    const unsub = subscribeToSupportTickets((fireTickets) => {
      setTickets(fireTickets);
    }, currentTenant.id);
    return () => unsub();
  }, [isOpen, currentTenant?.id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error('Mohon lengkapi judul dan rincian permohonan bantuan');
      return;
    }

    setIsSubmitting(true);
    try {
      const newTicket: Omit<HelpdeskTicket, 'id'> & { id?: string } = {
        tenantId: currentTenant.id,
        tenantName: currentTenant.name,
        senderName: senderName.trim(),
        senderPhone: senderPhone.trim(),
        title: title.trim(),
        category,
        priority,
        status: 'open',
        createdAt: new Date().toISOString(),
        description: description.trim()
      };

      await createSupportTicket(newTicket);
      toast.success('Tiket bantuan berhasil diajukan ke Super Admin Teras Warga!');
      setTitle('');
      setDescription('');
      setActiveView('list');
    } catch (err) {
      toast.error('Gagal mengirimkan tiket bantuan');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Pusat Bantuan & Tiket Super Admin</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase">
                  {currentTenant.name}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Layanan eskalasi resmi langsung ke Administrator Pengembang Platform
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-3 bg-white">
          <button
            onClick={() => { setActiveView('list'); setSelectedTicket(null); }}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeView === 'list' && !selectedTicket
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={14} />
            <span>Riwayat Tiket Saya ({tickets.length})</span>
          </button>
          <button
            onClick={() => { setActiveView('create'); setSelectedTicket(null); }}
            className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeView === 'create'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus size={14} />
            <span>Ajukan Tiket Baru</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Detail View */}
          {selectedTicket ? (
            <div className="space-y-4">
              <button
                onClick={() => setSelectedTicket(null)}
                className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                ← Kembali ke daftar tiket
              </button>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                    {selectedTicket.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedTicket.status === 'open'
                      ? 'bg-indigo-100 text-indigo-800'
                      : selectedTicket.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedTicket.status === 'open' ? '● Baru (Menunggu Respon)' : selectedTicket.status === 'in_progress' ? '◐ Sedang Diproses' : '✓ Telah Dituntaskan'}
                  </span>
                </div>

                <h3 className="text-sm font-black text-slate-900">{selectedTicket.title}</h3>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </p>

                <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-slate-200/80">
                  Diajukan oleh: <strong className="text-slate-600">{selectedTicket.senderName}</strong> • {new Date(selectedTicket.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>

              {/* Official Super Admin Response */}
              {selectedTicket.adminResponse ? (
                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                    <Shield size={14} className="text-indigo-600" />
                    <span>Tanggapan Resmi Super Admin Teras Warga:</span>
                  </div>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed pl-5">
                    {selectedTicket.adminResponse}
                  </p>
                  {selectedTicket.resolvedAt && (
                    <div className="text-[10px] text-indigo-600 font-mono pl-5">
                      Status selesai pada: {selectedTicket.resolvedAt}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                  <Clock size={14} className="text-amber-600 shrink-0" />
                  <span>Super Admin sedang meninjau tiket ini. Tanggapan resmi akan muncul di sini secara langsung.</span>
                </div>
              )}
            </div>
          ) : activeView === 'create' ? (
            /* Create Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Judul Kendala / Pengajuan *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Permohonan pembukaan penomoran Blok D atau penyesuaian tarif"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kategori Layanan
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="water_meter">💧 Pencatatan Meteran Air</option>
                    <option value="billing">💳 Iuran & Keuangan Kas</option>
                    <option value="account">🏠 Penataan Blok & Data Rumah</option>
                    <option value="feature_request">💡 Permintaan Fitur Tambahan</option>
                    <option value="system_bug">⚠️ Gangguan Teknis / Bug</option>
                    <option value="other">📋 Pertanyaan Umum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tingkat Urgensi
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="low">Rendah (Pertanyaan Santai)</option>
                    <option value="medium">Sedang (Operasional Biasa)</option>
                    <option value="high">Tinggi (Mendesak Digunakan)</option>
                    <option value="critical">Darurat (Sistem / Layanan Terhenti)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Pengurus Pelapor
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp Pengurus
                  </label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rincian Deskripsi Masalah *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Jelaskan secara detail kendala yang dialami, nomor rumah terkait, atau permohonan yang diajukan ke Super Admin..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('list')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  <Send size={13} />
                  <span>{isSubmitting ? 'Mengirim...' : 'Kirimkan Tiket ke Super Admin'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* List of Tickets */
            <div className="space-y-2.5">
              {tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicket(t)}
                  className="p-4 bg-slate-50/70 hover:bg-indigo-50/40 border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all cursor-pointer space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                        {t.id}
                      </span>
                      <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                        t.priority === 'critical' ? 'bg-rose-100 text-rose-800' :
                        t.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {t.priority}
                      </span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      t.status === 'open'
                        ? 'bg-indigo-100 text-indigo-800'
                        : t.status === 'in_progress'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {t.status === 'open' ? '● Terkirim' : t.status === 'in_progress' ? '◐ Diproses' : '✓ Selesai'}
                    </span>
                  </div>

                  <h4 className="text-xs font-black text-slate-900 line-clamp-1">{t.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{t.description}</p>

                  {t.adminResponse && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] text-emerald-800 font-medium line-clamp-1 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                      <span>Respon Super Admin: {t.adminResponse}</span>
                    </div>
                  )}
                </div>
              ))}

              {tickets.length === 0 && (
                <div className="py-12 text-center text-slate-400 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Belum ada tiket bantuan yang diajukan</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Jika Anda membutuhkan bantuan teknis atau pembukaan blok baru, ajukan tiket melalui tombol di atas.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveView('create')}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Ajukan Tiket Sekarang</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500 font-mono">
          <span>Koneksi Live Cloud Firestore</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  );
};
