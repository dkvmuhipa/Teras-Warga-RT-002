import React, { useState } from 'react';
import { Plus, Trash2, Megaphone, Calendar, AlertCircle, Info, CalendarDays, Edit2, MessageCircle, Sparkles, Send, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { Announcement, House, PdfConfig } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addAnnouncementToDb, deleteAnnouncementFromDb, updateAnnouncementInDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { sendWhatsAppMessage, formatAnnouncementForWhatsApp, broadcastWhatsApp } from '../../services/whatsappService';
import { generateAnnouncementDraft } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface AnnouncementManagementProps {
  announcements: Announcement[];
  houses: House[];
  pdfConfig: PdfConfig;
}

export const AnnouncementManagement: React.FC<AnnouncementManagementProps> = ({ announcements, houses, pdfConfig }) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [selectedAnnForBroadcast, setSelectedAnnForBroadcast] = useState<Announcement | null>(null);
  const [broadcastTargets, setBroadcastTargets] = useState({ group: true, individual: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isBroadcasting, setIsBroadcasting] = useState<string | null>(null);
  
  // Form State
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState('Info');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const filteredAnnouncements = announcements.filter(a => 
    (filterType === 'All' || a.type === filterType) &&
    (a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleBroadcast = (ann: Announcement) => {
    setSelectedAnnForBroadcast(ann);
    setIsBroadcastModalOpen(true);
  };

  const executeBroadcast = async () => {
    if (!selectedAnnForBroadcast) return;
    
    const ann = selectedAnnForBroadcast;
    const phoneNumbers = houses
      .map(h => h.phone)
      .filter((p): p is string => !!p && p.length > 5);

    const hasGroup = !!pdfConfig.whatsappGroupId;
    const sendToGroup = broadcastTargets.group && hasGroup;
    const sendToIndividual = broadcastTargets.individual && phoneNumbers.length > 0;

    if (!sendToGroup && !sendToIndividual) {
      return toast.error('Pilih setidaknya satu target broadcast yang valid.');
    }

    setIsBroadcasting(ann.id);
    setIsBroadcastModalOpen(false);
    
    const message = formatAnnouncementForWhatsApp(ann.title, ann.content);
    
    try {
      let successCount = 0;
      let totalCount = 0;

      // 1. Send to Group
      if (sendToGroup) {
        totalCount++;
        const groupResult = await broadcastWhatsApp([pdfConfig.whatsappGroupId!], message);
        if (groupResult?.success) successCount++;
      }

      // 2. Send to individual numbers
      if (sendToIndividual) {
        const result = await broadcastWhatsApp(phoneNumbers, message);
        if (result?.success) {
          successCount += phoneNumbers.length;
        }
        totalCount += phoneNumbers.length;
      }

      if (successCount > 0) {
        toast.success(`Broadcast berhasil dikirim! (${successCount}/${totalCount} target)`);
      } else {
        toast.error(`Gagal mengirim broadcast. Periksa konfigurasi gateway.`);
      }
    } catch (error) {
      console.error('Broadcast error:', error);
      toast.error('Gagal mengirim broadcast. Pastikan gateway sudah terkonfigurasi.');
    } finally {
      setIsBroadcasting(null);
      setSelectedAnnForBroadcast(null);
    }
  };

  const resetForms = () => {
    setAnnTitle('');
    setAnnContent('');
    setAnnType('Info');
    setEditingId(null);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAnnouncementInDb(editingId, {
          title: annTitle,
          content: annContent,
          type: annType as any
        });
        toast.success('Pengumuman berhasil diperbarui!');
      } else {
        await addAnnouncementToDb({
          title: annTitle,
          content: annContent,
          date: new Date().toISOString(),
          type: annType as any
        });
        toast.success('Pengumuman berhasil dibuat!');
      }
      setIsModalOpen(false);
      resetForms();
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, "announcements");
      toast.error('Gagal menyimpan pengumuman.');
    }
  };

  const handleEdit = (ann: Announcement) => {
    setEditingId(ann.id);
    setAnnTitle(ann.title);
    setAnnContent(ann.content);
    setAnnType(ann.type);
    setIsModalOpen(true);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Pengumuman',
      message: 'Apakah Anda yakin ingin menghapus pengumuman ini? Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deleteAnnouncementFromDb(id);
        toast.success('Pengumuman berhasil dihapus.');
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
        toast.error('Gagal menghapus pengumuman.');
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'Urgent': return <AlertCircle size={16} />;
      case 'Event': return <CalendarDays size={16} />;
      default: return <Info size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Urgent': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'Event': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-sky-50 text-sky-600 border-sky-100';
    }
  };

  const handleGenerateWithAi = async () => {
    if (!annTitle) return toast.error('Isi judul pengumuman terlebih dahulu.');
    setIsAiLoading(true);
    try {
      const draft = await generateAnnouncementDraft(annTitle, annType);
      setAnnContent(draft);
      toast.success('Draft pengumuman berhasil dibuat!');
    } catch (error) {
      console.error(error);
      toast.error('Gagal membuat draft pengumuman.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Title Header with Executive Stats Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-indigo-600 rounded-full"></div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Kanal Broadcast Resmi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Pengumuman Warga RT 02</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Kelola siaran pengumuman penting, himbauan lingkungan, dan broadcast WhatsApp warga.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={() => { resetForms(); setIsModalOpen(true); }} 
            className="w-full md:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Buat Pengumuman Baru
          </Button>
        </div>
      </div>

      {/* Glassmorphic Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xs justify-between items-stretch md:items-center">
        <div className="relative flex-1 group">
          <input 
            type="text" 
            placeholder="Cari pengumuman atau kata kunci..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Megaphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
        </div>

        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 max-w-full overflow-x-auto no-scrollbar shadow-inner">
          <div className="flex items-center gap-1 min-w-max">
            {[
              { id: 'All', label: 'Semua Tipe', count: announcements.length },
              { id: 'General', label: 'Info Umum', count: announcements.filter(a => a.type === 'General').length },
              { id: 'Urgent', label: 'Penting', count: announcements.filter(a => a.type === 'Urgent').length },
              { id: 'Event', label: 'Kegiatan', count: announcements.filter(a => a.type === 'Event').length }
            ].map((type) => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFilterType(type.id)}
                className={`
                  px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5
                  ${filterType === type.id 
                    ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'}
                `}
              >
                <span>{type.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${filterType === type.id ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/70 text-slate-500'}`}>
                  {type.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List Card Item */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAnnouncements.map((a: Announcement) => (
            <motion.div 
              key={a.id} 
              variants={itemVariants}
              layout
              className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-indigo-100/30 transition-all group relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
            >
              <div className={`absolute top-0 left-0 w-2 h-full ${
                a.type === 'Urgent' ? 'bg-rose-500' : 
                a.type === 'Event' ? 'bg-indigo-500' : 'bg-sky-500'
              }`} />

              <div className="space-y-2 flex-1 pl-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border flex items-center gap-1 ${getTypeColor(a.type)}`}>
                    {getTypeIcon(a.type)}
                    {a.type === 'Urgent' ? 'PENTING' : a.type === 'Event' ? 'KEGIATAN' : 'INFO UMUM'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <h3 className="text-lg font-black text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-2 leading-relaxed">
                  {a.content}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0 justify-end">
                <button
                  type="button"
                  onClick={() => handleBroadcast(a)}
                  disabled={isBroadcasting === a.id}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {isBroadcasting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  <span>Broadcast WA</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => handleEdit(a)}
                  className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                  title="Edit Pengumuman"
                >
                  <Edit2 size={16} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteAnnouncement(a.id)}
                  className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                  title="Hapus Pengumuman"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredAnnouncements.length === 0 && (
          <motion.div key="empty-announcements" variants={itemVariants} className="py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
              <Megaphone size={40} />
            </div>
            <p className="text-slate-400 font-bold text-lg">Belum ada pengumuman yang cocok.</p>
            <p className="text-slate-400 text-sm mt-1">Coba ubah kata kunci pencarian atau filter.</p>
          </motion.div>
        )}
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
        maxWidth="max-w-4xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Side */}
          <form onSubmit={handleSaveAnnouncement} className="lg:col-span-7 space-y-5">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Judul Pengumuman</label>
              <div className="relative group/input">
                <input 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all" 
                  value={annTitle} 
                  onChange={e=>setAnnTitle(e.target.value)} 
                  placeholder="Contoh: Kerja Bakti Minggu Ini..." 
                  required
                />
              </div>
              <p className="text-[10px] font-bold text-slate-400">Gunakan judul yang singkat dan jelas agar mudah dipahami warga.</p>
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Detail & Isi Pengumuman</label>
                <button 
                  type="button" 
                  onClick={handleGenerateWithAi} 
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200/70 text-[11px] font-black py-1.5 px-3 rounded-full transition-all shrink-0 active:scale-95"
                >
                  {isAiLoading ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} className="text-indigo-600 animate-pulse" />
                  )}
                  <span>{isAiLoading ? 'Menyusun Draft...' : 'Bantu Tulis dengan AI'}</span>
                </button>
              </div>
              <div className="relative group/textarea">
                <textarea 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all min-h-[140px] resize-none" 
                  value={annContent} 
                  onChange={e=>setAnnContent(e.target.value)} 
                  placeholder="Tuliskan detail waktu, tempat, dan instruksi lengkap untuk warga RT 02..." 
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1">Tipe / Kategori</label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { id: 'General', label: 'Info Umum', desc: 'Informasi reguler', icon: <Info size={16} /> },
                  { id: 'Urgent', label: 'Penting', desc: 'Sifatnya mendesak', icon: <AlertTriangle size={16} /> },
                  { id: 'Event', label: 'Kegiatan', desc: 'Acara warga', icon: <CalendarDays size={16} /> }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setAnnType(type.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                      annType === type.id 
                        ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20' 
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-indigo-200 hover:shadow-sm'
                    }`}
                  >
                    <div className={`mb-2 inline-block p-1.5 rounded-xl ${annType === type.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500'} transition-colors`}>
                      {type.icon}
                    </div>
                    <p className={`text-[11px] font-black ${annType === type.id ? 'text-indigo-700' : 'text-slate-700'}`}>{type.label}</p>
                    <p className={`text-[8.5px] font-bold mt-0.5 ${annType === type.id ? 'text-indigo-500' : 'text-slate-400'}`}>{type.desc}</p>
                    
                    {annType === type.id && (
                      <div className="absolute top-2.5 right-2.5 text-indigo-500">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-100">
              <Button type="submit" className="w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 group/submit">
                {editingId ? (
                  <>Simpan Perubahan <CheckCircle2 size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                ) : (
                  <>Terbitkan Pengumuman <Megaphone size={16} className="group-hover/submit:scale-110 transition-transform" /></>
                )}
              </Button>
            </div>
          </form>

          {/* WhatsApp Live Preview Side */}
          <div className="lg:col-span-5 hidden lg:flex flex-col bg-slate-900 rounded-[2.5rem] p-5 text-white border border-slate-800 shadow-xl justify-between min-h-[420px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-widest">LIVE BROADCAST MOCKUP</span>
                </div>
                <MessageCircle size={15} className="text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">Pratinjau Pesan WA Warga:</p>
              
              <div className="bg-[#0b141a] p-4 rounded-2xl border border-slate-800/80 space-y-2 text-xs font-sans shadow-inner leading-relaxed">
                <div className="bg-[#005c4b] text-white p-3.5 rounded-2xl rounded-tr-none shadow-md">
                  <p className="font-extrabold text-emerald-200 text-xs mb-1">
                    📢 PENGUMUMAN RT 02 {annType === 'Urgent' ? '⚠️ (PENTING)' : ''}
                  </p>
                  <p className="font-black text-white text-sm mb-1.5 leading-snug">{annTitle || '[Judul Pengumuman]'}</p>
                  <p className="text-[11px] text-emerald-50 whitespace-pre-wrap leading-relaxed opacity-95">
                    {annContent || '[Isi pengumuman lengkap akan tampil di sini...]'}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-2.5 text-[9px] text-emerald-300 font-mono">
                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span>✓✓</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[9.5px] text-slate-400 font-medium text-center leading-normal">
              Tampilan format otomatis saat pesan dikirim via WhatsApp Gateway RT 02.
            </div>
          </div>
        </div>
      </Modal>

      <Modal 
        isOpen={isBroadcastModalOpen} 
        onClose={() => setIsBroadcastModalOpen(false)} 
        title="Opsi Broadcast WhatsApp"
      >
        <div className="space-y-6">
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <p className="text-sm font-bold text-indigo-900 mb-1">Pilih Target Broadcast</p>
            <p className="text-xs text-indigo-600/70">Tentukan ke mana pengumuman ini akan dikirimkan.</p>
          </div>

          <div className="space-y-3">
            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${broadcastTargets.group ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${broadcastTargets.group ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                  <MessageCircle size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{pdfConfig.whatsappGroupName || 'Grup WhatsApp'}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {pdfConfig.whatsappGroupId ? `ID: ${pdfConfig.whatsappGroupId.substring(0, 15)}...` : 'Belum dikonfigurasi'}
                  </p>
                </div>
              </div>
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={broadcastTargets.group}
                disabled={!pdfConfig.whatsappGroupId}
                onChange={(e) => setBroadcastTargets(prev => ({ ...prev, group: e.target.checked }))}
              />
            </label>

            <label className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer ${broadcastTargets.individual ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${broadcastTargets.individual ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                  <Send size={18} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">Warga Individual</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {houses.filter(h => !!h.phone).length} Nomor Terdaftar
                  </p>
                </div>
              </div>
              <input 
                type="checkbox" 
                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500"
                checked={broadcastTargets.individual}
                onChange={(e) => setBroadcastTargets(prev => ({ ...prev, individual: e.target.checked }))}
              />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setIsBroadcastModalOpen(false)}
              className="flex-1 py-3"
            >
              Batal
            </Button>
            <Button 
              onClick={executeBroadcast}
              className="flex-[2] py-3 shadow-lg shadow-indigo-200"
              disabled={!broadcastTargets.group && !broadcastTargets.individual}
            >
              Kirim Broadcast Sekarang
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
