import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  FileText, ShoppingCart, Vote, AlertTriangle, Megaphone, 
  Clock, Moon, Calendar, ChevronRight, ArrowRight, ShieldCheck, UserPlus, ShieldAlert, CheckCircle2, User,
  Camera, Send, Home, Phone, Info, Lock, Eye, EyeOff, Droplets
} from 'lucide-react';
import { motion } from 'motion/react';
import { House, Announcement, Report, Official, RondaSchedule, GalleryItem, PatrolSession, LetterRequest, MapPoint } from '../../types';
import { HeroSection } from '../HeroSection';
import { DigitalSummary } from './DigitalSummary';
import { ServiceStats } from '../ServiceStats';
import { HouseMap } from '../HouseMap';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useFinancial } from '../../context/FinancialContext';
import { addReportToDb, validateResidentAccess, formatHouseId } from '../../services/databaseService';

interface PublicHomeProps {
  houses: House[];
  announcements: Announcement[];
  ronda: RondaSchedule[];
  reports: Report[];
  letters: LetterRequest[];
  officials: Official[];
  gallery: GalleryItem[];
  activePatrol: PatrolSession | null;
  mapPoints: MapPoint[];
}

export const PublicHome: React.FC<PublicHomeProps> = ({ 
  houses, announcements, ronda, reports, letters, officials, gallery, activePatrol, mapPoints
}) => {
  const navigate = useNavigate();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const { summaries, settings: financialSettings } = useFinancial();
  const [statusSearchId, setStatusSearchId] = React.useState('');
  
  const [isReportModalOpen, setIsReportModalOpen] = React.useState(false);
  const [reportForm, setReportForm] = React.useState({
    type: 'Keamanan' as Report['type'],
    description: '',
    reporterName: '',
    reporterHouseId: '',
    reporterPhone: '',
    pin: ''
  });
  const [showPin, setShowPin] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.description || !reportForm.reporterName || !reportForm.reporterHouseId || !reportForm.pin) {
      toast.error("Mohon lengkapi data laporan dan verifikasi");
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate PIN
      const isValid = await validateResidentAccess(reportForm.reporterHouseId, reportForm.pin);
      if (!isValid) {
        toast.error("Verifikasi Gagal!", {
          description: "Kode Akses Rumah (PIN) tidak valid."
        });
        setIsSubmitting(false);
        return;
      }

      const formattedHouseId = formatHouseId(reportForm.reporterHouseId);
      const { pin, ...reportData } = reportForm;

      await addReportToDb({
        ...reportData,
        reporterHouseId: formattedHouseId,
        date: new Date().toISOString(),
        status: 'Baru'
      });
      toast.success("Laporan berhasil dikirim!", {
        description: "Terima kasih atas laporannya. Pengurus RT akan segera menindaklanjuti."
      });
      setIsReportModalOpen(false);
      setReportForm({
        type: 'Keamanan',
        description: '',
        reporterName: '',
        reporterHouseId: '',
        reporterPhone: '',
        pin: ''
      });
    } catch (error) {
      toast.error("Gagal mengirim laporan");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCheckStatus = (e: React.FormEvent) => {
    e.preventDefault();
    const house = houses.find(h => h.id.toLowerCase() === statusSearchId.toLowerCase());
    if (house) {
      navigate(`/info?search=${statusSearchId}`);
    } else {
      toast.error("No. Rumah tidak ditemukan", {
        description: "Pastikan format benar (Contoh: A1-01)"
      });
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 19) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const dateObj = new Date();
  const today = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
  const fullDate = dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const todayRonda = ronda.find((r) => r.day === today);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const quickActions = [
    { label: 'Dashboard', icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', link: '/resident' },
    { label: 'Buat Surat', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', link: '/services' },
    { label: 'Lapor Tamu', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', link: '/services?tab=tamu' },
    { label: 'Registrasi Penghuni', icon: UserPlus, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', link: '/register' },
    { label: 'Pasar Warga', icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', link: '/market' },
    { label: 'Info Publik', icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', link: '/info' },
    { label: 'E-Voting', icon: Vote, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', link: '/voting' },
    { label: 'Aspirasi & Pengaduan', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', action: () => setIsReportModalOpen(true) }
  ];

  const [filterType, setFilterType] = React.useState<'All' | 'General' | 'Urgent' | 'Event'>('All');

  const filteredAnnouncements = announcements.filter(a => filterType === 'All' || a.type === filterType);

  const handleExplore = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-12 mb-24 relative"
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] right-[5%] w-[30%] h-[30%] bg-indigo-200/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute top-[40%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[10%] right-[-5%] w-[25%] h-[25%] bg-amber-200/10 blur-[80px] rounded-full" />
      </div>

      <HeroSection onExplore={handleExplore} />

      {/* Personalized Greeting */}
      <div ref={contentRef} className="text-center md:text-left">
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">
          {getGreeting()}, Warga! 👋
        </h2>
        <p className="text-slate-500 font-medium mt-2">Selamat datang kembali di sistem informasi digital RT 02.</p>
      </div>

      <DigitalSummary />

      {/* Resident Dues Widget - NEW Bento Card */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[3rem] text-white shadow-2xl shadow-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Droplets size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Keuangan Warga</p>
            <h3 className="text-2xl font-black mb-4 tracking-tight">Iuran Bulanan</h3>
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                    <Droplets size={16} />
                  </div>
                  <span className="text-xs font-bold">Tarif Air</span>
                </div>
                <span className="text-xs font-black">Rp {financialSettings.airFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <ShoppingCart size={16} />
                  </div>
                  <span className="text-xs font-bold">Tarif Sampah</span>
                </div>
                <span className="text-xs font-black">Rp {financialSettings.sampahFee.toLocaleString('id-ID')}</span>
              </div>
              
              {/* Info Transparansi Tambahan */}
              <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dana Air Terkumpul</span>
                  <span className="text-sm font-black text-blue-400">Rp {summaries.air.totalCollected.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dana Sampah Terkumpul</span>
                  <span className="text-sm font-black text-emerald-400">Rp {summaries.sampah.totalCollected.toLocaleString('id-ID')}</span>
                </div>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Keseluruhan</span>
                  <span className="text-sm font-black text-white">Rp {summaries.totalCollected.toLocaleString('id-ID')}</span>
                </div>
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter mt-1">Bulan {summaries.totalCollected > 0 ? 'Berjalan' : 'Ini'}</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/services?tab=iuran')}
              variant="secondary" 
              className="w-full py-4 rounded-2xl text-[10px] tracking-widest"
            >
              Bayar Sekarang
            </Button>
          </div>
        </div>

        <div className="md:col-span-2 bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-500/5 flex flex-col justify-between group">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-1">Status Pembayaran</p>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Cek Tagihan Rumah</h3>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600">
              <CheckCircle2 size={24} />
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-1 w-full">
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
                Masukkan nomor rumah Anda untuk melihat rincian tagihan iuran air dan sampah yang belum terbayar.
              </p>
              <form onSubmit={handleCheckStatus} className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="No. Rumah (A1-01)" 
                  className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  value={statusSearchId}
                  onChange={e => setStatusSearchId(e.target.value)}
                />
                <Button type="submit" className="px-8 rounded-2xl">
                  Cek
                </Button>
              </form>
            </div>
            <div className="hidden md:block w-px h-32 bg-slate-100 mx-4" />
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="p-6 bg-slate-50 rounded-[2rem] text-center border border-slate-100 group-hover:bg-indigo-50 transition-colors flex flex-col justify-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Rumah</p>
                <p className="text-2xl font-black text-slate-800">{houses.length}</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                  {houses.filter(h => h.status === 'Occupied').length} Rumah Terisi
                </p>
              </div>
              <div className="p-6 bg-slate-50 rounded-[2rem] text-center border border-slate-100 group-hover:bg-emerald-50 transition-colors">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Lunas Iuran</p>
                <div className="flex flex-col items-center">
                  <p className="text-2xl font-black text-emerald-600">
                    {summaries.fullyPaidHousesCount}
                  </p>
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-tighter mt-0.5">Lunas Keduanya</p>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-200/50 grid grid-cols-2 gap-1">
                  <div className="text-center">
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Air</p>
                    <p className="text-[10px] font-black text-blue-600">
                      {houses.filter(h => h.status === 'Occupied').length - summaries.air.unpaidCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest">Sampah</p>
                    <p className="text-[10px] font-black text-emerald-600">
                      {houses.filter(h => h.status === 'Occupied').length - summaries.sampah.unpaidCount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ServiceStats houses={houses} reports={reports} letters={letters} />

      {/* Quick Actions - Bento Style */}
      <div className="flex md:grid md:grid-cols-8 gap-4 -mt-8 relative z-10 overflow-x-auto no-scrollbar pb-4 md:pb-0 px-2 md:px-0">
        {quickActions.map((action, idx) => (
          <motion.button
            key={idx}
            variants={itemVariants}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.action || (() => navigate(action.link))}
            className={`
              flex flex-col items-center justify-center gap-3 p-5 min-w-[140px] md:min-w-0
              bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/40 border ${action.border}
              transition-all duration-500 group relative overflow-hidden flex-shrink-0 md:flex-shrink
            `}
          >
            <div className={`absolute inset-0 ${action.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <div className={`
              relative z-10 p-3 rounded-2xl ${action.bg} ${action.color} 
              group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm
            `}>
              <action.icon size={24} strokeWidth={2.5} />
            </div>
            <span className="relative z-10 font-black text-slate-700 text-xs uppercase tracking-widest group-hover:text-slate-900 transition-colors">
              {action.label}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Quick Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title="Aspirasi & Pengaduan Warga" maxWidth="max-w-xl">
        <div className="p-6">
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 mb-6 flex gap-3">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl h-fit">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight">Layanan Aspirasi & Pengaduan</h4>
              <p className="text-xs text-rose-700 font-medium leading-relaxed">
                Gunakan formulir ini untuk melaporkan masalah keamanan, kebersihan, fasilitas, atau memberikan saran/aspirasi untuk lingkungan RT 02.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmitReport} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kategori Laporan/Aspirasi</label>
                <select 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={reportForm.type}
                  onChange={e => setReportForm({...reportForm, type: e.target.value as any})}
                >
                  <option value="Keamanan">Keamanan</option>
                  <option value="Kebersihan">Kebersihan</option>
                  <option value="Fasilitas">Fasilitas</option>
                  <option value="Sosial">Sosial</option>
                  <option value="Aspirasi/Saran">Aspirasi/Saran</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Pelapor</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Nama Lengkap"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={reportForm.reporterName}
                    onChange={e => setReportForm({...reportForm, reporterName: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. Rumah Pelapor <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Contoh: A1-05"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={reportForm.reporterHouseId}
                    onChange={e => setReportForm({...reportForm, reporterHouseId: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">PIN Akses Rumah <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type={showPin ? "text" : "password"} 
                    placeholder="••••••"
                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={reportForm.pin}
                    onChange={e => setReportForm({...reportForm, pin: e.target.value})}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">No. WhatsApp</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="0812..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  value={reportForm.reporterPhone}
                  onChange={e => setReportForm({...reportForm, reporterPhone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Laporan / Aspirasi</label>
              <textarea 
                rows={4}
                placeholder="Jelaskan secara detail masalah atau saran Anda..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                value={reportForm.description}
                onChange={e => setReportForm({...reportForm, description: e.target.value})}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest"
                onClick={() => setIsReportModalOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="flex-[2] py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-rose-100"
              >
                {isSubmitting ? 'Mengirim...' : (
                  <span className="flex items-center gap-2">
                    <Send size={16} /> Kirim Laporan/Aspirasi
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Map Section - Immersive */}
      <motion.div 
        variants={itemVariants} 
        className="w-full bg-white/60 backdrop-blur-md p-3 rounded-[3rem] shadow-2xl shadow-indigo-500/5 border border-white/50 relative group"
      >
        <HouseMap 
          houses={houses} 
          isAdmin={false} 
          reports={reports} 
          officials={officials} 
          mapPoints={mapPoints}
          onReportHouse={(house: House) => navigate(`/services?tab=lapor&houseId=${house.id}`)} 
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Announcements - Editorial Style */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-slate-200 pb-6">
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2">Update Terkini</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                Warta <span className="italic font-serif text-indigo-600">Warga</span>
              </h2>
            </div>
            
            {/* Filter Tabs - Modern */}
            <div className="flex bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200">
              {[
                { id: 'All', label: 'Semua' },
                { id: 'Urgent', label: 'Penting' },
                { id: 'Event', label: 'Acara' },
                { id: 'General', label: 'Info' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id as any)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    filterType === tab.id 
                      ? 'bg-white text-indigo-600 shadow-md' 
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {filteredAnnouncements.map((ann, idx) => (
              <motion.div 
                key={ann.id} 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ x: 10 }}
                className="bg-white/80 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <span className={`
                        px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border
                        ${ann.type === 'Urgent' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                          ann.type === 'Event' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                          'bg-indigo-50 text-indigo-600 border-indigo-100'}
                      `}>
                        {ann.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <Clock size={12} strokeWidth={3} /> 
                        {new Date(ann.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                      {ann.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line line-clamp-3 group-hover:line-clamp-none transition-all duration-500">
                      {ann.content}
                    </p>
                  </div>
                  <div className="md:pt-1">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {filteredAnnouncements.length === 0 && (
              <div className="text-center p-20 bg-white/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200">
                <Megaphone size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Belum ada kabar terbaru</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Sidebar Widgets - Specialist Tool Style */}
        <motion.div variants={itemVariants} className="space-y-10">
          {/* Status Check Widget */}
          <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
              <CheckCircle2 size={160} />
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-2">Layanan Mandiri</p>
              <h3 className="text-3xl font-black mb-3 tracking-tighter leading-none">Cek Iuran Mandiri <br/><span className="italic font-serif">Air & Sampah</span></h3>
              <p className="text-xs text-indigo-100 mb-8 font-medium leading-relaxed">Verifikasi status pembayaran iuran rumah Anda secara instan dan transparan untuk iuran air dan sampah.</p>
              <form onSubmit={handleCheckStatus} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="No. Rumah (A1-01)" 
                    className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-[1.5rem] text-sm font-bold placeholder:text-indigo-200 outline-none focus:bg-white/20 focus:border-white/40 transition-all"
                    value={statusSearchId}
                    onChange={e => setStatusSearchId(e.target.value)}
                  />
                </div>
                <Button 
                  type="submit" 
                  variant="secondary" 
                  className="w-full py-4 rounded-[1.5rem]"
                >
                  Periksa Sekarang
                </Button>
              </form>
            </div>
          </div>

          {/* Ronda Widget - Hardware Style */}
          <div className="bg-slate-950 text-white p-10 rounded-[3rem] shadow-2xl shadow-slate-900/40 relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity duration-700 rotate-12">
              <Moon size={180} />
            </div>
            
            <div className="relative z-10">
              {activePatrol && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl backdrop-blur-md"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Live Patrol</span>
                    </div>
                    <span className="text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                      {new Date(activePatrol.startTime).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30 shadow-inner">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <p className="font-black text-white text-lg leading-tight tracking-tight">{activePatrol.officerName}</p>
                      <p className="text-[10px] text-emerald-400/60 font-black uppercase tracking-widest mt-1">Petugas Aktif</p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="mb-8 pb-8 border-b border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Jadwal Ronda</p>
                  <p className="text-5xl font-black text-white leading-none tracking-tighter mb-3">{today}</p>
                  <p className="text-xs text-slate-500 font-bold flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-500" /> {fullDate}
                  </p>
                </div>
                <div className="bg-indigo-600/20 backdrop-blur-md px-5 py-2 rounded-2xl border border-indigo-500/30">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Shift Malam</span>
                </div>
              </div>

              <div className="space-y-4">
                {todayRonda && (todayRonda.shifts || todayRonda.members.length > 0) ? (
                  todayRonda.shifts ? (
                    todayRonda.shifts.map((shift, i) => (
                      <div key={shift.id} className="space-y-3 p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-500 group/shift">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2">
                            <Clock size={12} strokeWidth={3} /> {shift.time}
                          </p>
                          <span className="text-[9px] font-black bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">Shift {i+1}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {shift.members.map((member, j) => (
                            <span key={j} className="text-[11px] font-black text-white/80 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 group-hover/shift:border-indigo-500/30 transition-colors">
                              {member}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    todayRonda.members.map((member, i) => (
                      <div key={i} className="flex items-center gap-5 p-4 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-500">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm border border-indigo-500/30 shadow-inner">
                          {i + 1}
                        </div>
                        <span className="font-black text-base tracking-tight text-white/90">{member}</span>
                      </div>
                    ))
                  )
                ) : (
                  <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 text-xs font-black uppercase tracking-widest">
                    Jadwal belum diatur
                  </div>
                )}
              </div>

              <Button 
                onClick={() => navigate('/info')} 
                variant="secondary"
                className="mt-10 w-full py-5 rounded-[2rem] text-[10px] tracking-[0.3em] gap-3"
              >
                Selengkapnya <ChevronRight size={16} strokeWidth={3}/>
              </Button>
            </div>
          </div>

          {/* Gallery Widget - Creative Style */}
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-[3rem] border border-white/50 shadow-2xl shadow-indigo-500/5 group">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Galeri <span className="text-indigo-600 italic font-serif">Warga</span></h3>
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                <ArrowRight size={18} />
              </div>
            </div>
            {gallery.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {gallery.slice(0, 4).map((item, i) => (
                  <motion.div 
                    key={item.id} 
                    whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 2 : -2 }}
                    className="relative aspect-[4/5] rounded-[2rem] overflow-hidden group/img cursor-pointer shadow-md"
                  >
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-1000" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/img:opacity-100 transition-all duration-500 flex items-end p-5">
                      <p className="text-[10px] text-white font-black uppercase tracking-widest leading-tight">
                        {item.title}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-300 text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                Galeri masih kosong
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
