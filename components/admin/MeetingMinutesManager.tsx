import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, MapPin, Users, Trash2, Edit3, CheckCircle2, 
  Clock, AlertTriangle, Share2, Sparkles, Printer, FileText, CheckSquare, 
  Filter, Eye, ChevronDown, ChevronUp, UserCheck, ShieldCheck, Download,
  Layers, Bookmark, X, BookOpen, MessageCircle
} from 'lucide-react';
import { MeetingMinute, MeetingDecision } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';
import { 
  subscribeToCollection, 
  addToCollection, 
  updateDocumentInCollection, 
  deleteDocumentFromCollection 
} from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';

export const INITIAL_MEETING_MINUTES: MeetingMinute[] = [];

export const MeetingMinutesManager: React.FC = () => {
  const confirm = useConfirm();
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);
  const [editingMinute, setEditingMinute] = useState<MeetingMinute | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<MeetingMinute, 'id'>>({
    title: '',
    meetingType: 'Musyawarah Warga',
    date: new Date().toISOString().split('T')[0],
    time: '20:00 - 22:00 WITA',
    location: 'Pos Serbaguna RT 002 / RW 020 Huntap Tondo 2',
    leader: 'Ketua RT 002',
    notetaker: 'Sekretaris RT 002',
    attendeesCount: 40,
    agenda: [''],
    summary: '',
    decisions: [
      {
        id: 'dec-new-1',
        title: '',
        description: '',
        category: 'Ketertiban & Sosial',
        status: 'Aktif'
      }
    ],
    status: 'Disahkan'
  });

  // Subscribe to Firebase collection in real-time
  useEffect(() => {
    const unsub = subscribeToCollection('meetingMinutes', (data) => {
      if (data && Array.isArray(data)) {
        const sorted = [...(data as MeetingMinute[])].sort((a, b) => {
          const dateA = new Date(a.date || 0).getTime();
          const dateB = new Date(b.date || 0).getTime();
          return dateB - dateA;
        });
        setMinutes(sorted);
      } else {
        setMinutes([]);
      }
      setLoading(false);
    }, (err) => {
      console.warn("Koleksi meetingMinutes belum dapat diakses di admin:", err?.message || err);
      setMinutes([]);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Filter minutes
  const filteredMinutes = minutes.filter((m) => {
    const matchesType = filterType === 'ALL' || m.meetingType === filterType;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesType;

    const matchesSearch = 
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.leader.toLowerCase().includes(q) ||
      m.agenda.some(a => a.toLowerCase().includes(q)) ||
      m.decisions.some(d => d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || d.category.toLowerCase().includes(q));

    return matchesType && matchesSearch;
  });

  // Total decisions count across all minutes
  const totalDecisionsCount = minutes.reduce((acc, m) => acc + (m.decisions?.length || 0), 0);

  const handleOpenAdd = () => {
    setEditingMinute(null);
    setFormData({
      title: '',
      meetingType: 'Musyawarah Warga',
      date: new Date().toISOString().split('T')[0],
      time: '20:00 - 22:00 WITA',
      location: 'Pos Serbaguna RT 002 / RW 020 Huntap Tondo 2',
      leader: 'Ketua RT 002',
      notetaker: 'Sekretaris RT 002',
      attendeesCount: 40,
      agenda: [''],
      summary: '',
      decisions: [
        {
          id: `dec-${Date.now()}-1`,
          title: '',
          description: '',
          category: 'Ketertiban & Sosial',
          status: 'Aktif'
        }
      ],
      status: 'Disahkan'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m: MeetingMinute) => {
    setEditingMinute(m);
    setFormData({
      title: m.title,
      meetingType: m.meetingType,
      date: m.date,
      time: m.time,
      location: m.location,
      leader: m.leader,
      notetaker: m.notetaker,
      attendeesCount: m.attendeesCount || 0,
      agenda: m.agenda && m.agenda.length > 0 ? [...m.agenda] : [''],
      summary: m.summary || '',
      decisions: m.decisions && m.decisions.length > 0 ? [...m.decisions] : [],
      status: m.status || 'Disahkan',
      documentationUrls: m.documentationUrls || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (m: MeetingMinute) => {
    const isConfirmed = await confirm({
      title: 'Hapus Notula Rapat',
      message: `Apakah Anda yakin ingin menghapus notula "${m.title}"? Seluruh poin kesepakatan di dalamnya juga akan terhapus.`,
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        if (m.id.startsWith('notula-2026-')) {
          setMinutes(prev => prev.filter(item => item.id !== m.id));
        } else {
          await deleteDocumentFromCollection('meetingMinutes', m.id);
        }
        toast.success('Notula musyawarah berhasil dihapus');
      } catch (err: any) {
        toast.error('Gagal menghapus notula: ' + err.message);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Judul musyawarah wajib diisi!');
      return;
    }

    // Filter valid agendas and decisions
    const cleanAgendas = formData.agenda.filter(a => a.trim().length > 0);
    const cleanDecisions = formData.decisions.filter(d => d.title.trim().length > 0);

    const payload = {
      ...formData,
      agenda: cleanAgendas.length > 0 ? cleanAgendas : ['Pembahasan umum'],
      decisions: cleanDecisions,
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingMinute) {
        if (editingMinute.id.startsWith('notula-2026-')) {
          setMinutes(prev => prev.map(item => item.id === editingMinute.id ? { ...payload, id: editingMinute.id } : item));
        } else {
          await updateDocumentInCollection('meetingMinutes', editingMinute.id, payload);
        }
        toast.success('Notula musyawarah berhasil diperbarui');
      } else {
        await addToCollection('meetingMinutes', payload);
        toast.success('Notula musyawarah baru berhasil disimpan & disahkan');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      toast.error('Gagal menyimpan notula: ' + err.message);
    }
  };

  const handleShareToWhatsApp = (m: MeetingMinute) => {
    const decisionList = m.decisions.map((d, i) => 
      `${i + 1}. *${d.title}* (${d.category})\n   _${d.description}_\n`
    ).join('\n');

    const message = 
`📜 *HASIL NOTULA & KESEPAKATAN MUSYAWARAH RT 002 / RW 020*
*Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu*
───────────────────────
📌 *Agenda*: ${m.title}
🗓️ *Hari/Tanggal*: ${new Date(m.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
⏰ *Waktu*: ${m.time}
📍 *Tempat*: ${m.location}
👥 *Kehadiran*: ${m.attendeesCount} Kepala Keluarga
👤 *Pimpinan Rapat*: ${m.leader}
📝 *Notulis*: ${m.notetaker}

📋 *POIN KEPUTUSAN / KESEPAKATAN RESMI:*
${decisionList || '- Tidak ada poin keputusan khusus -'}

💬 *Ringkasan*:
${m.summary}

───────────────────────
_Dokumen resmi ini telah disahkan dan berlaku bagi seluruh warga RT 002 / RW 020 Huntap Tondo 2._
📲 Cek arsip lengkap di portal: https://teraswarga02.web.app/rules?tab=minutes`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handlePrintA4 = (m: MeetingMinute) => {
    setSelectedMinute(m);
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6 text-left p-2 sm:p-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-wider text-indigo-300 border border-white/10">
              <BookOpen size={12} />
              <span>Arsip Hukum &amp; Kesepakatan Lingkungan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-sans">
              Buku Notula &amp; Kesepakatan Musyawarah
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Pencatatan resmi jalannya rapat warga, berita acara keputusan mufakat, serta aturan lokal RT 002 / RW 020 Huntap Tondo 2 yang sah dan berkekuatan hukum lingkungan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Tulis Notula Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Rapat Tercatat</span>
            <span className="text-xl font-black text-white mt-0.5 block">{minutes.length} Sidang</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Poin Kesepakatan Sah</span>
            <span className="text-xl font-black text-amber-400 mt-0.5 block">{totalDecisionsCount} Aturan</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tingkat Partisipasi</span>
            <span className="text-xl font-black text-emerald-400 mt-0.5 block">Kuorum Sah</span>
          </div>
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Arsip Berita Acara</span>
            <span className="text-xl font-black text-sky-400 mt-0.5 block">100% Digital</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari keputusan rapat (misal: portal, tenda, sampah, siskamling, iuran)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'Semua Rapat' },
            { id: 'Musyawarah Warga', label: 'Musyawarah Warga' },
            { id: 'Rapat Pengurus', label: 'Rapat Pengurus' },
            { id: 'Rapat Darurat Fasum', label: 'Darurat Fasum' },
            { id: 'Rapat LPJ & Keuangan', label: 'LPJ & Keuangan' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                filterType === type.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Minutes Cards Feed */}
      <div className="space-y-4">
        {filteredMinutes.length > 0 ? (
          filteredMinutes.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-[2rem] border border-slate-200/90 shadow-sm p-6 space-y-5 hover:border-slate-300 transition-all group"
            >
              {/* Header Badges & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                    m.meetingType === 'Musyawarah Warga' ? 'bg-amber-100 text-amber-800' :
                    m.meetingType === 'Rapat Pengurus' ? 'bg-indigo-100 text-indigo-800' :
                    m.meetingType === 'Rapat Darurat Fasum' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {m.meetingType}
                  </span>

                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-1">
                    <Calendar size={12} className="text-slate-500" />
                    {new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>

                  <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-bold flex items-center gap-1">
                    <Clock size={12} className="text-slate-500" />
                    {m.time}
                  </span>

                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Users size={12} className="text-emerald-600" />
                    {m.attendeesCount} KK Hadir
                  </span>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    onClick={() => handleShareToWhatsApp(m)}
                    className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                    title="Bagikan ke Grup WhatsApp RT"
                  >
                    <Share2 size={15} />
                  </button>

                  <button
                    onClick={() => handlePrintA4(m)}
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                    title="Cetak Berita Acara Notula A4"
                  >
                    <Printer size={15} />
                  </button>

                  <button
                    onClick={() => handleOpenEdit(m)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                    title="Edit Notula"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    onClick={() => handleDelete(m)}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all cursor-pointer shadow-2xs"
                    title="Hapus Notula"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Title & Leaders */}
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                  {m.title}
                </h3>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-amber-600" />
                    {m.location}
                  </span>
                  <span>•</span>
                  <span>Pimpinan: <strong className="text-slate-800 font-bold">{m.leader}</strong></span>
                  <span>•</span>
                  <span>Notulis: <strong className="text-slate-800 font-bold">{m.notetaker}</strong></span>
                </div>
              </div>

              {/* Agenda List */}
              {m.agenda && m.agenda.length > 0 && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Bookmark size={12} className="text-amber-500" />
                    Agenda Pembahasan:
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-700 font-medium list-disc list-inside">
                    {m.agenda.map((ag, idx) => (
                      <li key={idx} className="truncate">{ag}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Summary */}
              {m.summary && (
                <div className="text-xs text-slate-600 leading-relaxed font-medium">
                  <p>{m.summary}</p>
                </div>
              )}

              {/* Decisions Cards (Core Value) */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <CheckSquare size={15} className="text-emerald-600" />
                    Poin Kesepakatan Resmi yang Disahkan ({m.decisions?.length || 0})
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Berkekuatan Hukum Lingkungan
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {m.decisions && m.decisions.map((dec, idx) => (
                    <div
                      key={dec.id || idx}
                      className="p-4 bg-gradient-to-br from-white to-slate-50/80 border-2 border-slate-200/90 rounded-2xl shadow-xs space-y-2 hover:border-amber-400 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[9px] font-black uppercase tracking-wider">
                          {dec.category}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-black">
                          {dec.status || 'Aktif'}
                        </span>
                      </div>

                      <h5 className="font-black text-slate-900 text-xs sm:text-sm leading-snug">
                        {idx + 1}. {dec.title}
                      </h5>

                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                        {dec.description}
                      </p>

                      {dec.effectiveDate && (
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-1 border-t border-slate-100">
                          Berlaku: {new Date(dec.effectiveDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        ) : minutes.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 shadow-2xs">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-200/60 shadow-xs">
              <BookOpen size={28} />
            </div>
            <h4 className="font-black text-slate-800 text-base font-serif">Belum Ada Notula Musyawarah Real-Time</h4>
            <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto leading-relaxed">
              Basis data notula musyawarah saat ini masih kosong. Silakan catat hasil musyawarah atau rapat warga RT 02 untuk dipublikasikan langsung secara transparan kepada warga.
            </p>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-amber-600/20 active:scale-95 cursor-pointer"
            >
              <Plus size={15} />
              <span>Buat Notula Musyawarah Pertama</span>
            </button>
          </div>
        ) : (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
            <BookOpen size={40} className="text-slate-300 mx-auto mb-3" />
            <h4 className="font-black text-slate-800 text-base">Belum Ada Notula yang Sesuai</h4>
            <p className="text-xs text-slate-500 mt-1">Coba ubah kata kunci pencarian atau pilih filter jenis rapat lainnya.</p>
          </div>
        )}
      </div>

      {/* MODAL: Form Tambah / Edit Notula */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMinute ? "Edit Notula Musyawarah" : "Tulis Notula Musyawarah Baru"}
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-5 p-1 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Judul Rapat / Musyawarah *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Musyawarah Warga Semester I: Evaluasi Air Bersih & Siskamling"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Jenis Musyawarah *</label>
              <select
                value={formData.meetingType}
                onChange={(e: any) => setFormData({ ...formData, meetingType: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Musyawarah Warga">Musyawarah Warga (Umum)</option>
                <option value="Rapat Pengurus">Rapat Pengurus RT</option>
                <option value="Rapat Darurat Fasum">Rapat Darurat Fasum / Keamanan</option>
                <option value="Rapat LPJ & Keuangan">Rapat LPJ &amp; Keuangan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Status Pengesahan</label>
              <select
                value={formData.status}
                onChange={(e: any) => setFormData({ ...formData, status: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="Disahkan">✅ Disahkan (Berlaku Resmi)</option>
                <option value="Draft">📝 Draft (Belum Final)</option>
                <option value="Diarsipkan">📦 Diarsipkan</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Tanggal Pelaksanaan *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Waktu / Jam *</label>
              <input
                type="text"
                required
                placeholder="20:00 - 22:30 WITA"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Lokasi Pertemuan *</label>
              <input
                type="text"
                required
                placeholder="Pos Serbaguna RT 002 / RW 020 Huntap Tondo 2"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Pimpinan Rapat</label>
              <input
                type="text"
                placeholder="Ketua RT 002 / Irfan"
                value={formData.leader}
                onChange={(e) => setFormData({ ...formData, leader: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Notulis / Sekretaris</label>
              <input
                type="text"
                placeholder="Sekretaris RT 002"
                value={formData.notetaker}
                onChange={(e) => setFormData({ ...formData, notetaker: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Jumlah Kehadiran KK / Warga</label>
              <input
                type="number"
                min={1}
                value={formData.attendeesCount}
                onChange={(e) => setFormData({ ...formData, attendeesCount: parseInt(e.target.value) || 0 })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Dynamic Agenda Inputs */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800">Daftar Agenda Rapat</label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, agenda: [...formData.agenda, ''] })}
                className="text-[10px] font-black uppercase tracking-wider text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} /> Tambah Agenda
              </button>
            </div>
            {formData.agenda.map((ag, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 w-5">{i + 1}.</span>
                <input
                  type="text"
                  placeholder={`Agenda pembahasan ke-${i + 1}`}
                  value={ag}
                  onChange={(e) => {
                    const next = [...formData.agenda];
                    next[i] = e.target.value;
                    setFormData({ ...formData, agenda: next });
                  }}
                  className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
                {formData.agenda.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = formData.agenda.filter((_, idx) => idx !== i);
                      setFormData({ ...formData, agenda: next });
                    }}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700">Ringkasan Jalannya Musyawarah</label>
            <textarea
              rows={3}
              placeholder="Catatan umum jalannya musyawarah, diskusi masukan warga, dan dinamika rapat..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          {/* Decisions List Inputs */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckSquare size={14} className="text-emerald-600" />
                Poin Keputusan / Kesepakatan Resmi
              </label>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  decisions: [
                    ...formData.decisions,
                    {
                      id: `dec-${Date.now()}-${formData.decisions.length + 1}`,
                      title: '',
                      description: '',
                      category: 'Ketertiban & Sosial',
                      status: 'Aktif'
                    }
                  ]
                })}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={12} /> Tambah Keputusan
              </button>
            </div>

            {formData.decisions.map((dec, i) => (
              <div key={dec.id || i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-700">Poin #{i + 1}</span>
                  {formData.decisions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const next = formData.decisions.filter((_, idx) => idx !== i);
                        setFormData({ ...formData, decisions: next });
                      }}
                      className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                    >
                      Hapus Poin
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Judul Kesepakatan (contoh: Jam Gembok Portal)"
                      value={dec.title}
                      onChange={(e) => {
                        const next = [...formData.decisions];
                        next[i].title = e.target.value;
                        setFormData({ ...formData, decisions: next });
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <select
                      value={dec.category}
                      onChange={(e: any) => {
                        const next = [...formData.decisions];
                        next[i].category = e.target.value;
                        setFormData({ ...formData, decisions: next });
                      }}
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Keamanan">Keamanan</option>
                      <option value="Kebersihan">Kebersihan</option>
                      <option value="Keuangan & Iuran">Keuangan &amp; Iuran</option>
                      <option value="Fasum & Pembangunan">Fasum &amp; Pembangunan</option>
                      <option value="Ketertiban & Sosial">Ketertiban &amp; Sosial</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={2}
                  placeholder="Rincian aturan atau ketentuan yang disepakati secara rinci..."
                  value={dec.description}
                  onChange={(e) => {
                    const next = [...formData.decisions];
                    next[i].description = e.target.value;
                    setFormData({ ...formData, decisions: next });
                  }}
                  className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
            >
              Simpan &amp; Sahkan Notula
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Cetak Lembar Berita Acara A4 Notula */}
      {selectedMinute && (
        <Modal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          title="Pratinjau Lembar Berita Acara Notula Musyawarah"
          maxWidth="max-w-3xl"
        >
          <div className="space-y-6 p-2 text-left">
            {/* Printable Paper Canvas */}
            <div id="print-canvas" className="p-8 bg-white border border-slate-300 rounded-2xl shadow-sm text-slate-900 space-y-6 font-serif">
              {/* Kop Surat RT */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <h2 className="text-base sm:text-lg font-black tracking-wider uppercase">
                  RUKUN TETANGGA 002 / RUKUN WARGA 020
                </h2>
                <h3 className="text-sm font-bold tracking-wide uppercase">
                  KELURAHAN TONDO • KECAMATAN MANTIKULORE • KOTA PALU
                </h3>
                <p className="text-[11px] text-slate-600 font-sans">
                  Kawasan Hunian Tetap (Huntap) Tondo 2, Kode Pos 94119 • Narahubung: +62 859-6119-4621
                </p>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h4 className="text-sm font-black uppercase underline tracking-wider font-sans">
                  BERITA ACARA &amp; NOTULA HASIL MUSYAWARAH WARGA
                </h4>
                <p className="text-xs font-bold font-sans text-slate-600">
                  Nomor Berkas: BA-{selectedMinute.date.replace(/-/g, '')}/RT02-TND/2026
                </p>
              </div>

              {/* Detail Meeting Info */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans space-y-1.5">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Agenda / Rapat:</span>
                  <span className="col-span-2 font-bold">{selectedMinute.title}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Hari, Tanggal &amp; Jam:</span>
                  <span className="col-span-2 font-bold">
                    {new Date(selectedMinute.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} • {selectedMinute.time}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Tempat Pelaksanaan:</span>
                  <span className="col-span-2 font-bold">{selectedMinute.location}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Pimpinan &amp; Notulis:</span>
                  <span className="col-span-2 font-bold">{selectedMinute.leader} / {selectedMinute.notetaker}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-slate-500">Kehadiran:</span>
                  <span className="col-span-2 font-bold">{selectedMinute.attendeesCount} Kepala Keluarga (Kuorum Sah)</span>
                </div>
              </div>

              {/* Agreed Decisions */}
              <div className="space-y-3 font-sans">
                <h5 className="font-black text-xs uppercase tracking-wider border-b pb-1">
                  POIN-POIN KEPUTUSAN YANG DISEPAKATI BERSAMA:
                </h5>
                <ol className="space-y-3 text-xs">
                  {selectedMinute.decisions.map((dec, idx) => (
                    <li key={idx} className="space-y-1">
                      <p className="font-bold text-slate-900">
                        {idx + 1}. {dec.title} <span className="text-[10px] text-slate-500 font-normal">({dec.category})</span>
                      </p>
                      <p className="text-slate-700 leading-relaxed pl-4">
                        {dec.description}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs font-sans gap-8">
                <div className="space-y-16">
                  <p>Notulis Rapat,</p>
                  <div>
                    <p className="font-bold underline">{selectedMinute.notetaker}</p>
                    <p className="text-[10px] text-slate-500">Sekretaris RT 002</p>
                  </div>
                </div>

                <div className="space-y-16">
                  <p>Mengetahui &amp; Mengesahkan,<br/>Ketua RT 002 / RW 020</p>
                  <div>
                    <p className="font-bold underline">{selectedMinute.leader}</p>
                    <p className="text-[10px] text-slate-500">Ketua RT 002 Kel. Tondo</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
              >
                <Printer size={14} />
                <span>Cetak Lembar A4</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
