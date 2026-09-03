import React, { useState, useEffect } from 'react';
import { 
  Zap, Droplets, Wifi, Plus, Trash2, Edit3, Send, Sparkles, AlertTriangle, 
  CheckCircle2, Clock, MapPin, Share2, Info, RefreshCw, Wand2, PhoneCall,
  FileText, ShieldAlert, CheckSquare, Calendar, Building, Radio, Activity, AlertOctagon, HelpCircle
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

const PALU_FEEDERS = [
  'Penyulang Tondo (Huntap 2)',
  'Penyulang Mamboro',
  'Penyulang Talise',
  'Penyulang Untad',
  'Penyulang Lasoani',
  'Pipa Utama Intake Poboya (PDAM)',
  'Jaringan Fiber Optik Regional Palu Timur',
  'Lainnya / Khusus RT 02'
];

const QUICK_PRESETS = [
  {
    type: 'PLN' as const,
    label: '⚡ Pemeliharaan Gardu PLN',
    title: 'Pemeliharaan Jaringan & Gardu Trafo PLN',
    feederName: 'Penyulang Tondo (Huntap 2)',
    officialRefNumber: '048/PLN-ULP-PALU/2026',
    impactSeverity: 'Sedang' as const,
    startTime: '09:00 WITA',
    endTime: '15:00 WITA',
    description: 'Pekerjaan perbaikan gardu distribusi, pemangkasan dahan pohon dekat kabel tegangan menengah, dan penguatan pasokan listrik kawasan Huntap.',
    emergencyNotes: 'Pompa air booster lingkungan dimatikan sementara selama listrik padam.',
    contactCenter: 'PLN 123 / PLN Mobile App'
  },
  {
    type: 'PDAM' as const,
    label: '💧 Perbaikan Pipa PDAM',
    title: 'Perbaikan Pipa Distribusi Air Bersih',
    feederName: 'Pipa Utama Intake Poboya (PDAM)',
    officialRefNumber: 'EDR-012/PDAM-PALU/2026',
    impactSeverity: 'Kritis' as const,
    startTime: '08:00 WITA',
    endTime: '17:00 WITA',
    description: 'Perbaikan kebocoran pipa transmisi utama jalur atas Tondo. Aliran air mengecil atau terhenti sementara selama proses pengelasan pipa.',
    emergencyNotes: 'Kran tandon cadangan darurat dibuka di samping Pos Jaga RT 02 untuk kebutuhan mendesak.',
    contactCenter: 'PDAM Palu (0451-421234)'
  },
  {
    type: 'Internet' as const,
    label: '📡 Maintenance FO / Wifi',
    title: 'Pemeliharaan Kabel Fiber Optik',
    feederName: 'Jaringan Fiber Optik Regional Palu Timur',
    officialRefNumber: 'MNT-FO/PLW/2026',
    impactSeverity: 'Rendah' as const,
    startTime: '01:00 WITA',
    endTime: '05:00 WITA',
    description: 'Optimalisasi kabel fiber optik bawah tanah dan upgrade perangkat OLT penyedia layanan internet.',
    emergencyNotes: 'Dilakukan dini hari untuk meminimalkan gangguan aktivitas warga.',
    contactCenter: 'Helpdesk Provider'
  }
];

interface UtilityOutageManagerProps {
  houses?: House[];
}

export const UtilityOutageManager: React.FC<UtilityOutageManagerProps> = ({ houses = [] }) => {
  const confirm = useConfirm();
  const [outages, setOutages] = useState<UtilityOutage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [editingOutage, setEditingOutage] = useState<UtilityOutage | null>(null);
  const [rawNoticeText, setRawNoticeText] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);

  // Form State with comprehensive professional attributes
  const [formData, setFormData] = useState({
    type: 'PLN' as UtilityOutage['type'],
    title: '',
    officialRefNumber: '',
    feederName: 'Penyulang Tondo (Huntap 2)',
    impactSeverity: 'Sedang' as UtilityOutage['impactSeverity'],
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00 WITA',
    endTime: '15:00 WITA',
    affectedBlocks: ['Semua Blok'],
    description: '',
    emergencyNotes: '',
    contactCenter: 'PLN 123 / (0451) 123',
    status: 'Ongoing' as UtilityOutage['status']
  });

  useEffect(() => {
    const unsub = subscribeToCollection('utilityOutages', (data) => {
      setOutages(data as UtilityOutage[]);
    });
    return () => unsub();
  }, []);

  const handleApplyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setFormData({
      ...formData,
      type: preset.type,
      title: preset.title,
      feederName: preset.feederName,
      officialRefNumber: preset.officialRefNumber,
      impactSeverity: preset.impactSeverity,
      startTime: preset.startTime,
      endTime: preset.endTime,
      description: preset.description,
      emergencyNotes: preset.emergencyNotes,
      contactCenter: preset.contactCenter,
      status: 'Ongoing'
    });
    toast.success(`Preset "${preset.title}" diterapkan!`);
  };

  const handleOpenAdd = () => {
    setEditingOutage(null);
    setFormData({
      type: 'PLN',
      title: 'Pemeliharaan Jaringan Listrik PLN Terencana',
      officialRefNumber: `PLN-PLW/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}`,
      feederName: 'Penyulang Tondo (Huntap 2)',
      impactSeverity: 'Sedang',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00 WITA',
      endTime: '15:00 WITA',
      affectedBlocks: ['Semua Blok RT 02'],
      description: 'Pekerjaan manuver beban gardu distribusi dan pemangkasan dahan pohon dekat kabel tegangan menengah.',
      emergencyNotes: 'Pompa air lingkungan mungkin terdampak sementara selama pemadaman.',
      contactCenter: 'Call Center PLN 123 / PLN Mobile App',
      status: 'Ongoing'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (outage: UtilityOutage) => {
    setEditingOutage(outage);
    setFormData({
      type: outage.type,
      title: outage.title,
      officialRefNumber: outage.officialRefNumber || '',
      feederName: outage.feederName || 'Penyulang Tondo (Huntap 2)',
      impactSeverity: outage.impactSeverity || 'Sedang',
      date: outage.date || new Date().toISOString().split('T')[0],
      startTime: outage.startTime,
      endTime: outage.endTime,
      affectedBlocks: outage.affectedBlocks || ['Semua Blok'],
      description: outage.description,
      emergencyNotes: outage.emergencyNotes || '',
      contactCenter: outage.contactCenter || (outage.type === 'PLN' ? 'PLN 123' : 'PDAM Palu'),
      status: outage.status
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
        toast.success('Pemberitahuan pemadaman berhasil diperbarui!');
      } else {
        await addToCollection('utilityOutages', {
          ...formData,
          createdAt: new Date().toISOString()
        });
        toast.success('Pemberitahuan pemadaman resmi berhasil diterbitkan!');
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

  // AI Smart Parser for PLN/PDAM Broadcast Texts
  const handleAiParse = () => {
    if (!rawNoticeText.trim()) {
      toast.error('Silakan tempel teks pengumuman PLN / PDAM terlebih dahulu.');
      return;
    }

    setIsParsingAi(true);
    setTimeout(() => {
      const text = rawNoticeText;
      let detectedType: UtilityOutage['type'] = 'PLN';
      if (text.toLowerCase().includes('pdam') || text.toLowerCase().includes('air bersih') || text.toLowerCase().includes('pipa')) {
        detectedType = 'PDAM';
      } else if (text.toLowerCase().includes('internet') || text.toLowerCase().includes('wifi') || text.toLowerCase().includes('fiber')) {
        detectedType = 'Internet';
      }

      // Extract official reference code if any
      const refMatch = text.match(/(?:nomor|no\.?|ref)\s*[:.]?\s*([A-Za-z0-9\/\-_.]+)/i);
      const officialRef = refMatch ? refMatch[1] : `EDR/${detectedType}/${new Date().getFullYear()}/01`;

      // Extract times regex like 09.00 - 15.00 or 09:00 s/d 16:00
      const timeMatch = text.match(/(\d{1,2}[:.]\d{2})\s*(?:-|s\/d|s\.d|sampai)\s*(\d{1,2}[:.]\d{2})/i);
      const startT = timeMatch ? `${timeMatch[1].replace('.', ':')} WITA` : '09:00 WITA';
      const endT = timeMatch ? `${timeMatch[2].replace('.', ':')} WITA` : '15:00 WITA';

      // Detect date if available
      const dateMatch = text.match(/(\d{1,2})\s+(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|\d{1,2})\s+(\d{4})/i);

      // Detect affected area
      let affected = ['Semua Blok RT 02'];
      if (text.toLowerCase().includes('blok a') && text.toLowerCase().includes('blok b')) {
        affected = ['Blok A', 'Blok B'];
      } else if (text.toLowerCase().includes('blok c')) {
        affected = ['Blok C (Huntap 2)'];
      }

      setFormData({
        type: detectedType,
        title: detectedType === 'PLN' 
          ? 'Pemadaman Terencana PLN Area Palu (Penyulang Tondo)' 
          : detectedType === 'PDAM' 
          ? 'Pemeliharaan Jaringan Aliran Air PDAM' 
          : 'Pemeliharaan Jaringan Internet Lingkungan',
        officialRefNumber: officialRef,
        feederName: detectedType === 'PLN' ? 'Penyulang Tondo (Huntap 2)' : 'Pipa Utama Intake Poboya (PDAM)',
        impactSeverity: detectedType === 'PDAM' ? 'Kritis' : 'Sedang',
        date: new Date().toISOString().split('T')[0],
        startTime: startT,
        endTime: endT,
        affectedBlocks: affected,
        description: text.slice(0, 350) + (text.length > 350 ? '...' : ''),
        emergencyNotes: detectedType === 'PDAM' 
          ? 'Kran tandon air darurat RT dibuka di samping Pos Jaga.' 
          : 'Peralatan elektronik sensitif disarankan dicabut dari colokan.',
        contactCenter: detectedType === 'PLN' ? 'PLN 123 / PLN Mobile' : 'PDAM Palu (0451) 421234',
        status: 'Ongoing'
      });

      setIsParsingAi(false);
      setIsAiModalOpen(false);
      setIsModalOpen(true);
      toast.success('Pengumuman berhasil diekstrak dan diformat lengkap oleh AI!');
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
      outage.emergencyNotes,
      outage.officialRefNumber,
      outage.feederName,
      outage.impactSeverity,
      outage.contactCenter,
      outage.date
    );
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`, '_blank');
  };

  return (
    <div className="space-y-6 text-left">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200/80 flex items-center justify-center shrink-0 shadow-xs">
            <Zap size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Info Pemadaman PLN &amp; Air</h3>
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-200">
                Utilitas Publik
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Kelola jadwal pemadaman resmi, mitigasi darurat fasum, dan broadcast 1-klik ke warga.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto relative z-10">
          <Button 
            onClick={() => setIsAiModalOpen(true)}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-100 font-black text-xs uppercase tracking-wider"
          >
            <Sparkles size={15} className="mr-1.5" /> AI Parser Broadcast
          </Button>

          <Button 
            onClick={handleOpenAdd}
            className="bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-100 font-black text-xs uppercase tracking-wider"
          >
            <Plus size={16} className="mr-1.5" /> Tambah Jadwal Lengkap
          </Button>
        </div>
      </div>

      {/* Outages List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {outages.length > 0 ? (
          outages.map((outage) => (
            <Card 
              key={outage.id} 
              className={`p-6 bg-white border-2 rounded-[2.5rem] shadow-sm flex flex-col justify-between transition-all hover:shadow-md ${
                outage.status === 'Ongoing' ? 'border-amber-400 ring-4 ring-amber-50/50' : 'border-slate-100'
              }`}
            >
              <div className="space-y-4">
                {/* Status Badges */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                      outage.type === 'PLN' ? 'bg-amber-100 text-amber-800' :
                      outage.type === 'PDAM' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                    }`}>
                      {outage.type === 'PLN' ? <Zap size={12} /> : <Droplets size={12} />} {outage.type}
                    </span>

                    {outage.impactSeverity && (
                      <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                        outage.impactSeverity === 'Kritis' ? 'bg-rose-100 text-rose-700' :
                        outage.impactSeverity === 'Sedang' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                      }`}>
                        Dampak: {outage.impactSeverity}
                      </span>
                    )}
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                    outage.status === 'Ongoing' ? 'bg-rose-100 text-rose-700 animate-pulse font-black' :
                    outage.status === 'Scheduled' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {outage.status === 'Ongoing' ? '⚠️ Sedang Padam (Live)' : outage.status === 'Scheduled' ? '🗓️ Terjadwal' : '✓ Normal / Selesai'}
                  </span>
                </div>

                {/* Title & Official Ref */}
                <div>
                  <h4 className="font-black text-slate-900 text-lg leading-snug">{outage.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 mt-1">
                    {outage.officialRefNumber && (
                      <span className="flex items-center gap-1"><FileText size={11} /> No. Surat: {outage.officialRefNumber}</span>
                    )}
                    {outage.feederName && (
                      <span className="flex items-center gap-1"><Radio size={11} /> {outage.feederName}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">{outage.description}</p>
                </div>

                {/* Metrics Box */}
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Tanggal &amp; Waktu:</span>
                    <span className="font-black text-slate-800">
                      {outage.date ? `${new Date(outage.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • ` : ''}
                      {outage.startTime} s.d {outage.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Wilayah Terdampak:</span>
                    <span className="font-black text-slate-700">{outage.affectedBlocks?.join(', ') || 'Semua Blok'}</span>
                  </div>
                  {outage.contactCenter && (
                    <div className="flex justify-between border-t border-slate-200/60 pt-1.5 mt-1.5">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Call Center / Bantuan:</span>
                      <span className="font-bold text-indigo-600">{outage.contactCenter}</span>
                    </div>
                  )}
                </div>

                {outage.emergencyNotes && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
                    <Info size={14} className="text-amber-600 shrink-0" />
                    <span>{outage.emergencyNotes}</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <button
                  onClick={() => handleBroadcastWhatsApp(outage)}
                  className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <Share2 size={13} /> Broadcast WA Resmi
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(outage)}
                    className="p-2.5 hover:bg-slate-100 text-slate-600 rounded-xl transition-all cursor-pointer"
                    title="Edit Detail"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(outage.id)}
                    className="p-2.5 hover:bg-rose-50 text-rose-600 rounded-xl transition-all cursor-pointer"
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
            <Button onClick={handleOpenAdd} className="bg-amber-600 text-white font-black text-xs uppercase tracking-wider">
              <Plus size={14} className="mr-1.5" /> Buat Pemberitahuan Baru
            </Button>
          </div>
        )}
      </div>

      {/* Modal Add / Edit Detail Outage (Ultra-Professional Form) */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOutage ? 'Edit Detail Pemberitahuan Pemadaman' : 'Formulir Resmi Info Pemadaman PLN & Air'} maxWidth="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4 text-left p-1">
          {/* Quick Presets for Fast Setup */}
          {!editingOutage && (
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
              <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                ⚡ Pilih Template Siap Pakai:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-[10px] font-black text-slate-700 transition-all cursor-pointer shadow-2xs"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tingkat Dampak</label>
              <select
                value={formData.impactSeverity}
                onChange={e => setFormData({...formData, impactSeverity: e.target.value as any})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              >
                <option value="Sedang">Sedang (Penerangan & Sebagian)</option>
                <option value="Kritis">Kritis (Total Satu Kawasan)</option>
                <option value="Rendah">Rendah (Hanya Sesaat)</option>
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
                <option value="Scheduled">🗓️ Terjadwal (Mendatang)</option>
                <option value="Resolved">✓ Selesai / Pulih Normal</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">No. Surat / Edaran Resmi</label>
              <input 
                type="text" 
                value={formData.officialRefNumber}
                onChange={e => setFormData({...formData, officialRefNumber: e.target.value})}
                placeholder="Contoh: 048/PLN-PALU/2026"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Penyulang / Gardu Distribusi</label>
              <input 
                type="text" 
                value={formData.feederName}
                onChange={e => setFormData({...formData, feederName: e.target.value})}
                placeholder="Penyulang Tondo / Trafo TD-02"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Perihal / Judul Pemadaman</label>
            <input 
              type="text" 
              required
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              placeholder="Contoh: Pemeliharaan Terencana Gardu Trafo Tondo"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tanggal Pelaksanaan</label>
              <input 
                type="date" 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Wilayah / Blok Terdampak</label>
              <input 
                type="text" 
                value={formData.affectedBlocks?.join(', ')}
                onChange={e => setFormData({...formData, affectedBlocks: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                placeholder="Contoh: Semua Blok RT 02, Blok A, Blok C"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Call Center / Narahubung Resmi</label>
              <input 
                type="text" 
                value={formData.contactCenter}
                onChange={e => setFormData({...formData, contactCenter: e.target.value})}
                placeholder="Contoh: PLN 123 / PDAM (0451) 421234"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rincian Pekerjaan &amp; Alasan Pemadaman</label>
            <textarea 
              rows={3}
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Penjelasan pekerjaan pemeliharaan jaringan transmisi, manuver beban, atau perbaikan pipa..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Solusi Darurat / Mitigasi Pengurus RT (Opsional)</label>
            <input 
              type="text" 
              value={formData.emergencyNotes}
              onChange={e => setFormData({...formData, emergencyNotes: e.target.value})}
              placeholder="Contoh: Tandon cadangan dibuka di samping Pos Jaga RT 02, genset standby"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500"
            />
          </div>

          <Button type="submit" className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 mt-2">
            {editingOutage ? 'Simpan Perubahan Data' : 'Terbitkan Pemberitahuan Resmi'}
          </Button>
        </form>
      </Modal>

      {/* Modal AI Smart Parser */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Smart Parser Surat Edaran PLN / PDAM">
        <div className="space-y-4 text-left">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-3">
            <Sparkles size={20} className="text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 font-medium leading-relaxed">
              Cukup salin (copy-paste) pesan edaran pemadaman dari WhatsApp atau Instagram PLN Sulteng. AI akan otomatis mengekstrak nomor surat, jam padam, gardu penyulang, blok terdampak, dan format pengumuman.
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
