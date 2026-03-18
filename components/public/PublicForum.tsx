import React, { useState } from 'react';
import { Idea, House } from '../../types';
import { addIdea, toggleUpvoteIdea } from '../../services/databaseService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { toast } from 'sonner';
import { MessageSquare, ThumbsUp, Plus, Filter, Clock, CheckCircle2, MessageCircle, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PublicForumProps {
  ideas: Idea[];
  houses: House[];
}

export default function PublicForum({ ideas, houses }: PublicForumProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Idea['category']>('Lainnya');
  const [filter, setFilter] = useState<Idea['status'] | 'Semua'>('Semua');

  const residentHouseId = localStorage.getItem('resident_house_id') || '';
  const residentName = localStorage.getItem('resident_name') || 'Warga';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentHouseId) {
      toast.error("Silakan login sebagai warga terlebih dahulu");
      return;
    }
    if (!title || !description) {
      toast.error("Judul dan deskripsi wajib diisi");
      return;
    }

    try {
      await addIdea({
        title,
        description,
        category,
        authorName: residentName,
        houseId: residentHouseId
      });
      toast.success("Ide berhasil dikirim! Menunggu moderasi pengurus.");
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
    } catch (error) {
      toast.error("Gagal mengirim ide");
    }
  };

  const handleUpvote = async (ideaId: string) => {
    if (!residentHouseId) {
      toast.error("Silakan login untuk memberikan dukungan");
      return;
    }
    try {
      await toggleUpvoteIdea(ideaId, residentHouseId);
    } catch (error) {
      toast.error("Gagal memberikan dukungan");
    }
  };

  const filteredIdeas = filter === 'Semua' 
    ? ideas 
    : ideas.filter(i => i.status === filter);

  const getStatusColor = (status: Idea['status']) => {
    switch (status) {
      case 'Usulan': return 'bg-blue-100 text-blue-700';
      case 'Dibahas': return 'bg-amber-100 text-amber-700';
      case 'Disetujui': return 'bg-emerald-100 text-emerald-700';
      case 'Selesai': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 mb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <MessageCircle className="text-indigo-600" size={32} />
            Musyawarah Digital
          </h2>
          <p className="text-slate-500 font-medium">Sampaikan ide dan aspirasi untuk kemajuan RT 02</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
        >
          <Plus size={20} className="mr-2" /> Sampaikan Ide
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {['Semua', 'Usulan', 'Dibahas', 'Disetujui', 'Selesai'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s as any)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              filter === s 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredIdeas.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="text-slate-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Belum ada ide</h3>
            <p className="text-slate-500">Jadilah yang pertama menyampaikan ide brilian Anda!</p>
          </Card>
        ) : (
          filteredIdeas.map((idea) => (
            <Card key={idea.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(idea.status)}`}>
                      {idea.status}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {idea.category}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-1">{idea.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{idea.description}</p>
                </div>
                <button 
                  onClick={() => handleUpvote(idea.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl border transition-all ${
                    idea.upvotes.includes(residentHouseId)
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                >
                  <ThumbsUp size={20} className={idea.upvotes.includes(residentHouseId) ? 'fill-indigo-600' : ''} />
                  <span className="text-xs font-black mt-1">{idea.upvotes.length}</span>
                </button>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs">
                    {idea.authorName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">{idea.authorName}</p>
                    <p className="text-[10px] text-slate-400 font-medium">Rumah {idea.houseId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400">
                  <Clock size={12} />
                  <span className="text-[10px] font-bold">
                    {format(new Date(idea.date), 'd MMM yyyy', { locale: id })}
                  </span>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Sampaikan Ide Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Judul Ide</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
              placeholder="Contoh: Perbaikan Lampu Jalan Gang 2"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Kategori</label>
            <select 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
              value={category}
              onChange={e => setCategory(e.target.value as any)}
            >
              <option value="Fasilitas">Fasilitas Umum</option>
              <option value="Kegiatan">Kegiatan Warga</option>
              <option value="Keamanan">Keamanan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 text-slate-700 uppercase tracking-widest">Detail Ide / Aspirasi</label>
            <textarea 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none min-h-[120px]"
              placeholder="Jelaskan ide Anda secara detail agar warga lain bisa memahami dan mendukung..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
              * Ide yang Anda sampaikan akan terlihat oleh seluruh warga RT 02. Pastikan menggunakan bahasa yang sopan dan membangun.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1">Batal</Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Kirim Ide</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
