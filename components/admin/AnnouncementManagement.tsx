import React, { useState } from 'react';
import { Plus, Trash2, Megaphone, Calendar, AlertCircle, Info, CalendarDays, Edit2, MessageCircle, Sparkles, Send } from 'lucide-react';
import { Announcement, House, PdfConfig } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addAnnouncementToDb, deleteAnnouncementFromDb, updateAnnouncementInDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { sendWhatsAppMessage, formatAnnouncementForWhatsApp, broadcastWhatsApp } from '../../services/whatsappService';
import { generateAnnouncementDraft } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface AnnouncementManagementProps {
  announcements: Announcement[];
  houses: House[];
  pdfConfig: PdfConfig;
}

export const AnnouncementManagement: React.FC<AnnouncementManagementProps> = ({ announcements, houses, pdfConfig }) => {
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
    toast.info('Hapus pengumuman ini?', {
      action: {
        label: 'Hapus',
        onClick: async () => {
          try {
            await deleteAnnouncementFromDb(id);
            toast.success('Pengumuman berhasil dihapus.');
          } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, `announcements/${id}`);
            toast.error('Gagal menghapus pengumuman.');
          }
        }
      },
      cancel: {
        label: 'Batal',
        onClick: () => {}
      }
    });
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
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Pengumuman Warga</h2>
          <p className="text-slate-500 font-medium mt-1">Kelola informasi dan berita untuk warga RT 02.</p>
        </div>
        <Button onClick={() => { resetForms(); setIsModalOpen(true); }} className="shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all hover:scale-105 active:scale-95">
          <Plus size={18} className="mr-2"/> Buat Pengumuman
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <input 
          type="text" 
          placeholder="Cari pengumuman..." 
          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="All">Semua Tipe</option>
          <option value="Info">Info Umum</option>
          <option value="Urgent">Penting</option>
          <option value="Event">Kegiatan</option>
        </select>
      </div>

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredAnnouncements.map((a: Announcement) => (
            <motion.div 
              key={a.id} 
              variants={itemVariants}
              layout
              className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden"
            >
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                a.type === 'Urgent' ? 'bg-rose-500' : 
                a.type === 'Event' ? 'bg-indigo-500' : 
                'bg-sky-500'
              }`}></div>
              
              <div className="flex flex-col md:flex-row justify-between gap-4 pl-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getTypeColor(a.type)}`}>
                      {getTypeIcon(a.type)}
                      {a.type}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                      <Calendar size={12} />
                      {new Date(a.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <h4 className="font-black text-xl text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">{a.title}</h4>
                  <p className="text-sm text-slate-500 leading-relaxed">{a.content}</p>
                </div>
                
                <div className="flex items-start gap-2">
                  <button 
                    onClick={() => handleBroadcast(a)} 
                    disabled={isBroadcasting === a.id}
                    className={`p-3 rounded-xl transition-all ${isBroadcasting === a.id ? 'text-indigo-400 bg-indigo-50 animate-pulse' : 'text-slate-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                    title="Broadcast via WA Gateway"
                  >
                    <Send size={20}/>
                  </button>
                  <button 
                    onClick={() => sendWhatsAppMessage('081234567890', formatAnnouncementForWhatsApp(a.title, a.content))} 
                    className="p-3 rounded-xl text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                    title="Bagikan ke WhatsApp (Personal)"
                  >
                    <MessageCircle size={20}/>
                  </button>
                  <button 
                    onClick={() => handleEdit(a)} 
                    className="p-3 rounded-xl text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                    title="Edit Pengumuman"
                  >
                    <Edit2 size={20}/>
                  </button>
                  <button 
                    onClick={() => handleDeleteAnnouncement(a.id)} 
                    className="p-3 rounded-xl text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                    title="Hapus Pengumuman"
                  >
                    <Trash2 size={20}/>
                  </button>
                </div>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Pengumuman" : "Buat Pengumuman Baru"}>
        <form onSubmit={handleSaveAnnouncement} className="space-y-5">
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Judul Pengumuman <span className="text-rose-500">*</span></label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={annTitle} onChange={e=>setAnnTitle(e.target.value)} placeholder="Contoh: Kerja Bakti Minggu Ini" required/>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Isi Pengumuman <span className="text-rose-500">*</span></label>
            <Button type="button" onClick={handleGenerateWithAi} className="mb-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-none text-xs py-2 px-3">
              <Sparkles size={14} className="mr-2" /> {isAiLoading ? 'Memproses...' : 'Buat dengan AI'}
            </Button>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[120px]" rows={4} value={annContent} onChange={e=>setAnnContent(e.target.value)} placeholder="Tulis detail pengumuman di sini..." required/>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Tipe / Kategori <span className="text-rose-500">*</span></label>
            <div className="grid grid-cols-3 gap-3">
              {['Info', 'Urgent', 'Event'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAnnType(type)}
                  className={`p-3 rounded-xl border text-sm font-bold transition-all flex flex-col items-center gap-2 ${
                    annType === type 
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-600 ring-1 ring-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {getTypeIcon(type)}
                  {type === 'Info' ? 'Info Umum' : type === 'Urgent' ? 'Penting' : 'Kegiatan'}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full py-3.5 text-sm shadow-xl shadow-indigo-200 mt-2">
            {editingId ? 'Simpan Perubahan' : 'Terbitkan Pengumuman'}
          </Button>
        </form>
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
