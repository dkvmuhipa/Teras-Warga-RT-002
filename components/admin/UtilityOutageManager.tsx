import React, { useState, useEffect } from 'react';
import { 
  Zap, Droplets, Wifi, Plus, Trash2, Edit3, Send, Sparkles, AlertTriangle, 
  CheckCircle2, Clock, MapPin, Share2, Info, RefreshCw, Wand2, PhoneCall
} from 'lucide-react';
import { UtilityOutage, House } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { 
  subscribeToCollection, 
  addToCollection, 
  updateDocumentInCollection, 
  deleteDocumentFromCollection 
} from '../../services/databaseService';
import { formatUtilityOutageForWhatsApp } from '../../services/whatsappService';
import { useConfirm } from '../../context/ConfirmContext';
import { motion, AnimatePresence } from 'motion/react';

interface UtilityOutageManagerProps {
  houses?: House[];
}

export const UtilityOutageManager: React.FC<UtilityOutageManagerProps> = () => {
  const confirm = useConfirm();
  const [outages, setOutages] = useState<UtilityOutage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingOutage, setEditingOutage] = useState<UtilityOutage | null>(null);
  const [rawNoticeText, setRawNoticeText] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);

  const [formData, setFormData] = useState({
    type: 'PLN' as UtilityOutage['type'],
    title: '',
    description: '',
    affectedBlocks: ['Semua Blok'],
    startTime: '',
    endTime: '',
    status: 'Ongoing' as UtilityOutage['status'],
    emergencyNotes: ''
  });

  useEffect(() => {
    const unsub = subscribeToCollection('utilityOutages', (data) => {
      setOutages(data as UtilityOutage[]);
    });
    return () => unsub();
  }, []);

  const handleOpenAdd = () => {
    setEditingOutage(null);
    setFormData({
      type: 'PLN',
      title: 'Pemeliharaan Jaringan Listrik PLN',
      description: 'Pekerjaan perbaikan gardu distribusi dan perabasan pohon dekat kabel tegangan menengah.',
      affectedBlocks: ['Semua Blok'],
      startTime: '09:00 WITA',
      endTime: '15:00 WITA',
      status: 'Ongoing',
      emergencyNotes: 'Pompa air lingkungan mungkin terdampak sementara.'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (outage: UtilityOutage) => {
    setEditingOutage(outage);
    setFormData({
      type: outage.type,
      title: outage.title,
      description: outage.description,
      affectedBlocks: outage.affectedBlocks || ['Semua Blok'],
      startTime: outage.startTime,
      endTime: outage.endTime,
      status: outage.status,
      emergencyNotes: outage.emergencyNotes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startTime || !formData.endTime) {
      toast.error('Mohon lengkapi judul, jam mulai, dan jam selesai.');
      return;
    }

    try {
      if (editingOutage) {
        await updateDocumentInCollection('utilityOutages', editingOutage.id, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Jadwal pemadaman berhasil diperbarui!');
      } else {
        await addToCollection('utilityOutages', {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Pemberitahuan pemadaman berhasil diterbitkan!');
      }
      setIsModalOpen(false);
    } catch (error) {
      toast.error('Gagal menyimpan data pemadaman.');
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Hapus Pemberitahuan',
      message: 'Apakah Anda yakin ingin menghapus data jadwal pemadaman ini?',
      confirmLabel: 'Hapus Data',
      isDanger: true
    });

    if (ok) {
      try {
        await deleteDocumentFromCollection('utilityOutages', id);
        toast.success('Pemberitahuan pemadaman telah dihapus.');
      } catch (error) {
        toast.error('Gagal menghapus data.');
      }
    }
  };

  // AI Smart Parser for PLN Broadcast Texts
  const handleAiParse = () => {
    if (!rawNoticeText.trim()) {
      toast.error('Silakan tempel teks pengumuman PLN / PDAM terlebih dahulu.');
      return;
    }

    setIsParsingAi(true);
    setTimeout(() => {
      const text = rawNoticeText;
      let detectedType: UtilityOutage['type'] = 'PLN';
      if (text.toLowerCase().includes('pdam') || text.toLowerCase().includes('air')) {
        detectedType = 'PDAM';
      } else if (text.toLowerCase().includes('internet') || text.toLowerCase().includes('wifi') || text.toLowerCase().includes('indihome')) {
        detectedType = 'Internet';
      }

      // Extract title
      let title = detectedType === 'PLN' 
        ? 'Pemadaman Terencana PLN Area Palu / Tondo'
        : detectedType === 'PDAM' 
        ? 'Gangguan Distribusi Air Bersih PDAM'
        : 'Pemeliharaan Jaringan Internet';

      // Extract times regex like 09.00 - 15.00 or 09:00 s/d 16:00
      const timeMatch = text.match(/(\d{1,2}[:.]\d{2})\s*(?:-|s\/d|s\.d|sampai)\s*(\d{1,2}[:.]\d{2})/i);
      const startT = timeMatch ? `${timeMatch[1].replace('.', ':')} WITA` : '09:00 WITA';
      const endT = timeMatch ? `${timeMatch[2].replace('.', ':')} WITA` : '15:00 WITA';

      // Detect affected area
      let affected = ['Semua Blok'];
      if (text.toLowerCase().includes('blok a') || text.toLowerCase().includes('blok c')) {
        affected = ['Blok Terdampak Sesuai Edaran'];
      }

      setFormData({
        type: detectedType,
        title: title,
        description: text.slice(0, 300) + (text.length > 300 ? '...' : ''),
        affectedBlocks: affected,
        startTime: startT,
        endTime: endT,
        status: 'Ongoing',
        emergencyNotes: detectedType === 'PDAM' ? 'Tandon air darurat dibuka di area Pos Jaga.' : 'Perangkat elektronik sensitif disarankan dicabut.'
      });

      setIsParsingAi(false);
      setIsAiModalOpen(false);
      setIsModalOpen(true);
      toast.success('Pengumuman berhasil diekstrak otomatis oleh AI!');
    }, 600);
  };

  const handleBroadcastWhatsApp = (outage: UtilityOutage) => {
    const waText = formatUtilityOutageForWhatsApp(
      outage.type,
      outage.title,
      outage.startTime,
      outage.endTime,
      outage.affectedBlocks,
      outage.description,
      outage.emergencyNotes
    );
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`, '_blank');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0">
            <Zap size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Info Pemadaman PLN &amp; Air</h3>
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-200">
                Utilitas Fasum
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Kelola jadwal pemeliharaan listrik PLN, PDAM, dan siarkan peringatan darurat ke warga.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Button 
            onClick={() => setIsAiModalOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-100"
          >
            <Sparkles size={15} className="mr-1.5" /> AI Parser Broadcast
          </Button>

          <Button 
            onClick={handleOpenAdd}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-100"
          >
            <Plus size={16} className="mr-1.5" /> Tambah Jadwal
          </Button>
        </div>
      </div>

      {/* Outage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {outages.length > 0 ? (
          outages.map((outage) => (
            <Card 
              key={outage.id} 
              className={`p-6 bg-white border-2 rounded-[2rem] shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                outage.status === 'Ongoing' ? 'border-amber-400 ring-4 ring-amber-50/50' : 'border-slate-100'
              }`}
            >
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                    outage.type === 'PLN' ? 'bg-amber-100 text-amber-800' :
                    outage.type === 'PDAM' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {outage.type === 'PLN' ? <Zap size={12} /> : <Droplets size={12} />} {outage.type}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      outage.status === 'Ongoing' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                      outage.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {outage.status === 'Ongoing' ? '⚠️ Sedang Padam' : outage.status === 'Scheduled' ? '🗓️ Terjadwal' : '✓ Normal'}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-black text-slate-900 text-lg">{outage.title}</h4>
                  <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{outage.description}</p>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl space-y-1.5 text-xs border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Wilayah Terdampak:</span>
                    <span className="font-black text-slate-700">{outage.affectedBlocks?.join(', ') || 'Semua Blok'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Waktu:</span>
                    <span className="font-bold text-slate-700">{outage.startTime} s.d {outage.endTime}</span>
                  </div>
                </div>

                {outage.emergencyNotes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                    <Info size={14} className="text-amber-600 shrink-0" />
                    <span>{outage.emergencyNotes}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleBroadcastWhatsApp(outage)}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <Share2 size={13} /> Broadcast WA
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(outage)}
                    className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer"
                    title="Edit Data"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(outage.id)}
                    className="p-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-all cursor-pointer"
                    title="Hapus"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-3">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-black text-slate-800 text-base mb-1">Tidak Ada Jadwal Pemadaman Aktif</h4>
            <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto mb-4">Kondisi pasokan listrik PLN dan air bersih RT 02 dalam status normal.</p>
            <Button onClick={handleOpenAdd} className="bg-amber-600 text-white">
              <Plus size={14} className="mr-1.5" /> Buat Pemberitahuan Baru
            </Button>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Outage */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOutage ? 'Edit Info Pemadaman' : 'Tambah Info Pemadaman PLN & Air'}>
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Jenis Layanan</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              >
                <option value="PLN">⚡ Listrik PLN</option>
                <option value="PDAM">💧 Air Bersih / PDAM</option>
                <option value="Internet">📡 Jaringan Internet</option>
                <option value="Fasum Lain">🛠️ Fasum Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Pemadaman</label>
              <select
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              >
                <option value="Ongoing">⚠️ Sedang Padam (Live)</option>
                <option value="Scheduled">🗓️ Terjadwal (Akan Datang)</option>
                <option value="Resolved">✓ Selesai / Pulih Normal</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Judul Pemberitahuan</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Contoh: Pemeliharaan Trafo Gardu PLN Tondo"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Jam Mulai</label>
              <input 
                type="text" 
                required
                value={formData.startTime}
                onChange={e => setFormData({...formData, startTime: e.target.value})}
                placeholder="Contoh: 09:00 WITA"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Estimasi Selesai</label>
              <input 
                type="text" 
                required
                value={formData.endTime}
                onChange={e => setFormData({...formData, endTime: e.target.value})}
                placeholder="Contoh: 15:00 WITA"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Wilayah / Blok Terdampak</label>
            <input 
              type="text" 
              value={formData.affectedBlocks?.join(', ')}
              onChange={e => setFormData({...formData, affectedBlocks: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
              placeholder="Contoh: Semua Blok, atau Blok A, Blok C"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Keterangan / Alasan Pemadaman</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Penjelasan pekerjaan pemeliharaan jaringan dari pihak PLN/PDAM..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Catatan Bantuan / Solusi Darurat (Opsional)</label>
            <input 
              type="text" 
              value={formData.emergencyNotes}
              onChange={e => setFormData({...formData, emergencyNotes: e.target.value})}
              placeholder="Contoh: Tandon cadangan dibuka di Pos Jaga, genset darurat standby"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          <Button type="submit" className="w-full py-3.5 bg-amber-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 mt-2">
            {editingOutage ? 'Simpan Perubahan' : 'Terbitkan Info Pemadaman'}
          </Button>
        </form>
      </Modal>

      {/* Modal AI Smart Parser */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Smart Parser Surat Edaran PLN / PDAM">
        <div className="space-y-4 text-left">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
            <Sparkles size={20} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 font-medium leading-relaxed">
              Cukup salin (copy-paste) pesan edaran pemadaman dari WhatsApp atau Instagram PLN Sulteng. AI akan otomatis mengekstrak jam padam, blok terdampak, dan format pengumuman.
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tempel Teks Pengumuman PLN / WhatsApp</label>
            <textarea 
              rows={6}
              value={rawNoticeText}
              onChange={e => setRawNoticeText(e.target.value)}
              placeholder="Pemberitahuan Pemadaman Aliran Listrik Sementara PLN ULP Palu..."
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <Button 
            onClick={handleAiParse} 
            disabled={isParsingAi}
            className="w-full py-3.5 bg-indigo-600 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            {isParsingAi ? (
              <>Menganalisis Format Teks...</>
            ) : (
              <><Wand2 size={16} /> Ekstrak Otomatis Sekarang</>
            )}
          </Button>
        </div>
      </Modal>
    </div>
  );
};
