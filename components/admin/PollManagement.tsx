import React, { useState } from 'react';
import { Plus, Trash2, Vote, Calendar, Clock, Lock, CheckCircle2 } from 'lucide-react';
import { Poll } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { addPollToDb, updatePollStatus, deletePollFromDb, handleFirestoreError, OperationType } from '../../services/databaseService';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useConfirm } from '../../context/ConfirmContext';

interface PollManagementProps {
  polls: Poll[];
}

export const PollManagement: React.FC<PollManagementProps> = ({ polls }) => {
  const confirm = useConfirm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollDeadline, setPollDeadline] = useState('');
  const [pollOptions, setPollOptions] = useState<{id: string, text: string}[]>([
    { id: 'opt1', text: 'Setuju' },
    { id: 'opt2', text: 'Tidak Setuju' }
  ]);

  const resetForms = () => {
    setPollTitle('');
    setPollDesc('');
    setPollDeadline('');
    setPollOptions([
      { id: 'opt1', text: 'Setuju' },
      { id: 'opt2', text: 'Tidak Setuju' }
    ]);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPollToDb({
        title: pollTitle,
        description: pollDesc,
        deadline: pollDeadline,
        options: pollOptions.map(o => ({ ...o, votes: 0 })),
        status: 'Open',
        totalVotes: 0,
        votedBy: []
      });
      toast.success('Voting berhasil dibuat!');
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
      title: 'Tutup Voting',
      message: 'Apakah Anda yakin ingin menutup voting ini? Warga tidak akan bisa memilih lagi.',
      confirmLabel: 'Tutup',
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
      title: 'Hapus Voting',
      message: 'Apakah Anda yakin ingin menghapus voting ini permanen? Tindakan ini tidak dapat dibatalkan.',
      confirmLabel: 'Hapus',
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">E-Voting Warga</h2>
          <p className="text-slate-500 font-medium mt-1">Buat dan kelola jajak pendapat untuk pengambilan keputusan bersama.</p>
        </div>
        <Button onClick={() => { resetForms(); setIsModalOpen(true); }} className="shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all hover:scale-105 active:scale-95">
          <Plus size={18} className="mr-2"/> Buat Voting Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {polls.map((poll: Poll) => (
            <motion.div 
              key={poll.id} 
              variants={itemVariants}
              layout
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group relative overflow-hidden flex flex-col"
            >
              <div className="p-8 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    poll.status === 'Open' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                  }`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${poll.status === 'Open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                    {poll.status === 'Open' ? 'Sedang Berjalan' : 'Selesai'}
                  </span>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {poll.status === 'Open' && (
                      <button 
                        onClick={() => handleClosePoll(poll.id)} 
                        className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-all" 
                        title="Tutup Voting"
                      >
                        <Lock size={18} />
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeletePoll(poll.id)} 
                      className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                      title="Hapus Voting"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="font-black text-2xl text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors">{poll.title}</h3>
                <p className="text-slate-500 font-medium text-sm mb-8 leading-relaxed line-clamp-3">{poll.description}</p>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                      <Vote size={14} />
                      Total Partisipasi
                    </div>
                    <p className="text-2xl font-black text-indigo-600 leading-none">{poll.totalVotes}</p>
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border border-slate-200/50 relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (poll.totalVotes / 50) * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full relative" 
                    >
                      <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </motion.div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <Clock size={12} />
                      Deadline: {new Date(poll.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">
                      Lihat Detail
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {polls.length === 0 && (
          <motion.div key="empty-polls" variants={itemVariants} className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
              <Vote size={40} />
            </div>
            <p className="text-slate-400 font-bold text-lg">Belum ada voting aktif.</p>
            <p className="text-slate-400 text-sm mt-1">Buat voting baru untuk melibatkan warga dalam pengambilan keputusan.</p>
          </motion.div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Voting Baru">
        <form onSubmit={handleCreatePoll} className="space-y-5">
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Judul Voting</label>
            <input className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={pollTitle} onChange={e=>setPollTitle(e.target.value)} placeholder="Contoh: Pemilihan Ketua Panitia 17an" />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Deskripsi & Tujuan</label>
            <textarea className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all min-h-[100px]" rows={3} value={pollDesc} onChange={e=>setPollDesc(e.target.value)} placeholder="Jelaskan tujuan voting ini..." />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Batas Waktu (Deadline)</label>
            <input type="date" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" value={pollDeadline} onChange={e=>setPollDeadline(e.target.value)} />
          </div>
          
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-wide">Opsi Jawaban</label>
            <div className="space-y-3">
              {pollOptions.map((opt, idx) => (
                <div key={opt.id} className="flex gap-2">
                  <input 
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
                    value={opt.text} 
                    onChange={e => updateOption(idx, e.target.value)} 
                    placeholder={`Opsi ${idx + 1}`} 
                  />
                  {pollOptions.length > 2 && (
                    <button 
                      type="button" 
                      onClick={() => removeOption(idx)}
                      className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
              <button 
                type="button" 
                onClick={addOption}
                className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1 mt-2"
              >
                <Plus size={14} /> Tambah Opsi Lain
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full py-3.5 text-sm shadow-xl shadow-indigo-200 mt-2">Terbitkan Voting</Button>
        </form>
      </Modal>
    </motion.div>
  );
};
