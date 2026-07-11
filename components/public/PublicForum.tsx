import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, Lightbulb, ThumbsUp, ThumbsDown, Search, Plus, Filter, Send,
  User, Home as HomeIcon, CheckCircle2, AlertCircle, Clock, Trash2, Shield, Eye,
  ChevronDown, MessageCircle, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ForumIdea, ForumComment, House } from '../../types';
import { 
  subscribeToForumIdeas, addForumIdea, updateForumIdea, deleteForumIdea 
} from '../../services/databaseService';
import { toast } from 'sonner';

interface PublicForumProps {
  houses: House[];
  isAdmin?: boolean;
}

const CATEGORIES = ['Fasilitas', 'Kegiatan', 'Keamanan', 'Sosial', 'Ide Kreatif', 'Lainnya'] as const;
const STATUSES = ['Aspirasi', 'Ditinjau', 'Disetujui', 'Direalisasikan', 'Ditolak'] as const;

export const PublicForum: React.FC<PublicForumProps> = ({ houses, isAdmin = false }) => {
  const [ideas, setIdeas] = useState<ForumIdea[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [activeTab, setActiveTab] = useState<'semua' | 'saya'>('semua');
  
  // Modal & Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaCat, setIdeaCat] = useState<typeof CATEGORIES[number]>('Fasilitas');
  const [submitting, setSubmitting] = useState(false);

  // Comments State
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Admin Response State
  const [editingResponseId, setEditingResponseId] = useState<string | null>(null);
  const [adminNotesText, setAdminNotesText] = useState('');
  const [adminStatusSelect, setAdminStatusSelect] = useState<ForumIdea['status']>('Aspirasi');

  // Resident Info from localStorage
  const currentResidentName = localStorage.getItem('resident_name') || '';
  const currentHouseId = localStorage.getItem('resident_house_id') || '';
  const currentResidentPhone = localStorage.getItem('resident_phone') || '';

  // Non-verified user form states if not logged in/registered
  const [guestName, setGuestName] = useState('');
  const [guestHouseId, setGuestHouseId] = useState('');

  useEffect(() => {
    const unsub = subscribeToForumIdeas((data) => {
      setIdeas(data);
    });
    return () => unsub();
  }, []);

  // Seed default ideas if collection is empty
  useEffect(() => {
    if (ideas.length === 0) {
      const defaultIdeas: Omit<ForumIdea, 'id'>[] = [
        {
          title: 'Pemasangan Tong Sampah Organik & Anorganik Tambahan',
          description: 'Usul untuk memasang tong sampah pilah di area taman bermain anak dan depan gang masuk RT 02 agar lingkungan luar rumah tetap bersih dan memudahkan pemilahan sampah ke Bank Sampah.',
          category: 'Fasilitas',
          authorName: 'Iwan Setiawan',
          authorHouseId: 'B-04',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          upvotes: ['B-04', 'B-12', 'A-05', 'C-08'],
          downvotes: [],
          status: 'Disetujui',
          comments: [
            {
              id: 'c1',
              authorName: 'Siti Rahma',
              authorHouseId: 'A-05',
              content: 'Sangat setuju, anak-anak sering jajan di taman tapi kesulitan cari tempat sampah terdekat.',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            }
          ],
          adminNotes: 'Usulan disetujui. Pembelian tong sampah pilah akan dianggarkan menggunakan kas sosial bulan depan.',
        },
        {
          title: 'Pelatihan Pembuatan Kompos dari Sampah Dapur',
          description: 'Bagaimana kalau kita adakan demo pembuatan kompos dari sisa sayur dan kulit buah? Bisa bekerja sama dengan ibu-ibu PKK, hasilnya nanti bisa dipakai sendiri untuk tanaman pekarangan warga.',
          category: 'Kegiatan',
          authorName: 'Dewi Kartika',
          authorHouseId: 'A-09',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          upvotes: ['A-09', 'A-02', 'B-10', 'B-05', 'C-02', 'C-15'],
          downvotes: [],
          status: 'Direalisasikan',
          comments: [
            {
              id: 'c2',
              authorName: 'Budiman',
              authorHouseId: 'C-02',
              content: 'Terima kasih pengurus RT, pelatihan minggu lalu sangat bermanfaat! Kompos saya sudah mulai berproses.',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            }
          ],
          adminNotes: 'Kegiatan telah dilaksanakan pada hari Minggu lalu dengan partisipasi 25 perwakilan rumah tangga.',
        },
        {
          title: 'Pengadaan Portal Otomatis di Pintu Masuk RT',
          description: 'Demi meningkatkan keamanan lingkungan terutama saat malam hari, usulan pemasangan portal semi-otomatis menggunakan kartu akses untuk seluruh warga RT 02.',
          category: 'Keamanan',
          authorName: 'Andi Wijaya',
          authorHouseId: 'C-11',
          date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          upvotes: ['C-11', 'B-02', 'C-04'],
          downvotes: ['A-01', 'A-04', 'B-09'],
          status: 'Ditinjau',
          comments: [
            {
              id: 'c3',
              authorName: 'Hendra',
              authorHouseId: 'B-09',
              content: 'Apakah biayanya tidak terlalu besar? Sebaiknya dimatangkan dulu rincian iurannya.',
              date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            }
          ],
          adminNotes: 'Pengurus masih mengkaji kesiapan anggaran dan efektivitas portal otomatis dibanding penjagaan ronda saat ini.',
        }
      ];

      // Add default ideas
      defaultIdeas.forEach(async (idea) => {
        await addForumIdea(idea);
      });
    }
  }, [ideas]);

  const handleCreateIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaTitle.trim() || !ideaDesc.trim()) {
      toast.error('Judul dan Deskripsi ide tidak boleh kosong!');
      return;
    }

    const finalAuthorName = currentResidentName || guestName;
    const finalHouseId = currentHouseId || guestHouseId;

    if (!finalAuthorName.trim() || !finalHouseId.trim()) {
      toast.error('Silakan isi Nama Lengkap dan Blok/Nomor Rumah Anda!');
      return;
    }

    setSubmitting(true);
    try {
      const newIdea: Omit<ForumIdea, 'id'> = {
        title: ideaTitle,
        description: ideaDesc,
        category: ideaCat,
        authorName: finalAuthorName,
        authorHouseId: finalHouseId,
        date: new Date().toISOString(),
        upvotes: [finalHouseId], // Autoupvote by creator
        downvotes: [],
        status: 'Aspirasi',
        comments: []
      };

      await addForumIdea(newIdea);
      toast.success('Ide/Aspirasi berhasil dikirim!', {
        description: 'Ide Anda sekarang tampil di papan musyawarah warga.',
      });
      
      // Reset Form
      setIdeaTitle('');
      setIdeaDesc('');
      setIdeaCat('Fasilitas');
      setIsFormOpen(false);
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengirimkan ide musyawarah.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (ideaId: string, idea: ForumIdea) => {
    const voterId = currentHouseId || 'guest-' + (localStorage.getItem('guest_voter_id') || '');
    if (!voterId || voterId.includes('guest-null')) {
      const guestId = crypto.randomUUID();
      localStorage.setItem('guest_voter_id', guestId);
    }
    const finalVoter = currentHouseId || localStorage.getItem('guest_voter_id') || 'guest';

    let currentUpvotes = [...(idea.upvotes || [])];
    let currentDownvotes = [...(idea.downvotes || [])];

    if (currentUpvotes.includes(finalVoter)) {
      // Remove upvote
      currentUpvotes = currentUpvotes.filter(id => id !== finalVoter);
    } else {
      // Add upvote, remove downvote if any
      currentUpvotes.push(finalVoter);
      currentDownvotes = currentDownvotes.filter(id => id !== finalVoter);
    }

    await updateForumIdea(ideaId, {
      upvotes: currentUpvotes,
      downvotes: currentDownvotes
    });
  };

  const handleDownvote = async (ideaId: string, idea: ForumIdea) => {
    const voterId = currentHouseId || 'guest-' + (localStorage.getItem('guest_voter_id') || '');
    if (!voterId || voterId.includes('guest-null')) {
      const guestId = crypto.randomUUID();
      localStorage.setItem('guest_voter_id', guestId);
    }
    const finalVoter = currentHouseId || localStorage.getItem('guest_voter_id') || 'guest';

    let currentUpvotes = [...(idea.upvotes || [])];
    let currentDownvotes = [...(idea.downvotes || [])];

    if (currentDownvotes.includes(finalVoter)) {
      // Remove downvote
      currentDownvotes = currentDownvotes.filter(id => id !== finalVoter);
    } else {
      // Add downvote, remove upvote if any
      currentDownvotes.push(finalVoter);
      currentUpvotes = currentUpvotes.filter(id => id !== finalVoter);
    }

    await updateForumIdea(ideaId, {
      upvotes: currentUpvotes,
      downvotes: currentDownvotes
    });
  };

  const handleAddComment = async (ideaId: string, idea: ForumIdea) => {
    const finalAuthorName = currentResidentName || guestName || 'Warga Anonim';
    const finalHouseId = currentHouseId || guestHouseId || 'Luar RT';

    if (!commentText.trim()) {
      toast.error('Komentar tidak boleh kosong!');
      return;
    }

    const newComment: ForumComment = {
      id: crypto.randomUUID(),
      authorName: finalAuthorName,
      authorHouseId: finalHouseId,
      content: commentText,
      date: new Date().toISOString()
    };

    const updatedComments = [...(idea.comments || []), newComment];

    try {
      await updateForumIdea(ideaId, {
        comments: updatedComments
      });
      setCommentText('');
      toast.success('Komentar berhasil ditambahkan!');
    } catch (error) {
      toast.error('Gagal menambahkan komentar.');
    }
  };

  const handleUpdateStatusAndNotes = async (ideaId: string) => {
    try {
      await updateForumIdea(ideaId, {
        status: adminStatusSelect,
        adminNotes: adminNotesText
      });
      setEditingResponseId(null);
      toast.success('Status & Tanggapan Pengurus berhasil diperbarui!');
    } catch (error) {
      toast.error('Gagal memperbarui tanggapan.');
    }
  };

  const handleDeleteIdea = async (ideaId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus ide/aspirasi warga ini?')) {
      try {
        await deleteForumIdea(ideaId);
        toast.success('Ide musyawarah berhasil dihapus.');
      } catch (error) {
        toast.error('Gagal menghapus ide.');
      }
    }
  };

  // Filtering
  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          idea.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || idea.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Semua' || idea.status === selectedStatus;
    
    const userHouse = currentHouseId || guestHouseId;
    const matchesTab = activeTab === 'semua' || (activeTab === 'saya' && idea.authorHouseId === userHouse);

    return matchesSearch && matchesCategory && matchesStatus && matchesTab;
  });

  // Category Color Badges
  const getCategoryColor = (cat: string) => {
    switch(cat) {
      case 'Fasilitas': return 'bg-sky-50 text-sky-600 border-sky-100';
      case 'Kegiatan': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Keamanan': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Sosial': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'Ide Kreatif': return 'bg-rose-50 text-rose-600 border-rose-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  // Status Color Badges
  const getStatusColor = (status: ForumIdea['status']) => {
    switch(status) {
      case 'Aspirasi': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Ditinjau': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Disetujui': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Direalisasikan': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'Ditolak': return 'bg-rose-100 text-rose-800 border-rose-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Counter metrics
  const totalIdeasCount = ideas.length;
  const implementedCount = ideas.filter(i => i.status === 'Direalisasikan').length;
  const reviewingCount = ideas.filter(i => i.status === 'Ditinjau' || i.status === 'Disetujui').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Breadcrumb / Back button */}
        <button 
          onClick={() => window.history.back()}
          id="btn-back-forum"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition mb-6 bg-white border border-slate-100 shadow-sm py-2 px-4 rounded-xl cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Kembali ke Informasi RT
        </button>

        {/* Header Hero Card */}
        <div className="relative bg-gradient-to-tr from-slate-900 via-indigo-950 to-indigo-900 rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-indigo-950/10 overflow-hidden mb-8">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-white pointer-events-none">
            <Lightbulb size={240} className="animate-pulse" />
          </div>
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 text-indigo-300 py-1.5 px-4 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <MessageSquare className="w-3.5 h-3.5" />
              Musyawarah Digital RT 02
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              Sampaikan Ide & Aspirasi Anda untuk Kemajuan Bersama
            </h1>
            <p className="text-indigo-200/80 text-xs md:text-sm font-medium mt-3 leading-relaxed">
              Wadah rembug warga RT 02 secara demokratis dan transparan. Bagikan gagasan kreatif Anda untuk pembangunan, kegiatan sosial, keamanan, maupun fasilitas publik. Ide yang disukai warga akan ditindaklanjuti secara serius oleh pengurus RT.
            </p>
          </div>
        </div>

        {/* Counter Metrics Row */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
              <Lightbulb className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Usulan</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{totalIdeasCount}</h3>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-3">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Terealisasi</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{implementedCount}</h3>
          </div>
          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-3">
              <RefreshCw className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ditinjau & Disetujui</p>
            <h3 className="text-2xl font-black text-slate-800 mt-1">{reviewingCount}</h3>
          </div>
        </div>

        {/* Toolbar Filter & Search */}
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Filter Tabs */}
            <div className="flex gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 self-start">
              <button
                onClick={() => setActiveTab('semua')}
                id="btn-tab-all-forum"
                className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'semua' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Semua Ide
              </button>
              <button
                onClick={() => {
                  if (!currentHouseId && !guestHouseId) {
                    toast.info('Silakan sampaikan ide pertama Anda atau verifikasi rumah Anda agar tab ini aktif.');
                  } else {
                    setActiveTab('saya');
                  }
                }}
                id="btn-tab-my-forum"
                className={`py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === 'saya' ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Ide Saya
              </button>
            </div>

            {/* Quick Action button */}
            <button
              onClick={() => setIsFormOpen(true)}
              id="btn-add-idea-trigger"
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-indigo-600/15 transition cursor-pointer md:self-center"
            >
              <Plus className="w-4 h-4" />
              Sampaikan Ide Baru
            </button>
          </div>

          <hr className="border-slate-100 my-5" />

          {/* Filtering dropdowns and Search */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari kata kunci ide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="input-search-forum"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* Category selection */}
            <div className="relative">
              <Filter className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                id="select-category-forum"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="Semua">Kategori: Semua</option>
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Status selection */}
            <div className="relative">
              <Clock className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                id="select-status-forum"
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
              >
                <option value="Semua">Status: Semua</option>
                {STATUSES.map(stat => <option key={stat} value={stat}>{stat}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Main Ideas List Display */}
        <div className="space-y-6">
          <AnimatePresence mode="popLayout">
            {filteredIdeas.length > 0 ? (
              filteredIdeas.map((idea) => {
                const isCommentsOpen = openCommentsId === idea.id;
                const isAdminResponding = editingResponseId === idea.id;
                const hasVotedUp = idea.upvotes?.includes(currentHouseId || localStorage.getItem('guest_voter_id') || '');
                const hasVotedDown = idea.downvotes?.includes(currentHouseId || localStorage.getItem('guest_voter_id') || '');

                return (
                  <motion.div
                    key={idea.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] p-6 md:p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
                  >
                    
                    {/* Top Row: Category and Status Badge */}
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getCategoryColor(idea.category)}`}>
                          {idea.category}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusColor(idea.status)}`}>
                          {idea.status}
                        </span>
                      </div>
                      
                      {/* Trash action for Admin / Moderator */}
                      {(isAdmin || (currentHouseId && idea.authorHouseId === currentHouseId)) && (
                        <button
                          onClick={() => handleDeleteIdea(idea.id)}
                          className="text-slate-400 hover:text-rose-500 p-2 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Idea Details */}
                    <h2 className="text-xl font-black text-slate-800 tracking-tight leading-snug mb-3">
                      {idea.title}
                    </h2>
                    <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed mb-6 whitespace-pre-line">
                      {idea.description}
                    </p>

                    {/* Meta info row */}
                    <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-50 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold text-slate-700 leading-tight">
                            {idea.authorName}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                            <HomeIcon className="w-3 h-3 text-slate-300" />
                            Rumah {idea.authorHouseId || 'Luar RT'}
                          </p>
                        </div>
                      </div>

                      <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Dibuat: {new Date(idea.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>

                    {/* Admin Response Block if exists */}
                    {idea.adminNotes && !isAdminResponding && (
                      <div className="mb-6 p-5 bg-indigo-50/50 border border-indigo-100/40 rounded-3xl">
                        <div className="flex items-center gap-2 mb-2 text-indigo-700">
                          <Shield className="w-4 h-4" />
                          <h4 className="text-[11px] font-black uppercase tracking-widest">Tanggapan Pengurus RT</h4>
                        </div>
                        <p className="text-slate-600 text-xs font-semibold leading-relaxed whitespace-pre-line">
                          {idea.adminNotes}
                        </p>
                      </div>
                    )}

                    {/* Interactive Section (Upvote, Downvote, Comments Toggle) */}
                    <div className="flex flex-wrap items-center gap-3">
                      
                      {/* Upvote button */}
                      <button
                        onClick={() => handleUpvote(idea.id, idea)}
                        className={`flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer border ${hasVotedUp ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100'}`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        Setuju
                        <span className="bg-white/25 text-inherit text-[10px] py-0.5 px-1.5 rounded-md ml-1 font-extrabold">
                          {idea.upvotes?.length || 0}
                        </span>
                      </button>

                      {/* Downvote button */}
                      <button
                        onClick={() => handleDownvote(idea.id, idea)}
                        className={`flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer border ${hasVotedDown ? 'bg-rose-600 text-white border-rose-600' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100'}`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        Kurang Setuju
                        <span className="bg-white/25 text-inherit text-[10px] py-0.5 px-1.5 rounded-md ml-1 font-extrabold">
                          {idea.downvotes?.length || 0}
                        </span>
                      </button>

                      {/* Comment toggle button */}
                      <button
                        onClick={() => setOpenCommentsId(isCommentsOpen ? null : idea.id)}
                        className={`flex items-center gap-2 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer border ${isCommentsOpen ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100'}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Komentar ({idea.comments?.length || 0})
                        <ChevronDown className={`w-3.5 h-3.5 transition ${isCommentsOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Admin inline response trigger */}
                      {isAdmin && !isAdminResponding && (
                        <button
                          onClick={() => {
                            setEditingResponseId(idea.id);
                            setAdminNotesText(idea.adminNotes || '');
                            setAdminStatusSelect(idea.status);
                          }}
                          className="bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 flex items-center gap-1.5 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Beri Tanggapan RT
                        </button>
                      )}
                    </div>

                    {/* Admin Response Panel (Inline editor) */}
                    {isAdminResponding && (
                      <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-3xl relative">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-indigo-700">
                            <Shield className="w-4 h-4" />
                            <h4 className="text-xs font-black uppercase tracking-widest">Panel Tindakan Pengurus RT</h4>
                          </div>
                          <button
                            onClick={() => setEditingResponseId(null)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="space-y-4">
                          {/* Status select dropdown */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Ubah Status Usulan</label>
                            <select
                              value={adminStatusSelect}
                              onChange={(e) => setAdminStatusSelect(e.target.value as ForumIdea['status'])}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            >
                              {STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                            </select>
                          </div>

                          {/* Notes description textarea */}
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Tanggapan/Catatan Resmi RT</label>
                            <textarea
                              placeholder="Ketik keputusan rapat RT, rincian realisasi, atau alasan penangguhan..."
                              rows={3}
                              value={adminNotesText}
                              onChange={(e) => setAdminNotesText(e.target.value)}
                              className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateStatusAndNotes(idea.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer"
                            >
                              Simpan Keputusan
                            </button>
                            <button
                              onClick={() => setEditingResponseId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-600 font-bold text-xs py-2.5 px-5 rounded-xl transition cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expandable Comments Drawer Section */}
                    {isCommentsOpen && (
                      <div className="mt-6 pt-6 border-t border-slate-100">
                        <h4 className="text-xs font-black text-slate-700 mb-4">Komentar & Partisipasi Warga:</h4>
                        
                        {/* Comments List */}
                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                          {idea.comments && idea.comments.length > 0 ? (
                            idea.comments.map((comment) => (
                              <div key={comment.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                                <div className="flex items-center justify-between gap-4 mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] font-extrabold text-slate-700">{comment.authorName}</span>
                                    <span className="text-[9px] font-extrabold bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md uppercase">Rumah {comment.authorHouseId}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400">
                                    {new Date(comment.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <p className="text-slate-600 text-xs font-medium leading-relaxed">{comment.content}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-slate-400 text-xs font-medium py-2">Belum ada komentar warga. Jadilah yang pertama memberikan masukan!</p>
                          )}
                        </div>

                        {/* Leave a Comment form */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Tulis saran atau masukan Anda..."
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(idea.id, idea);
                            }}
                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            onClick={() => handleAddComment(idea.id, idea)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-xl transition cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800">Tidak ada Ide atau Aspirasi</h3>
                <p className="text-slate-400 text-xs font-medium mt-1.5 max-w-md mx-auto">
                  Belum ada usulan warga yang cocok dengan kriteria pencarian Anda. Klik tombol "Sampaikan Ide Baru" di atas untuk membagikan gagasan pertama Anda.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* CREATE NEW IDEA DIALOG MODAL */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-6 md:p-8 max-w-lg w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-none">Usulkan Gagasan Baru</h3>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1.5">Musyawarah Warga RT 02</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateIdea} className="space-y-4">
                
                {/* Non-verified user needs name and house input */}
                {(!currentResidentName || !currentHouseId) && (
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-2 gap-3 mb-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                      <input
                        type="text"
                        placeholder="Contoh: Budi Santoso"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">No. Rumah / Blok</label>
                      <input
                        type="text"
                        placeholder="Contoh: B-05"
                        value={guestHouseId}
                        onChange={(e) => setGuestHouseId(e.target.value)}
                        required
                        className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                      />
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Judul Ide / Gagasan</label>
                  <input
                    type="text"
                    placeholder="Contoh: Pengadaan Mesin Potong Rumput RT"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    required
                    maxLength={100}
                    id="input-idea-title"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category select */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Kategori Bidang</label>
                  <select
                    value={ideaCat}
                    onChange={(e) => setIdeaCat(e.target.value as typeof CATEGORIES[number])}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Deskripsi Lengkap & Solusi</label>
                  <textarea
                    placeholder="Sampaikan gagasan Anda sedetail mungkin, termasuk rincian usulan, perkiraan biaya (jika ada), atau cara merealisasikannya..."
                    rows={4}
                    value={ideaDesc}
                    onChange={(e) => setIdeaDesc(e.target.value)}
                    required
                    id="input-idea-desc"
                    className="w-full p-4 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    id="btn-submit-idea"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/15 transition cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Mengirim...' : 'Kirim Aspirasi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-3.5 px-5 rounded-xl transition cursor-pointer"
                  >
                    Batal
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
