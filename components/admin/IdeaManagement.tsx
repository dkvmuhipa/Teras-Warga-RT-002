import React, { useState } from 'react';
import { Idea, House } from '../../types';
import { updateIdeaStatus, deleteIdeaFromDb } from '../../services/databaseService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { toast } from 'sonner';
import { MessageCircle, ThumbsUp, Clock, CheckCircle2, XCircle, MessageSquare, Filter, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

interface IdeaManagementProps {
  ideas: Idea[];
  houses: House[];
}

export const IdeaManagement: React.FC<IdeaManagementProps> = ({ ideas, houses }) => {
  const [filter, setFilter] = useState<Idea['status'] | 'Semua'>('Semua');

  const handleStatusChange = async (ideaId: string, newStatus: Idea['status']) => {
    try {
      await updateIdeaStatus(ideaId, newStatus);
      toast.success(`Status ide diperbarui menjadi ${newStatus}`);
    } catch (error) {
      toast.error("Gagal memperbarui status ide");
    }
  };

  const handleDelete = async (ideaId: string) => {
    if (window.confirm('Hapus aspirasi/ide ini secara permanen?')) {
      try {
        // We need to add deleteIdeaFromDb to databaseService
        // For now, let's assume it exists or we'll add it
        await deleteIdeaFromDb(ideaId);
        toast.success("Ide berhasil dihapus");
      } catch (error) {
        toast.error("Gagal menghapus ide");
      }
    }
  };

  const filteredIdeas = filter === 'Semua' 
    ? ideas 
    : ideas.filter(i => i.status === filter);

  const getStatusColor = (status: Idea['status']) => {
    switch (status) {
      case 'Usulan': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Dibahas': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Disetujui': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Selesai': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <MessageCircle className="text-indigo-600" size={28} />
            Manajemen Aspirasi & Ide
          </h2>
          <p className="text-slate-500 text-sm font-medium">Moderasi dan tindak lanjuti masukan dari warga</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {['Semua', 'Usulan', 'Dibahas', 'Disetujui', 'Selesai'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as any)}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              filter === s 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200' 
                : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredIdeas.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white p-12 rounded-[2rem] border border-dashed border-slate-200 text-center"
            >
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-slate-300" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Tidak ada aspirasi</h3>
              <p className="text-slate-500">Belum ada ide warga dalam kategori ini.</p>
            </motion.div>
          ) : (
            filteredIdeas.map((idea) => (
              <motion.div
                key={idea.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className="p-6 overflow-hidden relative group">
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border ${getStatusColor(idea.status)}`}>
                          {idea.status}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {idea.category}
                        </span>
                        <div className="ml-auto flex items-center gap-1 text-slate-400">
                          <Clock size={12} />
                          <span className="text-[10px] font-bold">
                            {format(new Date(idea.date), 'd MMM yyyy HH:mm', { locale: id })}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-slate-800 mb-2">{idea.title}</h3>
                      <p className="text-slate-600 text-sm leading-relaxed mb-4">{idea.description}</p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                          <ThumbsUp size={14} className="text-indigo-600" />
                          <span className="text-xs font-black text-slate-700">{idea.upvotes.length} Dukungan</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                            {idea.authorName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-800 leading-none">{idea.authorName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Rumah {idea.houseId}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-48 flex flex-col gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tindakan Admin</p>
                      
                      {idea.status === 'Usulan' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(idea.id, 'Dibahas')}
                          className="w-full bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 justify-start"
                        >
                          <MessageSquare size={14} className="mr-2" /> Bahas Ide
                        </Button>
                      )}

                      {(idea.status === 'Usulan' || idea.status === 'Dibahas') && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(idea.id, 'Disetujui')}
                          className="w-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 justify-start"
                        >
                          <CheckCircle2 size={14} className="mr-2" /> Setujui
                        </Button>
                      )}

                      {idea.status === 'Disetujui' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleStatusChange(idea.id, 'Selesai')}
                          className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200 justify-start"
                        >
                          <CheckCircle2 size={14} className="mr-2" /> Selesaikan
                        </Button>
                      )}

                      {idea.status !== 'Usulan' && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleStatusChange(idea.id, 'Usulan')}
                          className="w-full text-slate-400 hover:text-slate-600 justify-start"
                        >
                          <Clock size={14} className="mr-2" /> Kembalikan ke Usulan
                        </Button>
                      )}

                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleDelete(idea.id)}
                        className="w-full text-rose-400 hover:text-rose-600 hover:bg-rose-50 justify-start mt-2"
                      >
                        <Trash2 size={14} className="mr-2" /> Hapus Permanen
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
