import React, { useState, useEffect } from 'react';
import { Vote, PieChart, History, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Poll, PollOption } from '../../types';
import { submitVote } from '../../services/databaseService';

interface PublicVotingProps {
  polls: Poll[];
}

export const PublicVoting: React.FC<PublicVotingProps> = ({ polls }) => {
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loaded = new Set<string>();
    polls.forEach(p => {
      if (localStorage.getItem(`voted_poll_${p.id}`)) {
        loaded.add(p.id);
      }
    });
    setVotedPolls(loaded);
  }, [polls]);

  const handleVote = async (pollId: string, optionId: string, options: PollOption[]) => {
    if (votedPolls.has(pollId)) return;

    if (window.confirm("Apakah Anda yakin dengan pilihan Anda? Pilihan tidak dapat diubah.")) {
      await submitVote(pollId, optionId, options);
      localStorage.setItem(`voted_poll_${pollId}`, 'true');
      setVotedPolls(prev => new Set(prev).add(pollId));
      alert("Terima kasih! Suara Anda telah direkam.");
    }
  };

  const activePolls = polls.filter(p => p.status === 'Open');
  const closedPolls = polls.filter(p => p.status === 'Closed');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const renderPollCard = (poll: Poll) => {
    const hasVoted = votedPolls.has(poll.id);
    const isClosed = poll.status === 'Closed';
    const total = poll.totalVotes || 1;

    return (
      <motion.div 
        key={poll.id} 
        variants={itemVariants}
        className={`
          bg-white rounded-[2.5rem] p-8 border shadow-sm transition-all relative overflow-hidden group
          ${isClosed ? 'border-slate-100 opacity-80 grayscale-[0.5]' : 'border-indigo-100 shadow-indigo-100 ring-4 ring-indigo-50/50 hover:ring-indigo-100'}
        `}
      >
        {/* Status Badge */}
        <div className="absolute top-6 right-6">
          {hasVoted ? (
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl shadow-sm border border-emerald-100 animate-bounce-slow">
              <CheckCircle size={24} strokeWidth={2.5} />
            </div>
          ) : (
            <div className={`
              px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
              ${isClosed ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse'}
            `}>
              {isClosed ? 'Selesai' : 'Live Voting'}
            </div>
          )}
        </div>

        <div className="mb-8 pr-16">
          <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">{poll.title}</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Clock size={14} />
            Berakhir: {new Date(poll.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <p className="text-slate-500 text-sm font-medium mt-4 leading-relaxed max-w-2xl">
            {poll.description}
          </p>
        </div>

        <div className="space-y-4">
          {poll.options.map((opt) => {
            const percent = Math.round((opt.votes / total) * 100) || 0;
            return (
              <div key={opt.id} className="relative">
                {(!hasVoted && !isClosed) ? (
                  <motion.button
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleVote(poll.id, opt.id, poll.options)}
                    className="w-full p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all flex justify-between items-center group/btn"
                  >
                    <span className="font-bold text-slate-700 group-hover/btn:text-indigo-700 transition-colors">
                      {opt.text}
                    </span>
                    <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover/btn:border-indigo-500 transition-colors"></div>
                  </motion.button>
                ) : (
                  <div className="relative w-full p-5 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`absolute inset-0 opacity-20 ${hasVoted ? 'bg-emerald-500' : 'bg-slate-400'}`}
                    />
                    <div className="relative flex justify-between items-center z-10">
                      <span className="font-bold text-slate-800">{opt.text}</span>
                      <span className="text-xs font-black text-slate-600 bg-white/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                        {opt.votes} Suara ({percent}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center">
          <div className="flex -space-x-2">
            {[1,2,3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                ?
              </div>
            ))}
            <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600">
              +{poll.totalVotes > 3 ? poll.totalVotes - 3 : 0}
            </div>
          </div>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {poll.totalVotes} Total Partisipan
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 py-12 mb-24"
    >
      <div className="text-center mb-16">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100 shadow-sm"
        >
          <Vote size={14} strokeWidth={3} /> 
          Demokrasi Digital
        </motion.div>
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-6">
          Suara Warga <span className="text-indigo-600">RT 002</span>
        </h1>
        <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
          Salurkan aspirasi Anda dalam pengambilan keputusan lingkungan. Satu suara Anda sangat berarti untuk kemajuan bersama.
        </p>
      </div>

      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
              <PieChart size={24} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Voting Aktif</h2>
          </div>
          
          {activePolls.length > 0 ? (
            <div className="grid grid-cols-1 gap-8">
              {activePolls.map(renderPollCard)}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6 shadow-sm">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-800 mb-2">Belum Ada Voting</h3>
              <p className="text-slate-400 font-medium">Saat ini tidak ada pemungutan suara yang sedang berlangsung.</p>
            </div>
          )}
        </section>

        {closedPolls.length > 0 && (
          <section className="pt-12 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-8 opacity-60">
              <div className="p-3 bg-slate-100 text-slate-500 rounded-2xl">
                <History size={24} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-500 tracking-tight">Riwayat Voting</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 opacity-80 hover:opacity-100 transition-opacity duration-500">
              {closedPolls.map(renderPollCard)}
            </div>
          </section>
        )}
      </div>
    </motion.div>
  );
};
