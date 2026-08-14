import React, { useState } from 'react';
import { Plus, Trash2, Vote, Calendar, Clock, Lock, CheckCircle2, CalendarDays, Sparkles, ShieldCheck, CheckSquare, Layers } from 'lucide-react';
import { Poll } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addPollToDb, updatePollStatus, deletePollFromDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { generateAnnouncementDraft } from '../../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface PollManagementProps {
  polls: Poll[];
}

export const PollManagement: React.FC<PollManagementProps> = ({ polls }) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Enhanced Form State
  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollCategory, setPollCategory] = useState<'Kebijakan RT' | 'Pemilihan Pengurus' | 'Fasilitas' | 'Kegiatan/Acara'>('Kebijakan RT');
  const [pollDeadline, setPollDeadline] = useState('');
  const [isSecret, setIsSecret] = useState(true);
  const [isBroadcast, setIsBroadcast] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pollOptions, setPollOptions] = useState<{id: string, text: string}[]>([
    { id: 'opt1', text: 'Setuju' },
    { id: 'opt2', text: 'Tidak Setuju' }
  ]);

  const resetForms = () => {
    setPollTitle('');
    setPollDesc('');
    setPollCategory('Kebijakan RT');
    setPollDeadline(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setIsSecret(true);
    setIsBroadcast(true);
    setPollOptions([
      { id: 'opt1', text: 'Setuju' },
      { id: 'opt2', text: 'Tidak Setuju' }
    ]);
  };

  const handleGenerateWithAi = async () => {
    if (!pollTitle) return toast.error('Masukkan judul musyawarah / voting terlebih dahulu');
    setIsAiLoading(true);
    try {
      const prompt = `Musyawarah RT: ${pollTitle}, Kategori: ${pollCategory}`;
      const draft = await generateAnnouncementDraft(prompt, 'Voting');
      setPollDesc(draft);
      toast.success('Draft uraian musyawarah mufakat AI berhasil disusun!');
    } catch (error) {
      toast.error('Gagal menyusun uraian voting AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pollTitle || !pollDesc || !pollDeadline) {
      toast.error('Harap lengkapi judul, deskripsi, dan deadline voting.');
      return;
    }

    try {
      await addPollToDb({
        title: pollTitle,
        description: pollDesc,
        deadline: pollDeadline,
        date: new Date().toISOString(),
        category: pollCategory,
        isSecret,
        isBroadcast,
        options: pollOptions.map(o => ({ ...o, votes: 0 })),
        status: 'Open',
        totalVotes: 0,
      });
      toast.success('Bilik E-Voting Warga berhasil diterbitkan!', { icon: '🗳️' });
      setIsModalOpen(false);
      resetForms();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "polls");
      toast.error('Gagal membuat voting.');
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
      title: 'Tutup Sesi E-Voting',
      message: 'Apakah Anda yakin ingin menutup voting ini? Warga tidak akan bisa memilih lagi.',
      confirmLabel: 'Tutup Voting',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await updatePollStatus(id, 'Closed');
        toast.success('Voting berhasil ditutup.');
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `polls/${id}`);
        toast.error('Gagal menutup voting.');
      }
    }
  };

  const handleDeletePoll = async (id: string) => {
    const isConfirmed = await confirm({
      title: 'Hapus Sesi E-Voting',
      message: 'Apakah Anda yakin ingin menghapus voting ini permanen? Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus Permanen',
      isDanger: true
    });

    if (isConfirmed) {
      try {
        await deletePollFromDb(id);
        toast.success('Voting berhasil dihapus.');
      } catch (error) {
        console.error(error);
        toast.error('Gagal menghapus voting.');
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'Kebijakan RT': return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Pemilihan Pengurus': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Fasilitas': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Title Header with Executive Badge */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-6 bg-violet-600 rounded-full"></div>
            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Sistem E-Voting & Musyawarah Mufakat</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">E-Voting Warga RT 02</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">Penetapan keputusan bersama, jajak pendapat kebijakan lingkungan, dan pemungutan suara transparan.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            onClick={() => { resetForms(); setIsModalOpen(true); }} 
            className="w-full md:w-auto px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-violet-600/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Buat Bilik Voting Baru
          </Button>
        </div>
      </div>

      {/* Poll Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {polls.map((poll: Poll) => (
            <motion.div 
              key={poll.id} 
              variants={itemVariants}
              layout
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xs hover:shadow-xl hover:shadow-violet-100/30 transition-all group relative overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4 gap-2">
                  <span className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
                    poll.status === 'Open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${poll.status === 'Open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    {poll.status === 'Open' ? 'Voting Aktif' : 'Tutup'}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    {poll.status === 'Open' && (
                      <button 
                        onClick={() => handleClosePoll(poll.id)} 
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all" 
                        title="Tutup Sesi Voting"
                      >
                        <Lock size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeletePoll(poll.id)} 
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Hapus Voting"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-[8.5px] font-black uppercase tracking-wider border ${getCategoryBadge(poll.category)}`}>
                    {poll.category || 'Kebijakan RT'}
                  </span>
                  {poll.isSecret && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[8.5px] font-bold rounded-md flex items-center gap-1">
                      <ShieldCheck size={10} /> Rahasia
                    </span>
                  )}
                </div>

                <h3 className="font-black text-xl text-slate-900 mb-2 leading-snug group-hover:text-violet-600 transition-colors line-clamp-2">{poll.title}</h3>
                <p className="text-slate-500 font-medium text-xs mb-6 leading-relaxed line-clamp-3">{poll.description}</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Vote size={14} className="text-violet-600" />
                      Total Partisipasi Suara
                    </div>
                    <p className="text-2xl font-black text-violet-600 leading-none">{poll.totalVotes}</p>
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden border border-slate-200/50 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (poll.totalVotes / 50) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-violet-500 to-indigo-600 h-full rounded-full relative" 
                    >
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </motion.div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock size={12} />
                      Deadline: {new Date(poll.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <span className="text-[10px] font-black text-violet-600 uppercase tracking-wider">
                      {poll.options.length} Opsi Pilihan
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {polls.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-xs">
              <Vote size={40} />
            </div>
            <p className="text-slate-400 font-bold text-lg">Belum ada bilik voting aktif.</p>
            <p className="text-slate-400 text-xs mt-1">Klik "Buat Bilik Voting Baru" untuk melibatkan warga dalam pengambilan keputusan.</p>
          </div>
        )}
      </div>

      {/* Enhanced Voting Modal (Max-W-5XL Split View Layout) */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Buat Bilik E-Voting Baru"
        maxWidth="max-w-5xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Input Side */}
          <form onSubmit={handleCreatePoll} className="lg:col-span-7 space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Judul / Topik Musyawarah</label>
              <input 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all" 
                value={pollTitle} 
                onChange={e=>setPollTitle(e.target.value)} 
                placeholder="Contoh: Pemilihan Jenis Portal Keamanan RT 02..." 
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Kategori Voting</label>
                <select 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all cursor-pointer" 
                  value={pollCategory} 
                  onChange={e=>setPollCategory(e.target.value as any)}
                >
                  <option value="Kebijakan RT">📜 Kebijakan & Peraturan RT</option>
                  <option value="Pemilihan Pengurus">🗳️ Pemilihan Pengurus / Panitia</option>
                  <option value="Fasilitas">🏗️ Pembangunan & Fasilitas</option>
                  <option value="Kegiatan/Acara">🎉 Agenda Kegiatan / Acara Warga</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Batas Waktu Akhir (Deadline)</label>
                <input 
                  type="date" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all cursor-pointer" 
                  value={pollDeadline} 
                  onChange={e=>setPollDeadline(e.target.value)} 
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Uraian & Latar Belakang Musyawarah</label>
                <button 
                  type="button" 
                  onClick={handleGenerateWithAi} 
                  className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200/70 text-[11px] font-black py-1.5 px-3 rounded-full transition-all shrink-0 active:scale-95"
                >
                  {isAiLoading ? (
                    <Sparkles size={13} className="animate-spin text-violet-600" />
                  ) : (
                    <Sparkles size={13} className="text-violet-600 animate-pulse" />
                  )}
                  <span>{isAiLoading ? 'Menyusun Uraian...' : 'Bantu Tulis Voting AI'}</span>
                </button>
              </div>
              <textarea 
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-700 placeholder:text-slate-400 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all min-h-[100px] resize-none" 
                rows={4} 
                value={pollDesc} 
                onChange={e=>setPollDesc(e.target.value)} 
                placeholder="Jelaskan tujuan musyawarah, kriteria pemilihan, dan alasan pentingnya suara warga..." 
                required
              />
            </div>
            
            {/* Opsi Jawaban Grid */}
            <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest">Opsi Pilihan Suara / Kategori</label>
                <span className="text-[10px] font-bold text-slate-400">{pollOptions.length} Pilihan Terdaftar</span>
              </div>
              
              <div className="space-y-2.5">
                {pollOptions.map((opt, idx) => (
                  <div key={opt.id} className="flex items-center gap-2.5 group/option">
                    <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400 shadow-xs shrink-0 group-focus-within/option:border-violet-500 group-focus-within/option:text-violet-600 transition-all">
                      {idx + 1}
                    </div>
                    <input 
                      className="flex-1 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:text-slate-400 focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 outline-none transition-all shadow-xs" 
                      value={opt.text} 
                      onChange={e => updateOption(idx, e.target.value)} 
                      placeholder={`Opsi pilihan ${idx + 1}...`} 
                      required
                    />
                    {pollOptions.length > 2 && (
                      <button 
                        type="button" 
                        onClick={() => removeOption(idx)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button 
                type="button" 
                onClick={addOption}
                className="mt-2 w-full py-2.5 border-2 border-dashed border-violet-200 text-violet-600 rounded-xl text-xs font-bold hover:bg-violet-50 hover:border-violet-300 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={15} /> Tambah Opsi Pilihan Lain
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Button type="submit" className="w-full py-3.5 text-xs font-black uppercase tracking-wider rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-600/20 flex justify-center items-center gap-2 group/submit">
                Terbitkan Bilik Voting <CheckCircle2 size={16} className="group-hover/submit:scale-110 transition-transform" />
              </Button>
            </div>
          </form>

          {/* Live Mobile Ballot Box Mockup Side */}
          <div className="lg:col-span-5 hidden lg:flex flex-col bg-slate-900 rounded-[2.5rem] p-5 text-white border border-slate-800 shadow-xl justify-between min-h-[500px]">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-ping" />
                  <span className="text-[10px] font-mono text-violet-400 font-bold uppercase tracking-widest">LIVE BALLOT BOX MOCKUP</span>
                </div>
                <Vote size={15} className="text-violet-400" />
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mb-3">Pratinjau Bilik Suara di Layar Warga:</p>
              
              <div className="bg-white text-slate-900 rounded-3xl p-5 border border-slate-800 shadow-2xl flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 text-[8.5px] font-black uppercase tracking-widest rounded-md">
                    {pollCategory}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> BILIK AKTIF
                  </span>
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-black text-base text-slate-900 leading-snug">
                    {pollTitle || '[Judul Topik Musyawarah]'}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                    {pollDesc || '[Uraian latar belakang musyawarah mufakat akan tampil di sini...]'}
                  </p>
                </div>

                <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pratinjau Opsi Suara:</p>
                  {pollOptions.map((opt, i) => (
                    <div key={i} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 shadow-xs">
                      <span>{opt.text || `Opsi ${i + 1}`}</span>
                      <div className="w-4 h-4 rounded-full border-2 border-violet-500 flex items-center justify-center">
                        {i === 0 && <div className="w-2 h-2 rounded-full bg-violet-600" />}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-[9px] font-bold text-slate-400 border-t border-slate-100">
                  <span>DEADLINE: {pollDeadline ? new Date(pollDeadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '7 Hari'}</span>
                  <span className="text-violet-600">RAHASIA & TRANSPARAN ✓</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[9.5px] text-slate-400 font-medium text-center leading-normal">
              Setiap warga hanya memiliki 1 hak suara per kepala keluarga yang tersimpan aman di database.
            </div>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};
