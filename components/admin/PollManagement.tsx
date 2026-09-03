import React, { useState } from 'react';
import { 
  Plus, Trash2, Vote, Calendar, Clock, Lock, CheckCircle2, CalendarDays, 
  Sparkles, ShieldCheck, CheckSquare, Layers, Download, Award, User, 
  FileText, Users, ChevronRight, BarChart3, PieChart
} from 'lucide-react';
import { Poll, PollCandidate, House, PdfConfig } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addPollToDb, updatePollStatus, deletePollFromDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { generateAnnouncementDraft } from '../../services/geminiService';
import { generateElectionMinutesPDF } from '../../services/pdfService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface PollManagementProps {
  polls: Poll[];
  houses?: House[];
  pdfConfig?: PdfConfig;
}

export const PollManagement: React.FC<PollManagementProps> = ({ polls, houses = [], pdfConfig }) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Election' | 'Policy'>('All');
  
  // Selected Poll for PDF Minutes Export
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedPollForPdf, setSelectedPollForPdf] = useState<Poll | null>(null);
  const [committeeForm, setCommitteeForm] = useState({
    committeeChairman: 'Ketua Panitia Pemilihan RT 02',
    committeeSecretary: 'Sekretaris Panitia Pemilihan',
    witnessName: 'Saksi Perwakilan Warga'
  });

  // Enhanced Form State
  const [pollType, setPollType] = useState<'Election' | 'Policy' | 'QuickPoll'>('Election');
  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollCategory, setPollCategory] = useState<'Kebijakan RT' | 'Pemilihan Pengurus' | 'Fasilitas' | 'Kegiatan/Acara'>('Pemilihan Pengurus');
  const [pollDeadline, setPollDeadline] = useState('');
  const [isSecret, setIsSecret] = useState(true);
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Candidates for Election type
  const [candidates, setCandidates] = useState<Omit<PollCandidate, 'votes'>[]>([
    {
      id: 'cand_1',
      candidateNumber: 1,
      name: '',
      profession: 'Wiraswasta / Warga Blok C',
      vision: 'Mewujudkan RT 02 yang aman, guyub, dan transparan dalam pengelolaan kas warga.',
      missions: ['Mengoptimalkan ronda malam & fasilitas CCTV', 'Transparansi kas RT melalui digitalisasi']
    },
    {
      id: 'cand_2',
      candidateNumber: 2,
      name: '',
      profession: 'Karyawan Swasta / Warga Blok B',
      vision: 'Lingkungan hijau, bersih, dan ramah anak dengan pemberdayaan UMKM warga.',
      missions: ['Program bank sampah terpadu & kerja bakti rutin', 'Pengembangan fasilitas bermain anak & taman fasum']
    }
  ]);
  const [pollOptions, setPollOptions] = useState<{id: string, text: string}[]>([
    { id: 'opt1', text: 'Setuju' },
    { id: 'opt2', text: 'Tidak Setuju' }
  ]);

  const resetForms = () => {
    setPollType('Election');
    setPollTitle('Pemilihan Ketua RT 02 Periode 2026 - 2029');
    setPollDesc('Pemungutan suara pemilihan Ketua RT 02 Kelurahan Tondo secara digital (1 Rumah/KK = 1 Hak Suara). Salurkan aspirasi Anda demi kemajuan lingkungan kita bersama.');
    setPollCategory('Pemilihan Pengurus');
    setPollDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setIsSecret(true);
    setIsBroadcast(true);
    setCandidates([
      {
        id: 'cand_1',
        candidateNumber: 1,
        name: '',
        profession: 'Wiraswasta / Warga Blok C',
        vision: 'Mewujudkan RT 02 yang aman, guyub, dan transparan dalam pengelolaan kas warga.',
        missions: ['Mengoptimalkan ronda malam & fasilitas CCTV', 'Transparansi kas RT melalui digitalisasi']
      },
      {
        id: 'cand_2',
        candidateNumber: 2,
        name: '',
        profession: 'Karyawan Swasta / Warga Blok B',
        vision: 'Lingkungan hijau, bersih, dan ramah anak dengan pemberdayaan UMKM warga.',
        missions: ['Program bank sampah terpadu & kerja bakti rutin', 'Pengembangan fasilitas bermain anak & taman fasum']
      }
    ]);
    setPollOptions([
      { id: 'opt1', text: 'Setuju' },
      { id: 'opt2', text: 'Tidak Setuju' }
    ]);
  };

  const handleGenerateWithAi = async () => {
    if (!pollTitle) return toast.error('Masukkan judul musyawarah / pemilihan terlebih dahulu');
    setIsAiLoading(true);
    try {
      const prompt = `Pemilihan/Musyawarah RT: ${pollTitle}, Kategori: ${pollCategory}, Jenis: ${pollType}`;
      const draft = await generateAnnouncementDraft(prompt, 'Voting');
      setPollDesc(draft);
      toast.success('Draft uraian musyawarah AI berhasil disusun!');
    } catch (error) {
      toast.error('Gagal menyusun uraian voting AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddCandidate = () => {
    const nextNum = candidates.length + 1;
    setCandidates([
      ...candidates,
      {
        id: `cand_${nextNum}`,
        candidateNumber: nextNum,
        name: '',
        profession: '',
        vision: '',
        missions: ['']
      }
    ]);
  };

  const handleUpdateCandidate = (idx: number, field: string, value: any) => {
    const updated = [...candidates];
    (updated[idx] as any)[field] = value;
    setCandidates(updated);
  };

  const handleRemoveCandidate = (idx: number) => {
    if (candidates.length <= 2) {
      toast.error('Minimal 2 kandidat untuk pemilihan ketua RT.');
      return;
    }
    const filtered = candidates.filter((_, i) => i !== idx).map((c, i) => ({
      ...c,
      candidateNumber: i + 1
    }));
    setCandidates(filtered);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollTitle || !pollDesc || !pollDeadline) {
      toast.error('Harap lengkapi judul, deskripsi, dan batas waktu voting.');
      return;
    }

    // Validation for Election
    if (pollType === 'Election') {
      const emptyName = candidates.some(c => !c.name.trim());
      if (emptyName) {
        toast.error('Harap isi nama lengkap seluruh kandidat calon ketua RT.');
        return;
      }
    }

    const eligibleVotersCount = houses.filter(h => h.status === 'Occupied').length || 50;

    try {
      await addPollToDb({
        title: pollTitle,
        description: pollDesc,
        deadline: pollDeadline,
        date: new Date().toISOString(),
        type: pollType,
        category: pollCategory,
        isSecret,
        isBroadcast,
        totalEligibleVoters: eligibleVotersCount,
        votedHouseIds: [],
        candidates: pollType === 'Election' ? candidates.map(c => ({ ...c, votes: 0 })) : [],
        options: pollType !== 'Election' ? pollOptions.map(o => ({ ...o, votes: 0 })) : [],
        status: 'Open',
        totalVotes: 0,
      });
      toast.success('Bilik Pemilihan / E-Voting Resmi RT berhasil diterbitkan!', { icon: '🗳️' });
      setIsModalOpen(false);
      resetForms();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "polls");
      toast.error('Gagal membuat pemilihan.');
    }
  };

  const handleExportMinutesPdf = (poll: Poll) => {
    setSelectedPollForPdf(poll);
    setIsPdfModalOpen(true);
  };

  const handleGeneratePdfMinutes = async () => {
    if (!selectedPollForPdf) return;
    try {
      await generateElectionMinutesPDF(selectedPollForPdf, pdfConfig, committeeForm);
      toast.success('Berita Acara Hasil Pemilihan RT berhasil diunduh!');
      setIsPdfModalOpen(false);
    } catch (e) {
      toast.error('Gagal membuat Berita Acara PDF.');
    }
  };

  const addOption = () => {
    const newId = `opt${pollOptions.length + 1}`;
    setPollOptions([...pollOptions, { id: newId, text: '' }]);
  };

  const updateOption = (idx: number, text: string) => {
    const newOptions = [...pollOptions];
    newOptions[idx].text = text;
    setPollOptions(newOptions);
  };

  const removeOption = (idx: number) => {
    if (pollOptions.length <= 2) {
      toast.error('Minimal 2 opsi jawaban.');
      return;
    }
    const newOptions = pollOptions.filter((_, i) => i !== idx);
    setPollOptions(newOptions);
  };

  const handleClosePoll = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Tutup Sesi E-Voting / Pemilihan',
      message: 'Apakah Anda yakin ingin menutup pemungutan suara ini? Warga tidak akan bisa memilih lagi dan hasil pleno siap dicetak.',
      confirmLabel: 'Tutup Pemilihan',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await updatePollStatus(id, 'Closed');
        toast.success('Pemungutan suara berhasil ditutup.');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `polls/${id}`);
        toast.error('Gagal menutup voting.');
      }
    }
  };

  const handleDeletePoll = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Agenda Pemilihan',
      message: 'Apakah Anda yakin ingin menghapus pemilihan ini permanen? Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus Permanen',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deletePollFromDb(id);
        toast.success('Agenda pemilihan berhasil dihapus.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus voting.');
      }
    }
  };

  const filteredPolls = polls.filter(p => {
    if (activeTab === 'Election') return p.type === 'Election' || p.category === 'Pemilihan Pengurus';
    if (activeTab === 'Policy') return p.type !== 'Election' && p.category !== 'Pemilihan Pengurus';
    return true;
  });

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'Pemilihan Pengurus': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Kebijakan RT': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Fasilitas': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Kegiatan/Acara': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header with Executive Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-violet-600 rounded-full"></div>
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Sistem E-Voting & Bilik Suara Digital</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">Pemilihan Ketua RT & Rembug Warga</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Pemungutan suara digital 1 Rumah = 1 Hak Suara, live quick count, dan cetak Berita Acara resmi.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={() => { resetForms(); setIsModalOpen(true); }} 
            className="w-full md:w-auto px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Buat Bilik Pemilihan Baru
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit border border-slate-200/60">
        <button
          onClick={() => setActiveTab('All')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Semua Agenda ({polls.length})
        </button>
        <button
          onClick={() => setActiveTab('Election')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            activeTab === 'Election' ? 'bg-white text-amber-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award size={14} /> Pemilihan Ketua RT ({polls.filter(p => p.type === 'Election' || p.category === 'Pemilihan Pengurus').length})
        </button>
        <button
          onClick={() => setActiveTab('Policy')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
            activeTab === 'Policy' ? 'bg-white text-violet-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Vote size={14} /> Rembug Kebijakan ({polls.filter(p => p.type !== 'Election' && p.category !== 'Pemilihan Pengurus').length})
        </button>
      </div>

      {/* Poll Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPolls.map((poll: Poll) => {
            const dpt = poll.totalEligibleVoters || houses.filter(h => h.status === 'Occupied').length || 50;
            const turnoutPercent = dpt > 0 ? Math.round((poll.totalVotes / dpt) * 100) : 0;
            const isElection = poll.type === 'Election' || (poll.candidates && poll.candidates.length > 0);

            return (
              <motion.div 
                key={poll.id} 
                layout
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-violet-100/30 transition-all group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                      poll.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${poll.status === 'Open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                      {poll.status === 'Open' ? 'Bilik Aktif' : 'Selesai / Ditutup'}
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleExportMinutesPdf(poll)}
                        className="p-2 text-violet-600 hover:bg-violet-50 rounded-xl transition-all"
                        title="Unduh Berita Acara PDF"
                      >
                        <Download size={16} />
                      </button>
                      {poll.status === 'Open' && (
                        <button 
                          onClick={() => handleClosePoll(poll.id)} 
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" 
                          title="Tutup Sesi Pemilihan"
                        >
                          <Lock size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeletePoll(poll.id)} 
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="Hapus Pemilihan"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider border ${getCategoryBadge(poll.category)}`}>
                      {poll.category || 'Pemilihan'}
                    </span>
                    {isElection && (
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[8.5px] font-black uppercase tracking-widest rounded-md border border-amber-200 flex items-center gap-1">
                        <Award size={10} /> Calon Ketua RT
                      </span>
                    )}
                    {poll.isSecret && (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[8.5px] font-bold rounded-md flex items-center gap-1">
                        <ShieldCheck size={10} /> Rahasia (1 KK 1 Vote)
                      </span>
                    )}
                  </div>

                  <h3 className="font-black text-xl text-slate-900 mb-2 leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">{poll.title}</h3>
                  <p className="text-slate-500 font-medium text-xs mb-6 leading-relaxed line-clamp-3">{poll.description}</p>
                  
                  {/* Quick Count Breakdown for Candidates */}
                  {isElection && poll.candidates && poll.candidates.length > 0 ? (
                    <div className="space-y-3 mb-6 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-500">
                        <span>Perolehan Suara Kandidat</span>
                        <span>{poll.totalVotes} Masuk</span>
                      </div>
                      <div className="space-y-2">
                        {poll.candidates.map((cand) => {
                          const candPct = poll.totalVotes > 0 ? Math.round((cand.votes / poll.totalVotes) * 100) : 0;
                          return (
                            <div key={cand.id} className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-black flex items-center justify-center">
                                    {cand.candidateNumber}
                                  </span>
                                  {cand.name}
                                </span>
                                <span className="font-black text-violet-700">{cand.votes} Suara ({candPct}%)</span>
                              </div>
                              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                                <div className="bg-violet-600 h-full rounded-full transition-all duration-500" style={{ width: `${candPct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Users size={14} className="text-violet-600" />
                        Partisipasi Warga ({poll.totalVotes} / {dpt} KK)
                      </div>
                      <p className="text-xl font-black text-violet-600 leading-none">{turnoutPercent}%</p>
                    </div>
                    
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/50">
                      <div className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full" style={{ width: `${turnoutPercent}%` }} />
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 text-[10px] font-bold text-slate-400">
                      <span>Batas: {new Date(poll.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                      <span className="text-violet-600 font-black cursor-pointer hover:underline" onClick={() => handleExportMinutesPdf(poll)}>
                        Cetak Berita Acara PDF →
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredPolls.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-xs">
              <Vote size={40} />
            </div>
            <p className="text-slate-400 font-bold text-lg">Belum ada agenda pemilihan aktif.</p>
            <p className="text-slate-400 text-xs mt-1">Klik "Buat Bilik Pemilihan Baru" untuk memulai pemungutan suara digital warga.</p>
          </div>
        )}
      </div>

      {/* Enhanced Voting & Election Builder Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Buat Bilik E-Voting / Pemilihan Resmi RT"
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleCreatePoll} className="space-y-6">
          {/* Election Type Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => { setPollType('Election'); setPollCategory('Pemilihan Pengurus'); }}
              className={`p-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                pollType === 'Election' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Award size={16} className="text-amber-500" />
              Pemilihan Resmi Ketua / Pengurus RT
            </button>
            <button
              type="button"
              onClick={() => { setPollType('Policy'); setPollCategory('Kebijakan RT'); }}
              className={`p-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                pollType === 'Policy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Vote size={16} className="text-violet-600" />
              Rembug Kebijakan / Polling Opsi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Judul Agenda Pemilihan</label>
              <input 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                value={pollTitle}
                onChange={e => setPollTitle(e.target.value)}
                placeholder="Contoh: Pemilihan Ketua RT 02 Periode 2026-2029"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Batas Waktu Selesai (Deadline)</label>
              <input 
                type="date"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                value={pollDeadline}
                onChange={e => setPollDeadline(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-700">Uraian / Penjelasan Musyawarah</label>
              <button
                type="button"
                onClick={handleGenerateWithAi}
                disabled={isAiLoading}
                className="text-[11px] font-bold text-violet-600 hover:underline flex items-center gap-1"
              >
                <Sparkles size={13} /> {isAiLoading ? 'Menyusun AI...' : 'Bantu Tulis AI'}
              </button>
            </div>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 resize-none h-20"
              value={pollDesc}
              onChange={e => setPollDesc(e.target.value)}
              placeholder="Jelaskan mekanisme pemungutan suara dan aturan 1 KK 1 Vote..."
              required
            />
          </div>

          {/* Form Bagian Kandidat jika Type Election */}
          {pollType === 'Election' ? (
            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
                  <Award size={16} className="text-amber-500" /> Daftar Calon Ketua RT (Kandidat Resmi)
                </span>
                <button
                  type="button"
                  onClick={handleAddCandidate}
                  className="px-3 py-1.5 bg-violet-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-violet-700"
                >
                  <Plus size={14} /> Tambah Calon
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {candidates.map((cand, idx) => (
                  <div key={cand.id} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 relative shadow-xs">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-black flex items-center justify-center">
                        {cand.candidateNumber}
                      </span>
                      <span className="text-xs font-black text-slate-700">Kandidat No. Urut {cand.candidateNumber}</span>
                      {candidates.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCandidate(idx)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Nama Lengkap Calon</label>
                      <input 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                        value={cand.name}
                        onChange={e => handleUpdateCandidate(idx, 'name', e.target.value)}
                        placeholder="Nama Bpk/Ibu Calon RT"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Latar Belakang / Blok Rumah</label>
                      <input 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
                        value={cand.profession}
                        onChange={e => handleUpdateCandidate(idx, 'profession', e.target.value)}
                        placeholder="Contoh: Wiraswasta / Blok C5-02"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Visi Utama</label>
                      <textarea 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 h-14 resize-none"
                        value={cand.vision}
                        onChange={e => handleUpdateCandidate(idx, 'vision', e.target.value)}
                        placeholder="Visi kepemimpinan RT..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Form Opsi Pilihan Biasa */
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">Opsi Pilihan Suara</label>
              {pollOptions.map((opt, idx) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-white border flex items-center justify-center text-xs font-bold text-slate-500">
                    {idx + 1}
                  </span>
                  <input 
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    value={opt.text}
                    onChange={e => updateOption(idx, e.target.value)}
                    placeholder={`Opsi ${idx + 1}...`}
                    required
                  />
                  {pollOptions.length > 2 && (
                    <button type="button" onClick={() => removeOption(idx)} className="text-slate-400 hover:text-rose-600">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addOption} className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1">
                <Plus size={14} /> Tambah Opsi Lain
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
              Terbitkan Bilik Suara Warga
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ekspor Berita Acara PDF */}
      <Modal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        title="Cetak Berita Acara Pleno Pemilihan RT (PDF)"
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Berita Acara ini mencakup lembar rekapitulasi DPT, perolehan suara tiap calon, penetapan ketua terpilih, serta kolom tanda tangan panitia & saksi.
          </p>

          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Ketua Panitia Pemilihan</label>
              <input 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                value={committeeForm.committeeChairman}
                onChange={e => setCommitteeForm({ ...committeeForm, committeeChairman: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Sekretaris Panitia</label>
              <input 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                value={committeeForm.committeeSecretary}
                onChange={e => setCommitteeForm({ ...committeeForm, committeeSecretary: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Saksi Warga / Tokoh Masyarakat</label>
              <input 
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                value={committeeForm.witnessName}
                onChange={e => setCommitteeForm({ ...committeeForm, witnessName: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setIsPdfModalOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleGeneratePdfMinutes} className="bg-violet-600 hover:bg-violet-700 text-white flex items-center gap-2">
              <Download size={16} /> Unduh Berita Acara PDF
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
