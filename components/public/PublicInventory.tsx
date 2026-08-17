import React, { useState, useRef } from 'react';
import { 
  Package, Search, Calendar, Clock, CheckCircle2, AlertCircle, Send, User, MapPin, Phone, 
  Sparkles, ShieldCheck, Box, History, Info, Check, Lock, ChevronRight, RefreshCw, XCircle, ShieldAlert, Edit3, Eraser
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { InventoryItem, House } from '../../types';
import { addInventoryLogToDb, validateResidentAccess, formatHouseId, handleFirestoreError, OperationType } from '../../services/databaseService';

interface PublicInventoryProps {
  inventory: InventoryItem[];
  houses?: House[];
}

export const PublicInventory: React.FC<PublicInventoryProps> = ({ inventory = [], houses = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [selectedAsset, setSelectedAsset] = useState<InventoryItem | null>(null);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Digital Signature State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Form State
  const [borrowerCategory, setBorrowerCategory] = useState<'resident' | 'non_resident'>('resident');
  const [borrowForm, setBorrowForm] = useState({
    borrowerName: '',
    borrowerHouseId: '',
    borrowerPhone: '',
    originAddress: '', // For Non-Resident
    nikKtp: '', // For Non-Resident
    pin: '',
    quantity: 1,
    borrowDate: new Date().toISOString().split('T')[0],
    returnDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // Default 2 days
    purpose: ''
  });

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  const categories = ['Semua', 'Perlengkapan Acara', 'Alat Kebersihan', 'Keamanan', 'Peralatan Tukang', 'Lainnya'];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenBorrowModal = (item: InventoryItem) => {
    if (item.available <= 0) {
      toast.error("Stok Barang Tidak Tersedia", {
        description: `Seluruh unit ${item.name} sedang dalam masa peminjaman oleh warga lain.`
      });
      return;
    }
    setSelectedAsset(item);
    setBorrowForm(prev => ({ ...prev, quantity: 1 }));
    setIsBorrowModalOpen(true);
  };

  const handleSubmitBorrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;

    if (borrowerCategory === 'resident') {
      if (!borrowForm.borrowerName || !borrowForm.borrowerHouseId || !borrowForm.borrowerPhone || !borrowForm.pin || !borrowForm.purpose) {
        toast.error("Mohon lengkapi seluruh isian formulir peminjaman warga");
        return;
      }
    } else {
      if (!borrowForm.borrowerName || !borrowForm.originAddress || !borrowForm.nikKtp || !borrowForm.borrowerPhone || !borrowForm.purpose) {
        toast.error("Mohon lengkapi data peminjam luar (Nama, Alamat Asal, NIK KTP, & WA)");
        return;
      }
    }

    if (!signatureData) {
      toast.error("Tanda Tangan Digital Wajib Diisi!", {
        description: "Mohon bubuhkan tanda tangan peminjam pada kotak persetujuan sebelum mengirimkan pengajuan."
      });
      return;
    }

    if (borrowForm.quantity > selectedAsset.available) {
      toast.error(`Jumlah melebihi stok! Maksimal yang tersedia: ${selectedAsset.available} unit.`);
      return;
    }

    setIsSubmitting(true);
    try {
      let formattedHouseId = 'Luar RT 02';
      if (borrowerCategory === 'resident') {
        // Validate PIN for RT 02 Residents
        const isValid = await validateResidentAccess(borrowForm.borrowerHouseId, borrowForm.pin);
        if (!isValid) {
          toast.error("Verifikasi Gagal!", {
            description: "Kode Akses Rumah (PIN) tidak valid."
          });
          setIsSubmitting(false);
          return;
        }
        formattedHouseId = formatHouseId(borrowForm.borrowerHouseId);
      }

      const logId = `INV-${Date.now().toString().slice(-6)}`;

      const borrowPayload = {
        id: logId,
        itemId: selectedAsset.id,
        itemName: selectedAsset.name,
        borrowerName: borrowForm.borrowerName,
        borrowerCategory: borrowerCategory === 'resident' ? 'Warga RT 02' : 'Luar RT / Non-Residen',
        borrowerHouseId: borrowerCategory === 'resident' ? formattedHouseId : `Luar RT (${borrowForm.originAddress})`,
        nikKtp: borrowerCategory === 'non_resident' ? borrowForm.nikKtp : undefined,
        originAddress: borrowerCategory === 'non_resident' ? borrowForm.originAddress : undefined,
        borrowerPhone: borrowForm.borrowerPhone,
        quantity: Number(borrowForm.quantity),
        borrowDate: borrowForm.borrowDate,
        returnDate: borrowForm.returnDate,
        purpose: borrowForm.purpose,
        signature: signatureData, // Digital Signature Base64 Data URL
        status: 'Borrowed',
        createdAt: new Date().toISOString()
      };

      await addInventoryLogToDb(borrowPayload);

      toast.success("Pengajuan Peminjaman Berhasil!", {
        description: `ID Resi: #${logId} | Peminjam: ${borrowerCategory === 'resident' ? 'Warga RT 02' : 'Luar RT'} | Barang: ${selectedAsset.name} (${borrowForm.quantity} unit).`,
        action: {
          label: "WhatsApp Pengurus",
          onClick: () => {
            const categoryText = borrowerCategory === 'resident' ? `Warga RT 02 (${formattedHouseId})` : `Peminjam Luar RT (${borrowForm.originAddress}, NIK: ${borrowForm.nikKtp})`;
            const waMsg = `Halo Pengurus RT 02 (Sie Peralatan), saya ${borrowForm.borrowerName} [${categoryText}] telah mengajukan peminjaman ${selectedAsset.name} sejumlah ${borrowForm.quantity} unit dengan ID Resi #${logId} untuk keperluan ${borrowForm.purpose}. Mohon konfirmasinya. Terima kasih!`;
            window.open(`https://wa.me/6285961194621?text=${encodeURIComponent(waMsg)}`, '_blank');
          }
        },
        duration: 10000
      });

      setIsBorrowModalOpen(false);
      setSelectedAsset(null);
      setBorrowForm({
        borrowerName: '',
        borrowerHouseId: '',
        borrowerPhone: '',
        originAddress: '',
        nikKtp: '',
        pin: '',
        quantity: 1,
        borrowDate: new Date().toISOString().split('T')[0],
        returnDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        purpose: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "inventoryLogs");
      toast.error("Gagal mengirimkan pengajuan peminjaman");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 py-8 font-sans space-y-10"
    >
      {/* Clean Modern Minimalist Hero Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-[2.5rem] p-8 md:p-12 text-slate-900 border border-slate-200/70 shadow-sm relative overflow-hidden"
      >
        {/* Subtle Animated Background Glow */}
        <motion.div 
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 right-0 w-96 h-96 bg-amber-50/70 rounded-full blur-3xl pointer-events-none" 
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-50/60 rounded-full blur-3xl pointer-events-none" 
        />

        <div className="relative z-10 max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 bg-amber-50 border border-amber-200/70 px-4 py-1.5 rounded-full shadow-xs">
            <Sparkles size={14} className="text-amber-600 animate-spin-slow" /> Inventaris &amp; Fasilitas Publik RT 02
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
            Peminjaman Inventaris <span className="text-amber-600 font-serif italic">&amp; Aset Warga</span>
          </h1>
          <p className="text-slate-500 font-medium text-xs md:text-sm leading-relaxed max-w-2xl">
            Layanan peminjaman mandiri perlengkapan acara hajatan, alat pertukangan, sound system, hingga peralatan siskamling lingkungan secara transparan untuk warga RT 02 &amp; warga luar.
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 transition-all hover:bg-white hover:shadow-xs">
              <p className="text-xl font-black text-slate-900">{inventory.length}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <Box size={12} className="text-amber-500" /> Total Jenis Barang
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 transition-all hover:bg-white hover:shadow-xs">
              <p className="text-xl font-black text-emerald-600">
                {inventory.reduce((sum, item) => sum + (item.available || 0), 0)} Unit
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-500" /> Stok Siap Pinjam
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/60 transition-all hover:bg-white hover:shadow-xs">
              <p className="text-xl font-black text-indigo-600">Verifikasi Resmi</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <ShieldCheck size={12} className="text-indigo-500" /> PIN Warga / NIK KTP
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari tenda, sound, alat pertukangan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-black tracking-wide whitespace-nowrap transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'bg-slate-50 text-slate-600 border border-slate-200/60 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Inventory Catalog Cards Grid */}
      {filteredInventory.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/70 p-8 space-y-3">
          <Package size={48} className="mx-auto text-slate-300 stroke-1" />
          <h3 className="text-base font-bold text-slate-800">Barang Inventaris Tidak Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Coba ubah kata kunci pencarian atau ganti filter kategori barang.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventory.map((item) => {
            const isAvailable = item.available > 0;
            return (
              <motion.div
                key={item.id}
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="bg-white rounded-3xl border border-slate-200/80 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100/80 group-hover:scale-105 transition-transform">
                      <Package size={24} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      isAvailable 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' 
                        : 'bg-rose-50 text-rose-700 border-rose-200/80'
                    }`}>
                      {isAvailable ? `${item.available} Tersedia` : 'Sedang Dipinjam'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100/60 inline-block mb-1">
                      {item.category}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight group-hover:text-amber-700 transition-colors">
                      {item.name}
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-2xl border border-slate-200/50">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kondisi</p>
                      <p className="font-bold text-slate-800 mt-0.5">{item.condition}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Unit</p>
                      <p className="font-bold text-slate-800 mt-0.5">{item.total} Unit</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenBorrowModal(item)}
                  disabled={!isAvailable}
                  className={`mt-6 w-full py-3 px-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isAvailable
                      ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm active:scale-95'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <Send size={14} />
                  <span>{isAvailable ? 'Ajukan Peminjaman' : 'Stok Habis'}</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Borrow Modal Form */}
      <AnimatePresence>
        {isBorrowModalOpen && selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2.5rem] md:rounded-[3rem] border border-slate-200/90 shadow-2xl max-w-xl w-full p-6 md:p-8 relative font-sans max-h-[90vh] flex flex-col my-auto"
            >
              {/* Sticky Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 shadow-xs">
                    <Package size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Portal Layanan Resmi</span>
                      <span className="text-[9px] font-bold text-slate-400">&bull; RT 02/RW 020</span>
                    </div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight mt-0.5">Pengajuan Peminjaman Barang</h3>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedAsset.name} (Tersedia: {selectedAsset.available} unit)</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsBorrowModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <XCircle size={22} />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <div className="overflow-y-auto pr-1 space-y-4 flex-1 no-scrollbar">
                {/* Notice Banner Pengembalian & Garansi */}
                <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                  <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed text-amber-900">
                    <span className="font-extrabold block">Aturan Pemeliharaan Aset RT:</span>
                    Setiap barang wajib dikembalikan sesuai durasi dalam kondisi bersih. {borrowerCategory === 'non_resident' ? 'Peminjam luar RT wajib menyerahkan KTP fisik asli sebagai jaminan sementara saat pengambilan.' : 'Peminjaman gratis tanpa biaya rental bagi warga terdaftar RT 02.'}
                  </div>
                </div>

                <form id="borrowForm" onSubmit={handleSubmitBorrow} className="space-y-4">
                  {/* Borrower Category Switcher Tabs */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Kategori Status Peminjam</label>
                    <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setBorrowerCategory('resident')}
                        className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          borrowerCategory === 'resident'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <User size={13} />
                        Warga RT 02
                      </button>
                      <button
                        type="button"
                        onClick={() => setBorrowerCategory('non_resident')}
                        className={`flex-1 py-2 rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          borrowerCategory === 'non_resident'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        <ShieldAlert size={13} />
                        Luar RT / Instansi
                      </button>
                    </div>
                  </div>

                  {/* Form Fields Section 1: Identitas Peminjam */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block">1. Identitas &amp; Kontak Peminjam</span>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                        <span>Nama Lengkap Peminjam</span>
                        <span className="text-[10px] text-slate-400 font-medium">Sesuai KTP Sah</span>
                      </label>
                      <div className="relative">
                        <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text"
                          required
                          placeholder="Masukkan nama peminjam..."
                          value={borrowForm.borrowerName}
                          onChange={(e) => setBorrowForm({ ...borrowForm, borrowerName: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                        />
                      </div>
                    </div>

                    {borrowerCategory === 'resident' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Blok &amp; No. Rumah</label>
                          <div className="relative">
                            <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              required
                              placeholder="Contoh: A-05"
                              value={borrowForm.borrowerHouseId}
                              onChange={(e) => setBorrowForm({ ...borrowForm, borrowerHouseId: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp Active</label>
                          <div className="relative">
                            <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="tel"
                              required
                              placeholder="08xxxxxxxxxx"
                              value={borrowForm.borrowerPhone}
                              onChange={(e) => setBorrowForm({ ...borrowForm, borrowerPhone: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">NIK KTP Peminjam</label>
                            <input 
                              type="text"
                              required
                              maxLength={16}
                              placeholder="16 digit NIK KTP..."
                              value={borrowForm.nikKtp}
                              onChange={(e) => setBorrowForm({ ...borrowForm, nikKtp: e.target.value })}
                              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">No. WhatsApp Active</label>
                            <div className="relative">
                              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                type="tel"
                                required
                                placeholder="08xxxxxxxxxx"
                                value={borrowForm.borrowerPhone}
                                onChange={(e) => setBorrowForm({ ...borrowForm, borrowerPhone: e.target.value })}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Domisili Asal / Nama Instansi</label>
                          <div className="relative">
                            <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                              type="text"
                              required
                              placeholder="Contoh: RT 03 Kelurahan Tondo / Panitia Karang Taruna"
                              value={borrowForm.originAddress}
                              onChange={(e) => setBorrowForm({ ...borrowForm, originAddress: e.target.value })}
                              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Form Fields Section 2: Detail Rincian Barang & Waktu */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block">2. Rincian Peminjaman &amp; Keperluan</span>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Jumlah Unit</label>
                        <input 
                          type="number"
                          min={1}
                          max={selectedAsset.available}
                          required
                          value={borrowForm.quantity}
                          onChange={(e) => setBorrowForm({ ...borrowForm, quantity: Number(e.target.value) })}
                          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all text-center"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tgl Pinjam</label>
                        <input 
                          type="date"
                          required
                          value={borrowForm.borrowDate}
                          onChange={(e) => setBorrowForm({ ...borrowForm, borrowDate: e.target.value })}
                          className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Tgl Kembali</label>
                        <input 
                          type="date"
                          required
                          value={borrowForm.returnDate}
                          onChange={(e) => setBorrowForm({ ...borrowForm, returnDate: e.target.value })}
                          className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Tujuan / Deskripsi Acara Peminjaman</label>
                      <textarea 
                        rows={2}
                        required
                        placeholder="Jelaskan jenis kegiatan (misal: Pernikahan, Kerja Bakti, Takziyah, Perbaikan Hunian)..."
                        value={borrowForm.purpose}
                        onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                      />
                    </div>
                  </div>

                  {/* Form Fields Section 3: Verifikasi Keamanan */}
                  {borrowerCategory === 'resident' && (
                    <div className="pt-3 border-t border-slate-100">
                      <span className="text-[9px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 inline-block mb-2">3. Otorisasi Otentikasi Warga</span>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">PIN 6 Digit Akses Rumah Mandiri</label>
                        <div className="relative">
                          <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input 
                            type={showPin ? "text" : "password"}
                            required
                            placeholder="Masukkan 6 digit PIN rumah..."
                            value={borrowForm.pin}
                            onChange={(e) => setBorrowForm({ ...borrowForm, pin: e.target.value })}
                            className="w-full pl-10 pr-24 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-500 focus:ring-3 focus:ring-amber-500/10 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPin(!showPin)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 text-[10px] font-bold px-2 py-1 bg-white rounded-lg border border-slate-200 shadow-2xs cursor-pointer"
                          >
                            {showPin ? "Sembunyikan" : "Tampilkan"}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Fields Section 4: Tanda Tangan Digital Peminjam */}
                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block">
                        {borrowerCategory === 'resident' ? '4. Tanda Tangan Digital Peminjam' : '3. Tanda Tangan Digital Peminjam'}
                      </span>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-[10px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Eraser size={12} /> Hapus Tanda Tangan
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-2 relative">
                      <canvas
                        ref={canvasRef}
                        width={460}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-28 bg-white rounded-xl border border-dashed border-slate-300 cursor-crosshair touch-none"
                      />
                      {!signatureData && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-semibold gap-1.5 opacity-60">
                          <Edit3 size={14} /> Goreskan tanda tangan Anda di sini...
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1">
                      * Tanda tangan digital ini akan dilampirkan pada Bukti Resi &amp; Berita Acara Peminjaman Aset RT 02.
                    </p>
                  </div>
                </form>
              </div>

              {/* Sticky Submit Footer */}
              <div className="pt-4 border-t border-slate-100 mt-2 shrink-0">
                <button
                  type="submit"
                  form="borrowForm"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 hover:scale-[1.01]"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Memverifikasi Pengajuan...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Kirim Pengajuan Peminjaman</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
