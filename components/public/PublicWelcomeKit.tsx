import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HeartHandshake, ShieldCheck, Phone, MapPin, Calendar, Trash2, 
  Car, Users, Sparkles, Download, Share2, CheckCircle2, ArrowRight, 
  HelpCircle, Home, Wrench, Droplets, Zap, ShieldAlert, BookOpen, 
  ExternalLink, Copy, Check, Info, FileText, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { RT_NAME, RW_NAME, RT_ADDRESS } from '../../constants';

export const PublicWelcomeKit: React.FC = () => {
  const navigate = useNavigate();
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPhone(text);
    toast.success(`${label} berhasil disalin ke papan klip!`);
    setTimeout(() => setCopiedPhone(null), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `Halo tetangga baru! Selamat datang di lingkungan RT 02 / RW 020 Huntap Tondo 2, Palu. Silakan akses Buku Panduan & Welcome Kit Warga Baru melalui tautan resmi ini: ${window.location.origin}/welcome`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    toast.info('Sedang menyiapkan Buku Saku Digital Warga Baru...', { duration: 2500 });
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Background accent
      doc.setFillColor(248, 250, 252);
      doc.rect(0, 0, 210, 297, 'F');

      // Header Banner
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(0, 0, 210, 42, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('BUKU SAKU DIGITAL WARGA BARU', 15, 18);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('RUKUN TETANGGA 02 / RW 020 - KELURAHAN TONDO, PALU', 15, 25);
      doc.text('Kawasan Hunian Tetap (Huntap) Tondo 2, Kota Palu, Sulawesi Tengah', 15, 32);

      // Section 1: Sambutan
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('1. Sambutan Pengurus Rukun Tetangga', 15, 52);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const welcomeText = 
        'Selamat datang di lingkungan RT 02 / RW 020! Kami mengusung semangat TEKNO-WARGA: ' +
        'Teknologi, Ekraf, Rukun, Aman, dan Sinergi. Panduan ini dirancang untuk memudahkan adaptasi Anda ' +
        'dan keluarga dalam berkehidupan bermasyarakat di lingkungan Huntap Tondo 2.';
      doc.text(doc.splitTextToSize(welcomeText, 180), 15, 58);

      // Section 2: 4 Langkah Cepat Warga Baru
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('2. Langkah Awal Wajib Bagi Warga & Penghuni Baru', 15, 78);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const steps = [
        'A. LAPOR DIRI: Mengisi data sensus digital via website https://teras-rt02.web.app/register.',
        'B. GABUNG GRUP WA: Menghubungi Ketua RT (+62 859-6119-4621) untuk masuk grup resmi pengumuman.',
        'C. DATA PENGHUNI KONTRAK: Bagi warga penyewa, laporkan identitas pemilik rumah dan nomor kontak aktif.',
        'D. SIMPAN KONTAK PENTING: Catat nomor darurat pos satpam, ambulans, serta ketua lingkungan.'
      ];
      let yOffset = 85;
      steps.forEach(step => {
        doc.text(doc.splitTextToSize(step, 180), 15, yOffset);
        yOffset += 7;
      });

      // Section 3: Tata Tertib Utama Lingkungan
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('3. Ringkasan Tata Tertib & Fasilitas Lingkungan', 15, 118);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const rules = [
        '• SAMPAH: Armada pengangkut sampah beroperasi berkala. Pilah sampah anorganik ke Bank Sampah RT.',
        '• PARKIR: Kendaraan tidak boleh menutup akses jalan warga atau akses darurat mobil pemadam kebakaran.',
        '• TAMU MENGINAP: Wajib melapor bila ada tamu menginap lebih dari 1x24 jam via portal atau pos satpam.',
        '• JAM MALANG & PORTAL: Portal lingkungan ditutup mulai pukul 23.00 WITA untuk menjaga ketertiban.',
        '• RENOVASI BANGUNAN: Wajib memberitahu tetangga sebelah dan tidak menaruh pasir/puing di selokan.',
        '• IURAN LINGKUNGAN: Iuran kas bulanan digunakan untuk kebersihan, keamanan, dan sosial gotong royong.'
      ];
      yOffset = 125;
      rules.forEach(rule => {
        doc.text(doc.splitTextToSize(rule, 180), 15, yOffset);
        yOffset += 7;
      });

      // Section 4: Kontak Esensial
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('4. Direktori Kontak Penting RT 02 / RW 020', 15, 175);

      doc.setFillColor(238, 242, 255);
      doc.roundedRect(15, 182, 180, 50, 3, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(67, 56, 202);
      doc.text('• Ketua RT 02: Bpk. Irfan Arianto (Blok C10-08) - WA: 0859-6119-4621', 20, 192);
      doc.text('• Layanan Darurat Pos Ronda / Satpam: Aktif 24 Jam di Pintu Masuk Blok', 20, 200);
      doc.text('• Bhabinkamtibmas Kelurahan Tondo / Polsek Mantikulore', 20, 208);
      doc.text('• Layanan Puskesmas Tondo / Ambulans Palu: 119 / 112', 20, 216);
      doc.text('• Gangguan Utilitas Listrik PLN (123) / Air Bersih PDAM Kota Palu', 20, 224);

      // Footer
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(`Dicetak secara otomatis melalui Sistem Informasi Digital TERAS RT 02 pada ${new Date().toLocaleDateString('id-ID')}`, 15, 280);
      doc.text('Alamat Sekretariat: ' + RT_ADDRESS, 15, 285);

      doc.save('Buku_Saku_Warga_Baru_RT02_Tondo2.pdf');
      toast.success('Buku Saku Digital PDF berhasil diunduh!');
    } catch (err) {
      console.error('Gagal membuat PDF buku saku:', err);
      toast.error('Gagal membuat berkas PDF. Silakan coba kembali.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-10 space-y-12 mb-28 font-sans"
    >
      {/* 1. Welcoming Hero Banner */}
      <motion.div
        variants={itemVariants}
        className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl md:rounded-[2.5rem] p-6 sm:p-10 md:p-14 shadow-xl shadow-slate-900/20 border border-indigo-800/40"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-indigo-500/20 via-sky-500/10 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-5">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-200 text-xs font-bold uppercase tracking-widest shadow-2xs">
            <HeartHandshake size={15} className="text-amber-400" />
            <span>Selamat Datang di Lingkungan Baru</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
              Buku Saku &amp; Panduan Adaptasi <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-emerald-300 bg-clip-text text-transparent">
                Warga Baru &amp; Penghuni Kontrak
              </span>
            </h1>
            <p className="text-slate-300 font-normal text-xs sm:text-sm md:text-base leading-relaxed max-w-3xl">
              Selamat bergabung menjadi bagian dari keluarga besar <strong>{RT_NAME} {RW_NAME}</strong>, Hunian Tetap (Huntap) Tondo 2, Palu. 
              Panduan interaktif ini disusun agar Anda dan keluarga merasa nyaman, aman, dan mudah beradaptasi dengan ritme kehidupan lingkungan kami.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/register')}
              className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Lapor Sensus Warga</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all active:scale-95"
            >
              <Download size={15} className="text-amber-400" />
              <span>{isGeneratingPdf ? 'Membuat PDF...' : 'Unduh Buku Saku PDF'}</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-3 bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-950/20"
            >
              <Share2 size={15} />
              <span>Bagikan ke WA</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Onboarding Steps: 4 Langkah Cepat Saat Pertama Tiba */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">Onboarding Checklist</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              4 Langkah Awal Saat Pertama Kali Pindah
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Pastikan menyelesaikan langkah ini dalam 1-3 hari pertama kedatangan Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs flex items-center justify-center border border-indigo-100">
                  01
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-lg border border-amber-200/60">
                  Wajib 1x24 Jam
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                Lapor Diri &amp; Sensus Hunian
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Daftarkan nomor rumah, data kepala keluarga, dan jumlah anggota keluarga agar resmi terdata dalam database kependudukan RT 02.
              </p>
            </div>
            <button
              onClick={() => navigate('/register')}
              className="w-full py-2.5 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200/60 group-hover:border-indigo-200"
            >
              <span>Isi Form Lapor Diri</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 font-black text-xs flex items-center justify-center border border-emerald-100">
                  02
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200/60">
                  Informasi Resmi
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                Masuk Grup WhatsApp RT
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Pemberitahuan darurat, edaran kelurahan, jadwal air, dan berita duka disampaikan melalui grup WhatsApp warga resmi RT 02.
              </p>
            </div>
            <a
              href="https://wa.me/6285961194621?text=Halo%20Pak%20RT%2002,%20saya%20warga%20baru%20di%20Blok%20...%20mohon%20izin%20bergabung%20ke%20grup%20WhatsApp%20warga."
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-emerald-200/60"
            >
              <span>Chat Pengurus untuk Masuk</span>
              <ExternalLink size={13} />
            </a>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 font-black text-xs flex items-center justify-center border border-sky-100">
                  03
                </span>
                <span className="px-2.5 py-1 bg-sky-50 text-sky-700 text-[10px] font-bold rounded-lg border border-sky-200/60">
                  Mitigasi &amp; Peta
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-sky-600 transition-colors">
                Kenali Peta &amp; Evakuasi
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Huntap Tondo 2 memiliki denah blok C5–C12, jalur evakuasi gempa, pos ronda, dan fasilitas umum yang wajib diketahui.
              </p>
            </div>
            <button
              onClick={() => navigate('/peta')}
              className="w-full py-2.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200/60 group-hover:border-sky-200"
            >
              <span>Buka Peta Wilayah</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 font-black text-xs flex items-center justify-center border border-purple-100">
                  04
                </span>
                <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-lg border border-purple-200/60">
                  Kenyamanan
                </span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base group-hover:text-purple-600 transition-colors">
                Sapa Tetangga Sekitar
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Berkenalan dengan tetangga sebelah kiri, kanan, dan depan rumah. Semangat guyub rukun adalah pilar utama keamanan lingkungan.
              </p>
            </div>
            <button
              onClick={() => navigate('/rules')}
              className="w-full py-2.5 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200/60 group-hover:border-purple-200"
            >
              <span>Lihat Tata Tertib RT</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* 3. Essential Living Guidelines: Pedoman Hidup Bertetangga */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div>
          <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">Panduan Praktis Harian</span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Aturan &amp; Kebiasaan Baik di Huntap Tondo 2
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: Sampah */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <Trash2 size={22} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">1. Pengelolaan Sampah</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Armada pengangkut sampah lingkungan beroperasi berkala. Warga diimbau menaruh sampah dalam kantong tertutup di depan rumah. Untuk kardus, botol plastik, dan minyak jelantah, dapat disetor ke <strong>Bank Sampah Digital RT 02</strong> untuk menambah saldo kas.
            </p>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-emerald-700">💡 Retribusi sampah dikelola resmi bersama TPS3R.</span>
            </div>
          </div>

          {/* Card 2: Parkir Kendaraan */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <Car size={22} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">2. Tertib Parkir Kendaraan</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Lebar jalan lingkungan Huntap terbatas. Pastikan mobil diparkir di dalam carport atau sejajar satu sisi jalan tanpa menghalangi garasi tetangga, tikungan blok, atau akses darurat mobil pemadam kebakaran.
            </p>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-amber-700">⚠️ Pasang stiker warga pada kendaraan untuk kemudahan satpam.</span>
            </div>
          </div>

          {/* Card 3: Tamu & Jam Malam */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ShieldAlert size={22} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">3. Tamu Menginap &amp; Portal</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tamu yang menginap lebih dari 1x24 jam wajib dilaporkan melalui menu <em>Layanan &gt; Lapor Tamu 24 Jam</em> di web ini atau lapor langsung ke pos satpam. Portal utama lingkungan ditutup mulai pukul <strong>23.00 WITA</strong>.
            </p>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-indigo-700">🔒 Petugas siskamling rutin berpatroli dengan scan QR.</span>
            </div>
          </div>

          {/* Card 4: Utilitas Air & Listrik */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100">
              <Droplets size={22} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">4. Utilitas Air PDAM &amp; Listrik</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Air bersih di Huntap Tondo 2 dialirkan oleh PDAM Kota Palu. Pantau pengumuman giliran air atau catat meter mandiri di portal. Bila ada pemadaman listrik/air mendadak, pengurus menyediakan modul <em>Pantau Utilitas Pemadaman</em> di Beranda.
            </p>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-sky-700">💧 Tampung cadangan air bersih secara bijak di tandon.</span>
            </div>
          </div>

          {/* Card 5: Renovasi Rumah */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <Wrench size={22} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">5. Aturan Renovasi Kavling</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sebelum memulai renovasi dapur, kanopi, atau pagar, mohon sampaikan pemberitahuan terlebih dahulu ke tetangga sebelah. Dilarang menumpuk material pasir atau puing yang menyumbat saluran air (drainase) lingkungan.
            </p>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-rose-700">📐 Pastikan talang air hujan tidak menetes ke kavling tetangga.</span>
            </div>
          </div>

          {/* Card 6: Iuran Kas & Gotong Royong */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <Users size={22} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">6. Iuran Kas &amp; Kegiatan Bersama</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Iuran kas bulanan sebesar Rp 20.000 digunakan sepenuhnya untuk dana operasional sosial, penerangan lampu jalan, santunan duka warga, dan kegiatan kerja bakti. Laporan kas terbuka transparan dan dapat dipantau di menu <em>Info Kas</em>.
            </p>
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-purple-700">✨ Transparansi 100% dapat dicek kapan saja secara online.</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 4. Essential Contacts Directory */}
      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600">Hubungi Kapan Saja</span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Kontak Penting &amp; Pelayanan Darurat
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-sm">
            Klik nomor kontak untuk langsung menghubungi via WhatsApp atau telepon.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Ketua RT */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Bpk. Irfan Arianto</p>
                <p className="text-[11px] font-semibold text-slate-500">Ketua RT 02 (Blok C10-08)</p>
                <p className="text-[11px] font-bold text-indigo-600 mt-0.5">+62 859-6119-4621</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopy('+6285961194621', 'Nomor Ketua RT')}
                className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
                title="Salin Nomor"
              >
                {copiedPhone === '+6285961194621' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
              <a
                href="https://wa.me/6285961194621"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60"
                title="Chat WhatsApp"
              >
                <Phone size={14} />
              </a>
            </div>
          </div>

          {/* Pos Ronda & Satpam */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Pos Keamanan / Siskamling</p>
                <p className="text-[11px] font-semibold text-slate-500">Pintu Masuk Utama Huntap</p>
                <p className="text-[11px] font-bold text-emerald-600 mt-0.5">Siaga Aktif 24 Jam</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/services?tab=tamu')}
              className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold border border-amber-200/60 hover:bg-amber-100 transition-all"
            >
              Lapor Pos
            </button>
          </div>

          {/* Bhabinkamtibmas */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Bhabinkamtibmas Tondo</p>
                <p className="text-[11px] font-semibold text-slate-500">Polsek Mantikulore</p>
                <p className="text-[11px] font-bold text-sky-600 mt-0.5">Layanan Polisi 110</p>
              </div>
            </div>
            <a
              href="tel:110"
              className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/60"
              title="Panggil Polisi"
            >
              <Phone size={14} />
            </a>
          </div>

          {/* Ambulans & Puskesmas */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <HeartHandshake size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Puskesmas Tondo / Medis</p>
                <p className="text-[11px] font-semibold text-slate-500">Ambulans Gawat Darurat</p>
                <p className="text-[11px] font-bold text-rose-600 mt-0.5">Call Center 119</p>
              </div>
            </div>
            <a
              href="tel:119"
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60"
              title="Panggil Ambulans"
            >
              <Phone size={14} />
            </a>
          </div>

          {/* Gangguan Listrik PLN */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-yellow-50 text-yellow-600 flex items-center justify-center font-bold">
                <Zap size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Layanan Gangguan PLN</p>
                <p className="text-[11px] font-semibold text-slate-500">Penerangan &amp; Trafo</p>
                <p className="text-[11px] font-bold text-yellow-600 mt-0.5">Telepon 123 / PLN Mobile</p>
              </div>
            </div>
            <a
              href="tel:123"
              className="p-2 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200/60"
              title="Hubungi PLN"
            >
              <Phone size={14} />
            </a>
          </div>

          {/* PDAM Air Palu */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                <Droplets size={20} />
              </div>
              <div>
                <p className="text-xs font-black text-slate-900">Layanan Air PDAM Palu</p>
                <p className="text-[11px] font-semibold text-slate-500">Pipa Induk &amp; Suplai Huntap</p>
                <p className="text-[11px] font-bold text-teal-600 mt-0.5">Pengaduan Air Bersih</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/info')}
              className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-xl text-xs font-bold border border-teal-200/60 hover:bg-teal-100 transition-all"
            >
              Cek Info Air
            </button>
          </div>
        </div>
      </motion.div>

      {/* 5. Bottom Callout Card */}
      <motion.div
        variants={itemVariants}
        className="bg-gradient-to-r from-indigo-50 via-white to-indigo-50 border border-indigo-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-black uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Portal Mandiri 24 Jam</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900">
            Butuh Surat Pengantar RT atau Mau Cek Agenda Kegiatan?
          </h3>
          <p className="text-xs text-slate-600 max-w-xl">
            Semua kebutuhan persuratan resmi, permohonan surat izin, laporan aduan, dan direktori UMKM tetangga dapat diakses secara digital melalui portal mandiri warga.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/services?tab=surat')}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-95"
          >
            <FileText size={15} />
            <span>Buat Surat Pengantar</span>
          </button>
          <button
            onClick={() => navigate('/info')}
            className="px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl text-xs uppercase tracking-wider border border-slate-200 shadow-2xs transition-all active:scale-95"
          >
            <span>Buka Kalender RT</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
