import React, { useState, useEffect } from 'react';
import { CitizenPoll, PollOption } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Vote, CheckCircle2, AlertCircle, BarChart3, 
  Calendar, Users, Plus, ShieldCheck, ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';

interface CitizenVotingHubProps {
  currentHouseId?: string; // e.g. "C5-09"
  isAdmin?: boolean;
}

export const CitizenVotingHub: React.FC<CitizenVotingHubProps> = ({ currentHouseId = '', isAdmin = false }) => {
  // Mock initial polls with persistence
  const [polls, setPolls] = useState<CitizenPoll[]>(() => {
    try {
      const saved = localStorage.getItem('rt02_citizen_polls');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'poll-01',
        title: 'Kesepakatan Jam Penutupan Portal Keamanan Malam RT 02',
        description: 'Menyusul hasil evaluasi Siskamling Ronda dan keamanan lingkungan Huntap Tondo 2, dimohon setiap KK memilih jam penutupan portal utama RT.',
        category: 'Aturan RT',
        options: [
          { id: 'opt-1', text: 'Pukul 22.00 WITA (Gerbang ditutup penuh, akses via Pos Ronda)', votes: 42 },
          { id: 'opt-2', text: 'Pukul 23.00 WITA (Gerbang ditutup penuh)', votes: 78 },
          { id: 'opt-3', text: 'Pukul 24.00 WITA (Tetap dibuka setengah)', votes: 9 }
        ],
        startDate: '2026-09-10',
        endDate: '2026-09-25',
        status: 'Aktif',
        totalVotes: 129,
        eligibleVotersCount: 129,
        createdAt: '2026-09-10',
        createdBy: 'Ketua RT 02'
      },
      {
        id: 'poll-02',
        title: 'Prioritas Anggaran Kas RT: Pengadaan Tenda Gotong Royong vs CCTV Tambahan',
        description: 'Rembuk warga mengenai alokasi sisa kas operasional semester ini untuk kebutuhan inventaris bersama.',
        category: 'Renovasi Fasilitas',
        options: [
          { id: 'opt-a', text: 'Tenda Lipat 3x3m & Kursi Plastik untuk Takziah / Hajatan', votes: 65 },
          { id: 'opt-b', text: '2 Unit Kamera CCTV Solar-cell di Tikungan Blok E & F', votes: 55 }
        ],
        startDate: '2026-09-01',
        endDate: '2026-09-15',
        status: 'Ditutup',
        totalVotes: 120,
        eligibleVotersCount: 129,
        createdAt: '2026-09-01',
        createdBy: 'Sekretaris RT'
      }
    ];
  });

  const [selectedOption, setSelectedOption] = useState<Record<string, string>>({});
  const [votedPolls, setVotedPolls] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rt02_voted_polls');
      return saved ? JSON.parse(saved) : ['poll-02'];
    } catch {
      return ['poll-02'];
    }
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newOptions, setNewOptions] = useState(['', '']);

  const handleVote = (pollId: string) => {
    const optId = selectedOption[pollId];
    if (!optId) {
      toast.error('Silakan pilih salah satu opsi suara terlebih dahulu!');
      return;
    }

    setPolls(prev => {
      const updated = prev.map(p => {
        if (p.id === pollId) {
          return {
            ...p,
            totalVotes: p.totalVotes + 1,
            options: p.options.map(o => o.id === optId ? { ...o, votes: o.votes + 1 } : o)
          };
        }
        return p;
      });
      try {
        localStorage.setItem('rt02_citizen_polls', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const nextVoted = [...votedPolls, pollId];
    setVotedPolls(nextVoted);
    try {
      localStorage.setItem('rt02_voted_polls', JSON.stringify(nextVoted));
    } catch {}

    toast.success('Suara Anda (1 KK = 1 Suara) berhasil tercatat secara sah!');
  };

  const handleCreatePoll = () => {
    if (!newTitle.trim() || newOptions.some(o => !o.trim())) {
      toast.error('Judul dan seluruh opsi jajak pendapat harus diisi!');
      return;
    }

    const newPoll: CitizenPoll = {
      id: `poll-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Musyawarah digital RT 02.',
      category: 'Aturan RT',
      options: newOptions.map((text, idx) => ({ id: `opt-${idx + 1}`, text, votes: 0 })),
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      status: 'Aktif',
      totalVotes: 0,
      eligibleVotersCount: 129,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Pengurus RT 02'
    };

    const updated = [newPoll, ...polls];
    setPolls(updated);
    try {
      localStorage.setItem('rt02_citizen_polls', JSON.stringify(updated));
    } catch {}

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    setNewOptions(['', '']);
    toast.success('Jajak pendapat musyawarah digital berhasil dibuka untuk seluruh warga!');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-[2.25rem] p-6 text-white border border-indigo-500/25 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[10px] font-black uppercase tracking-wider rounded-full">
                🗳️ Musyawarah Digital
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold rounded-full">
                1 KK = 1 Suara
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">E-Voting & Rembuk Warga RT 02</h2>
            <p className="text-xs text-indigo-200/80 font-medium mt-1 max-w-xl">
              Salurkan aspirasi dan suara keluarga Anda dalam pengambilan keputusan penting lingkungan Huntap Tondo 2 secara transparan dan akuntabel.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <Plus size={16} />
              <span>Buat Jajak Pendapat</span>
            </button>
          )}
        </div>
      </div>

      {/* Poll Cards List */}
      <div className="space-y-5">
        {polls.map((poll) => {
          const hasVoted = votedPolls.includes(poll.id);
          const isClosed = poll.status === 'Ditutup';

          return (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] border border-slate-200/80 p-5 md:p-6 shadow-2xs hover:border-indigo-300 transition-all space-y-4"
            >
              {/* Poll Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                    isClosed ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {poll.status}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                    {poll.category}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-bold">
                  <span className="flex items-center gap-1">
                    <Users size={13} className="text-indigo-600" />
                    <span>{poll.totalVotes} Suara Masuk</span>
                  </span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Calendar size={13} />
                    <span>s/d {new Date(poll.endDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </span>
                </div>
              </div>

              {/* Title & Desc */}
              <div>
                <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight leading-snug">{poll.title}</h3>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">{poll.description}</p>
              </div>

              {/* Options */}
              <div className="space-y-2.5 pt-1">
                {poll.options.map((opt) => {
                  const percent = poll.totalVotes > 0 ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
                  const isSelected = selectedOption[poll.id] === opt.id;

                  return (
                    <div
                      key={opt.id}
                      onClick={() => !hasVoted && !isClosed && setSelectedOption(prev => ({ ...prev, [poll.id]: opt.id }))}
                      className={`relative overflow-hidden p-3.5 rounded-2xl border transition-all ${
                        hasVoted || isClosed
                          ? 'bg-slate-50 border-slate-200/80 cursor-default'
                          : isSelected
                          ? 'bg-indigo-50/80 border-indigo-500 shadow-sm cursor-pointer'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50/70 hover:border-slate-300 cursor-pointer'
                      }`}
                    >
                      {/* Percent Bar Fill */}
                      {(hasVoted || isClosed) && (
                        <div
                          className="absolute left-0 top-0 bottom-0 bg-indigo-100/60 transition-all duration-700 pointer-events-none"
                          style={{ width: `${percent}%` }}
                        />
                      )}

                      <div className="relative z-10 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {!hasVoted && !isClosed && (
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          )}
                          <span className={`font-bold ${isSelected ? 'text-indigo-950 font-black' : 'text-slate-800'}`}>
                            {opt.text}
                          </span>
                        </div>

                        {(hasVoted || isClosed) && (
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-indigo-900 text-xs">{percent}%</span>
                            <span className="text-[10px] text-slate-400 font-bold ml-1">({opt.votes})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Poll Action Bar */}
              <div className="pt-2 flex items-center justify-between text-xs">
                {hasVoted ? (
                  <div className="flex items-center gap-1.5 text-emerald-600 font-black text-[11px] bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                    <CheckCircle2 size={14} />
                    <span>Keluarga Anda telah memberikan suara sah</span>
                  </div>
                ) : isClosed ? (
                  <span className="text-slate-400 text-[11px] font-bold">Jajak pendapat ini telah ditutup oleh pengurus.</span>
                ) : (
                  <button
                    onClick={() => handleVote(poll.id)}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 active:scale-95 ml-auto"
                  >
                    <Vote size={14} />
                    <span>Kirim Suara Sah (1 KK)</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal Buat Jajak Pendapat (Admin) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
          <div className="w-full max-w-lg bg-white rounded-[2rem] p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900">Buat Jajak Pendapat Rembuk Warga</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Judul Musyawarah</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Contoh: Kesepakatan Jadwal Gotong Royong Bulanan..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Keterangan / Latar Belakang</label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Jelaskan maksud dan tujuan musyawarah ini..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 h-20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 block">Opsi Pilihan Suara</label>
                {newOptions.map((opt, i) => (
                  <input
                    key={i}
                    type="text"
                    value={opt}
                    onChange={e => {
                      const copy = [...newOptions];
                      copy[i] = e.target.value;
                      setNewOptions(copy);
                    }}
                    placeholder={`Opsi \${i + 1}`}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  />
                ))}
                {newOptions.length < 4 && (
                  <button
                    onClick={() => setNewOptions([...newOptions, ''])}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    + Tambah Opsi Lain
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleCreatePoll}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20"
              >
                Terbitkan ke Warga
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
