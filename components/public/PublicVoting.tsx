import React, { useState, useEffect } from 'react';
import { 
  Vote, PieChart, History, CheckCircle, AlertCircle, Clock, Award, 
  ShieldCheck, Info, User, Check, Sparkles, ChevronRight, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Poll, PollOption, PollCandidate, House } from '../../types';
import { submitVote } from '../../services/databaseService';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface PublicVotingProps {
  polls: Poll[];
  houses?: House[];
  currentHouse?: House | null;
}

export const PublicVoting: React.FC<PublicVotingProps> = ({ polls, houses = [], currentHouse }) => {
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set());
  const [selectedCandidate, setSelectedCandidate] = useState<PollCandidate | null>(null);
  
  // Voting House Selector (if not pre-logged in)
  const [selectedHouseId, setSelectedHouseId] = useState<string>(currentHouse?.id || '');
  const [voterName, setVoterName] = useState<string>(currentHouse?.headOfFamily || '');

  useEffect(() => {
    if (currentHouse) {
      setSelectedHouseId(currentHouse.id);
      setVoterName(currentHouse.headOfFamily);
    }
  }, [currentHouse]);

  useEffect(() => {
    const loaded = new Set<string>();
    polls.forEach(p => {
      // Check local storage or backend votedHouseIds
      const isLocallyVoted = localStorage.getItem(`voted_poll_${p.id}`);
      const isHouseVoted = selectedHouseId && p.votedHouseIds?.includes(selectedHouseId);
      if (isLocallyVoted || isHouseVoted) {
        loaded.add(p.id);
      }
    });
    setVotedPolls(loaded);
  }, [polls, selectedHouseId]);

  const handleVote = async (poll: Poll, targetId: string, targetName: string) => {
    if (votedPolls.has(poll.id)) {
      toast.error('Anda / Rumah Anda sudah menggunakan hak suara pada pemilihan ini.');
      return;
    }

    if (!selectedHouseId) {
      toast.error('Silakan pilih alamat rumah/KK Anda terlebih dahulu untuk validasi hak suara.');
      return;
    }

    if (poll.votedHouseIds?.includes(selectedHouseId)) {
      toast.error(`Rumah Blok ${selectedHouseId} sudah tercatat menyalurkan hak suara.`);
      setVotedPolls(prev => new Set(prev).add(poll.id));
      return;
    }

    toast.info(`Konfirmasi Hak Suara: ${targetName}`, {
      description: `Anda memilih: "${targetName}" untuk Rumah/KK Blok ${selectedHouseId}. Pilihan tidak dapat diubah setelah dicoblos.`,
      action: {
        label: "Coblos Sekarang ✓",
        onClick: async () => {
          try {
            await submitVote(poll.id, targetId, poll, {
              houseId: selectedHouseId,
              voterName: voterName || 'Warga'
            });
            localStorage.setItem(`voted_poll_${poll.id}`, 'true');
            setVotedPolls(prev => new Set(prev).add(poll.id));
            toast.success("Suara Berhasil Dicoblos!", {
              description: `Terima kasih atas partisipasi Anda dalam pemilihan "${poll.title}".`
            });
          } catch (error: any) {
            toast.error(error?.message || "Gagal merekam suara. Coba lagi.");
          }
        }
      },
      cancel: {
        label: "Batal",
        onClick: () => {}
      }
    });
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
    const isHouseVoted = selectedHouseId && poll.votedHouseIds?.includes(selectedHouseId);
    const hasVoted = votedPolls.has(poll.id) || isHouseVoted;
    const isClosed = poll.status === 'Closed';
    const total = poll.totalVotes || 1;
    const isElection = poll.type === 'Election' || (poll.candidates && poll.candidates.length > 0);

    return (
      <motion.div 
        key={poll.id} 
        variants={itemVariants}
        className={`
          bg-white rounded-[2.5rem] p-6 md:p-8 border shadow-sm transition-all relative overflow-hidden group
          ${isClosed ? 'border-slate-100 opacity-80 grayscale-[0.3]' : 'border-indigo-100 shadow-indigo-100 ring-4 ring-indigo-50/50 hover:ring-indigo-100'}
        `}
      >
        {/* Status Badge */}
        <div className="absolute top-6 right-6">
          {hasVoted ? (
            <div className="bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border border-emerald-200 flex items-center gap-1.5 shadow-xs">
              <CheckCircle size={16} strokeWidth={2.5} />
              <span>Sudah Memilih</span>
            </div>
          ) : (
            <div className={`
              px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border
              ${isClosed ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-indigo-50 text-indigo-600 border-indigo-100 animate-pulse'}
            `}>
              {isClosed ? 'Selesai' : 'Bilik Live Buka'}
            </div>
          )}
        </div>

        <div className="mb-6 pr-16">
          <div className="flex items-center gap-2 mb-2">
            {isElection && (
              <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-md border border-amber-200 flex items-center gap-1">
                <Award size={11} /> Pemilihan Resmi RT
              </span>
            )}
            <span className="px-2.5 py-0.5 bg-violet-50 text-violet-700 text-[9px] font-black uppercase tracking-widest rounded-md border border-violet-100">
              {poll.category || 'Musyawarah Warga'}
            </span>
            {poll.isSecret && (
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-md flex items-center gap-1">
                <ShieldCheck size={11} /> Rahasia (1 KK 1 Suara)
              </span>
            )}
          </div>

          <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">{poll.title}</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Clock size={14} />
            Batas Akhir: {new Date(poll.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <p className="text-slate-500 text-sm font-medium mt-3 leading-relaxed max-w-2xl">
            {poll.description}
          </p>
        </div>

        {/* ELECTION CANDIDATE CARDS (BILIK SUARA RESMI KETUA RT) */}
        {isElection && poll.candidates && poll.candidates.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {poll.candidates.map((cand) => {
                const percent = Math.round((cand.votes / total) * 100) || 0;
                return (
                  <div 
                    key={cand.id} 
                    className="relative bg-slate-50/70 rounded-3xl p-5 border border-slate-200/80 hover:border-violet-300 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white font-black text-sm flex items-center justify-center shadow-md shadow-violet-600/20">
                          {cand.candidateNumber}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(cand)}
                          className="text-[11px] font-bold text-violet-600 hover:underline flex items-center gap-1"
                        >
                          <Info size={13} /> Lihat Visi Misi
                        </button>
                      </div>

                      <div>
                        <h4 className="text-base font-black text-slate-900 leading-snug">{cand.name}</h4>
                        <p className="text-xs font-medium text-slate-500">{cand.profession || 'Warga RT 02'}</p>
                      </div>

                      <div className="bg-white p-3 rounded-2xl border border-slate-100 text-xs text-slate-600 italic line-clamp-2">
                        "{cand.vision || 'Mewujudkan RT 02 yang aman dan rukun.'}"
                      </div>
                    </div>

                    {/* Action Vote Button vs Result Progress */}
                    <div className="mt-4 pt-3 border-t border-slate-200/60">
                      {(!hasVoted && !isClosed) ? (
                        <Button
                          onClick={() => handleVote(poll, cand.id, `Calon No. ${cand.candidateNumber} (${cand.name})`)}
                          className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-violet-600/20"
                        >
                          <Vote size={15} /> Coblos Calon No. {cand.candidateNumber}
                        </Button>
                      ) : (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-black">
                            <span className="text-slate-600">Perolehan Suara:</span>
                            <span className="text-violet-700">{cand.votes} Suara ({percent}%)</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* STANDARD OPTION VOTING */
          <div className="space-y-3">
            {poll.options.map((opt) => {
              const percent = Math.round((opt.votes / total) * 100) || 0;
              return (
                <div key={opt.id} className="relative">
                  {(!hasVoted && !isClosed) ? (
                    <motion.button
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleVote(poll, opt.id, opt.text)}
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 text-left transition-all flex justify-between items-center group/btn"
                    >
                      <span className="font-bold text-slate-700 group-hover/btn:text-indigo-700 transition-colors">
                        {opt.text}
                      </span>
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover/btn:border-indigo-500 transition-colors"></div>
                    </motion.button>
                  ) : (
                    <div className="relative w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={`absolute inset-0 opacity-20 ${hasVoted ? 'bg-emerald-500' : 'bg-slate-400'}`}
                      />
                      <div className="relative flex justify-between items-center z-10">
                        <span className="font-bold text-slate-800">{opt.text}</span>
                        <span className="text-xs font-black text-slate-600 bg-white/70 px-2.5 py-1 rounded-lg backdrop-blur-sm">
                          {opt.votes} Suara ({percent}%)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Users size={14} /> {poll.totalVotes} Total Suara Masuk
          </p>
          <span className="text-[11px] font-bold text-violet-600">
            {isClosed ? 'Pemilihan Selesai' : 'Bilik Digital RT 02 ✓'}
          </span>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 py-10 mb-24"
    >
      <div className="text-center mb-12">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-violet-50 text-violet-700 text-[10px] font-black uppercase tracking-widest mb-4 border border-violet-100 shadow-sm"
        >
          <Vote size={14} strokeWidth={3} /> 
          Demokrasi Digital RT 02
        </motion.div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Pemilihan Ketua RT & <span className="text-violet-600">Suara Warga</span>
        </h1>
        <p className="text-slate-500 font-medium text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Sistem bilik suara elektronik warga RT 02 Huntap Tondo 2. Satu Kepala Keluarga memiliki satu hak suara yang sah dan transparan.
        </p>

        {/* Validasi Pemilih Rumah / KK */}
        {!currentHouse && houses.length > 0 && (
          <div className="mt-6 max-w-md mx-auto p-4 bg-white rounded-2xl border border-violet-100 shadow-sm text-left">
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-violet-600" /> Pilih Alamat Rumah Anda (1 KK = 1 Suara):
            </label>
            <select
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
              value={selectedHouseId}
              onChange={e => {
                setSelectedHouseId(e.target.value);
                const found = houses.find(h => h.id === e.target.value);
                if (found) setVoterName(found.headOfFamily);
              }}
            >
              <option value="">-- Pilih Rumah Anda --</option>
              {houses.filter(h => h.status === 'Occupied').map(h => (
                <option key={h.id} value={h.id}>
                  Blok {h.id} - Bpk/Ibu {h.headOfFamily}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-violet-600 text-white rounded-2xl shadow-lg shadow-violet-600/20">
              <Vote size={22} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Agenda Pemilihan Aktif</h2>
          </div>
          
          {activePolls.length > 0 ? (
            <div className="grid grid-cols-1 gap-8">
              {activePolls.map(renderPollCard)}
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-base font-black text-slate-800 mb-1">Belum Ada Pemilihan Aktif</h3>
              <p className="text-slate-400 text-xs">Saat ini seluruh agenda pemungutan suara telah selesai atau belum dimulai.</p>
            </div>
          )}
        </section>

        {closedPolls.length > 0 && (
          <section className="pt-10 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-6 opacity-70">
              <div className="p-2.5 bg-slate-100 text-slate-500 rounded-2xl">
                <History size={22} strokeWidth={2.5} />
              </div>
              <h2 className="text-2xl font-black text-slate-600 tracking-tight">Riwayat Hasil Pemilihan</h2>
            </div>
            <div className="grid grid-cols-1 gap-8">
              {closedPolls.map(renderPollCard)}
            </div>
          </section>
        )}
      </div>

      {/* Candidate Profile / Vision & Mission Modal */}
      <Modal
        isOpen={!!selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
        title={`Profil & Visi Misi Kandidat No. ${selectedCandidate?.candidateNumber}`}
        maxWidth="max-w-lg"
      >
        {selectedCandidate && (
          <div className="space-y-5">
            <div className="flex items-center gap-4 bg-violet-50 p-4 rounded-2xl border border-violet-100">
              <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white font-black text-xl flex items-center justify-center shadow-md">
                {selectedCandidate.candidateNumber}
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">{selectedCandidate.name}</h3>
                <p className="text-xs text-slate-500 font-bold">{selectedCandidate.profession || 'Warga Lingkungan RT 02'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Visi Utama:</h4>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-medium text-slate-700 leading-relaxed">
                "{selectedCandidate.vision || 'Mewujudkan lingkungan RT 02 yang aman, mandiri, dan transparan.'}"
              </div>
            </div>

            {selectedCandidate.missions && selectedCandidate.missions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">Misi & Program Kerja Unggulan:</h4>
                <div className="space-y-2">
                  {selectedCandidate.missions.map((m, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="w-5 h-5 rounded-md bg-violet-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button onClick={() => setSelectedCandidate(null)} className="bg-violet-600 hover:bg-violet-700 text-white">
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </motion.div>
  );
};
