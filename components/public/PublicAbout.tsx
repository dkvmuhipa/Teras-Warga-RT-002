import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Home, 
  MapPin, 
  Heart, 
  Cpu, 
  Activity, 
  Award, 
  Phone, 
  ArrowLeft, 
  ChevronRight, 
  Smartphone, 
  Briefcase, 
  Star, 
  Flame, 
  CheckCircle2, 
  Calendar,
  Lock,
  Globe,
  Database,
  TrendingUp,
  ArrowUpRight,
  TrendingDown,
  ShoppingBag,
  Clock,
  Archive,
  FileText,
  HeartHandshake,
  AlertTriangle,
  Lightbulb,
  Map,
  BadgeAlert,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Official, House, UMKM, RondaSchedule, CashFlow, Report, LetterRequest, InventoryItem, AppEvent, DonationCampaign } from '../../types';

interface PublicAboutProps {
  officials?: Official[];
  houses?: House[];
  umkm?: UMKM[];
  ronda?: RondaSchedule[];
  cashFlow?: CashFlow[];
  reports?: Report[];
  letters?: LetterRequest[];
  inventory?: InventoryItem[];
  events?: AppEvent[];
  donationCampaigns?: DonationCampaign[];
}

export const PublicAbout: React.FC<PublicAboutProps> = ({ 
  officials = [], 
  houses = [], 
  umkm = [], 
  ronda = [], 
  cashFlow = [],
  reports = [],
  letters = [],
  inventory = [],
  events = [],
  donationCampaigns = []
}) => {
  const navigate = useNavigate();
  const [activeGeoTab, setActiveGeoTab] = useState<'hunian' | 'ekonomi' | 'kerentanan' | 'inventaris' | 'birokrasi'>('hunian');

  // Calculating Real Dynamic Statistics
  const totalKK = houses.length;
  const totalOccupants = houses.reduce((sum, h) => sum + (h.occupants || 0), 0);
  const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
  const emptyHouses = houses.filter(h => h.status === 'Empty').length;
  const businessHouses = houses.filter(h => h.status === 'Business').length;

  const totalUMKMCount = umkm.length;
  const totalRondaGroups = ronda.length;

  // Real Cash Flow Accounting
  const totalIncome = cashFlow
    .filter(c => c.type === 'Income')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
    
  const totalExpense = cashFlow
    .filter(c => c.type === 'Expense')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
    
  const currentBalance = totalIncome - totalExpense;

  // Real Demographic Metrics
  const praSejahteraCount = houses.filter(h => h.economicStatus === 'Pra-Sejahtera').length;
  const sejahteraCount = houses.filter(h => h.economicStatus === 'Sejahtera' || h.economicStatus === 'Mampu').length;
  const bansosCount = houses.filter(h => h.isPKH || h.isBLT || h.isBPNT).length;
  
  // Vulnerable groups
  const babyToddlerCount = houses.reduce((sum, h) => sum + (h.babyCount || 0) + (h.toddlerCount || 0), 0);
  const elderlyCount = houses.reduce((sum, h) => sum + (h.elderlyCount || 0), 0);
  const pregnantCount = houses.reduce((sum, h) => sum + (h.pregnantCount || 0), 0);

  // Bureaucracy & Reports Analytics
  const totalReports = reports.length;
  const resolvedReports = reports.filter(r => r.status === 'Selesai').length;
  const activeReports = reports.filter(r => r.status === 'Baru' || r.status === 'Diproses').length;
  const totalLetters = letters.length;
  const approvedLetters = letters.filter(l => l.status === 'Disetujui' || l.status === 'Approved').length;

  // Inventory Metrics
  const totalInventoryAssets = inventory.reduce((sum, item) => sum + (item.total || 0), 0);
  const availableInventoryAssets = inventory.reduce((sum, item) => sum + (item.available || 0), 0);
  const goodAssetsCount = inventory.filter(i => i.condition === 'Baik').length;

  // Dynamic Core Officials matching database data if available
  const matchOfficialByRole = (roleKeyword: string, fallbackName: string, fallbackPhrase: string, fallbackTasks: string[]) => {
    const matched = officials.find(o => o.role.toLowerCase().includes(roleKeyword.toLowerCase()));
    if (matched) {
      return {
        role: matched.role,
        name: matched.name,
        phrase: matched.duties && matched.duties.length > 0 
          ? `"${matched.duties[0]}"` 
          : `"${fallbackPhrase.replace(/"/g, '')}"`,
        tasks: matched.duties && matched.duties.length > 1 ? matched.duties : fallbackTasks,
        phone: matched.phone || ''
      };
    }
    return {
      role: roleKeyword === 'ketua' ? 'Ketua RT 02' : roleKeyword === 'sekretaris' ? 'Sekretaris RT' : 'Bendahara Swadaya',
      name: fallbackName,
      phrase: fallbackPhrase,
      tasks: fallbackTasks,
      phone: roleKeyword === 'ketua' ? '+62 822-9333-2802' : ''
    };
  };

  const dynamicKetua = matchOfficialByRole('ketua', 'Irfan', '"Memimpin dengan ketulusan hati, ketegasan prinsip, dan literasi teknologi menuju pemukiman yang mandiri."', [
    'Penanggung jawab utama seluruh urusan kemasyarakatan',
    'Pengambil kebijakan strategis & mediasi warga',
    'Sinergi program eksternal Kelurahan & Kota Palu'
  ]);

  const dynamicSekretaris = matchOfficialByRole('sekretaris', 'Faisal, S.Kom', '"Digitalisasi pelayanan surat-menyurat RT demi menghemat waktu dan tenaga seluruh warga Huntap."', [
    'Pengelolaan administrasi kependudukan & berkas digital',
    'Penyusunan arsip & administrasi persuratan resmi',
    'Notulensi musyawarah & pengumuman warga'
  ]);

  const dynamicBendahara = matchOfficialByRole('bendahara', 'Hj. Rosdiana', '"Setiap rupiah kas dikelola dengan amanah, tercatat transparan, dan dikembalikan untuk kemakmuran warga."', [
    'Pencatatan iuran wajib bulanan & laporan kas masuk-keluar',
    'Penyusunan anggaran kegiatan warga & bantuan sosial',
    'Publikasi keuangan berkala di papan informasi digital'
  ]);

  const coreStructure = [dynamicKetua, dynamicSekretaris, dynamicBendahara];

  const terasValues = [
    {
      letter: 'T',
      title: 'Teknologi',
      desc: 'Digitalisasi sistem layanan persuratan, arsip warga aman di cloud, panic button siskamling, monitoring seismik aktif, serta asisten warga ChatBot AI terintegrasi 24 jam.',
      color: 'from-blue-500 to-indigo-600',
      icon: <Cpu className="text-white" size={24} />,
      bgSoft: 'bg-blue-50 text-blue-700'
    },
    {
      letter: 'E',
      title: 'Ekonomi Kreatif',
      desc: 'Pemberdayaan potensi UMKM mandiri, bank sampah digital bernilai ekonomis, promosi pasar warga, serta pelatihan digital marketing guna menggalakkan kemandirian finansial keluarga.',
      color: 'from-emerald-500 to-teal-600',
      icon: <Briefcase className="text-white" size={24} />,
      bgSoft: 'bg-emerald-50 text-emerald-700'
    },
    {
      letter: 'R',
      title: 'Rukun',
      desc: 'Membina silaturahmi erat tanpa sekat, merangkul keberagaman latar belakang, mengedepankan gotong royong warga, musyawarah kekeluargaan, serta transparansi kas swadaya.',
      color: 'from-amber-500 to-orange-600',
      icon: <Users className="text-white" size={24} />,
      bgSoft: 'bg-amber-50 text-amber-700'
    },
    {
      letter: 'A',
      title: 'Aman',
      desc: 'Kewaspadaan lingkungan prima dengan jadwal ronda malam terstruktur, tombol alarm darurat gawat darurat, mitigasi aktif risiko gempa bumi, serta pengawasan kepekaan sosial.',
      color: 'from-rose-500 to-red-600',
      icon: <Shield className="text-white" size={24} />,
      bgSoft: 'bg-rose-50 text-rose-700'
    },
    {
      letter: 'S',
      title: 'Sinergi',
      desc: 'Membangun jembatan sinergitas kolaboratif antara warga, pengurus RT, institusi Kelurahan Tondo, pihak kepolisian (Bhabinkamtibmas), puskesmas, serta stakeholder terkait.',
      color: 'from-purple-500 to-indigo-600',
      icon: <Activity className="text-white" size={24} />,
      bgSoft: 'bg-purple-50 text-purple-700'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24">
      {/* Upper Navigation Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-extrabold text-xs tracking-wider uppercase cursor-pointer transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            KEMBALI KE BERANDA
          </button>
          <span className="text-xs font-black text-rose-600 bg-rose-50/80 px-3.5 py-1.5 rounded-full uppercase tracking-widest font-mono">
            PROFIL TERINTEGRASI BERSAMA (RT 02)
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* HERO HEADER */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex p-4 bg-rose-50 text-rose-600 rounded-3xl mb-4 shadow-sm border border-rose-100/60">
            <Heart size={36} className="animate-pulse" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight uppercase">
            Tentang Kami &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-indigo-600 font-serif italic">TERAS RT 02</span>
          </h1>
          <p className="text-sm sm:text-base font-semibold text-slate-500 mt-3 max-w-2xl mx-auto leading-relaxed">
            Menyajikan transparansi rekapitulasi data kependudukan riil, komitmen kepengurusan, etalase swadaya ekonomi, hingga asuransi keselamatan warga Huntap Tondo 2 secara real-time.
          </p>
          <div className="h-1.5 w-32 bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500 mx-auto mt-6 rounded-full shadow-sm" />
        </motion.div>

        {/* INTEGRATED CORE STATS TICKER */}
        <section className="mb-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-350 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Warga Huni</span>
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Home size={18} />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-indigo-950 font-mono tracking-tight">{totalKK}</p>
                <p className="text-xs font-black text-slate-800 mt-2 uppercase tracking-wide">Profil Kelompok KK</p>
              </div>
              <p className="text-[10px] text-indigo-600 font-extrabold mt-3 border-t border-slate-100 pt-2 font-mono">
                {totalOccupants} Warga Jiwa Terdaftar
              </p>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-350 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Potensi UMKM</span>
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <ShoppingBag size={18} />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-emerald-950 font-mono tracking-tight">{totalUMKMCount}</p>
                <p className="text-xs font-black text-slate-800 mt-2 uppercase tracking-wide">Mitra Niaga Aktif</p>
              </div>
              <p className="text-[10px] text-emerald-600 font-extrabold mt-3 border-t border-slate-100 pt-2 font-mono">
                Pilar Sektor Kemandirian Finansial
              </p>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-350 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aset Bersama</span>
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
                    <Archive size={18} />
                  </div>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-rose-950 font-mono tracking-tight">{totalInventoryAssets}</p>
                <p className="text-xs font-black text-slate-800 mt-2 uppercase tracking-wide">Peralatan RT / Inventaris</p>
              </div>
              <p className="text-[10px] text-rose-600 font-extrabold mt-3 border-t border-slate-100 pt-2 font-mono">
                {availableInventoryAssets} Aset Siap Pinjam/Gunakan
              </p>
            </motion.div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:border-slate-350 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kas Swadaya RT</span>
                  <div className="p-2.5 bg-amber-50 text-amber-655 text-amber-600 rounded-xl">
                    <Database size={18} />
                  </div>
                </div>
                <p className="text-lg sm:text-2xl font-black text-amber-950 font-mono tracking-tight text-ellipsis overflow-hidden whitespace-nowrap">
                  {currentBalance.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs font-black text-slate-800 mt-2.5 uppercase tracking-wide">Saldo Kas Bersih</p>
              </div>
              <p className="text-[10px] text-amber-650 text-amber-700 font-extrabold mt-3 border-t border-slate-100 pt-2 font-mono">
                Hasil Dari Iuran &amp; Donasi Warga
              </p>
            </motion.div>
          </div>
        </section>

        {/* PLATFORM OVERVIEW SECTION */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 bg-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-200/80 shadow-xl shadow-slate-100/40 relative overflow-hidden"
        >
          {/* Subtle decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/40 rounded-full blur-3xl -mr-20 -mt-20 -z-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-rose-50/30 rounded-full blur-3xl -ml-20 -mb-20 -z-10" />

          <div className="max-w-4xl mx-auto text-center mb-10">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 bg-indigo-50 px-3.5 py-1.5 rounded-full font-mono">
              SISTEM INFORMASI TERPADU &amp; DIGITALISASI WARGA
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mt-4 leading-tight">
              Mengenal Portal <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-indigo-600 font-serif italic">TERAS RT 02 Huntap Tondo 2</span> Lebih Dekat
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-3 max-w-2xl mx-auto leading-relaxed">
              Sebuah gagasan inovatif kemitraan warga yang melampaui sekadar sarana hunian biasa. Portal ini dirancang khusus untuk menyatukan seluruh elemen kehidupan kemasyarakatan di kawasan Hunian Tetap Tondo 2, Palu, Sulawesi Tengah.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Visual description column */}
            <div className="space-y-6">
              <h3 className="text-lg sm:text-xl font-black text-slate-800 flex items-center gap-2.5">
                <HeartHandshake className="text-rose-500 animate-pulse" size={22} />
                Solusi Kolaboratif dari &amp; Untuk Warga
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed text-justify">
                TERAS RT 02 Huntap Tondo 2 lahir dari kesadaran bersama akan pentingnya integrasi pasca-bencana. Sebagai pemukiman yang dibangun untuk penyintas bencana dahsyat 2018 di Kota Palu, kami memerlukan jembatan komunikasi modern yang tidak dibatasi oleh sekat-sekat fisik atau misinformasi konvensional. 
              </p>
              <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed text-justify">
                Platform ini merayakan nilai gotong-royong dengan cara menyatukan pangkalan data kependudukan fungsional, kemudahan pelayanan surat digital satu pintu, pemantauan saldo iuran kas RT riil-time, serta promosi swadaya UMKM lokal yang terus berputar aktif. Kami meyakini, melalui digitalisasi terstruktur yang akuntabel dan berorientasi sosial, ketahanan wilayah kita akan tumbuh harmonis, bersolidaritas penuh, kokoh menghadapi mara bahaya, serta mandiri secara finansial.
              </p>
              <div className="border-l-4 border-rose-500 pl-4 py-1.5 italic text-xs font-bold text-slate-500 leading-normal">
                "Kami tidak sekadar berupaya membangun tempat tinggal fisik, melainkan menganyam peradaban masa depan yang memberdayakan kebersamaan warga secara setara, tangkas, transparan, dan siaga kebencanaan."
              </div>
            </div>

            {/* Structured feature bento cards column */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-colors">
                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                  <Smartphone size={16} />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Aksesibilitas Satu Sentuhan</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1 text-justify">
                  Warga dapat mengajukan layanan administrasi pengantar secara kilat, memeriksa status bantuan sosial, dan memonitor data kependudukan langsung dari smartphone.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-colors">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                  <TrendingUp size={16} />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Ekonomi Sirkular UMKM</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1 text-justify">
                  Mendukung tumbuh kembang warung warga, kuliner rumahan, jasa swadaya, maupun bank sampah terpadu guna mempercepat arus finansial kas keluarga.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-rose-200 transition-colors">
                <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                  <Shield size={16} />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Mitigasi &amp; Lingkungan Aman</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1 text-justify">
                  Pos siskamling modern berpeta digital rute, sistem proteksi siaga gempa bumi lintasan sesar Palu-Koro, serta deteksi siaga jaminan prioritas golongan rentan.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-amber-200 transition-colors">
                <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                  <Database size={16} />
                </div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Transparansi Finansial Rill</h4>
                <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1 text-justify">
                  Laporan pembukuan donasi, iuran kematian, pembagian kas darurat sosial, hingga pemeliharaan perlengkapan sarana diumumkan terbuka bebas manipulasi.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* TWO COLUMN GRID: HISTORY STORY & DETAILED DEMOGRAPHIC ENGINE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* SEJARAH DETAILED TEXT */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm lg:col-span-2 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-rose-600 mb-2 block font-mono">LATAR BELAKANG &amp; KELAHIRAN KEMBALI</span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-rose-600" />
                Dari Titik Kebangkitan <span className="font-serif italic text-indigo-600">Menuju Kemandirian Cerdas</span>
              </h2>
              <div className="space-y-4 text-xs sm:text-sm font-semibold text-slate-600 leading-relaxed text-justify">
                <p>
                  Lingkungan <strong>Hunian Tetap (Huntap) Tondo 2</strong> berdiri megah sebagai simbol ketangguhan (resiliensi) dan anugerah bagi segenap keluarga yang terdampak bencana tsunami dahsyat, gempa tektonik merusak, dan fenomena likuefaksi pada <strong>28 September 2018</strong> silam di wilayah Palu, Donggala, Sigi, dan sekitarnya. Ribuan warga bertahan menguatkan fondasi asa, bermigrasi menuju kompleks pemukiman aman yang dibangun melalui sinergi kementerian RI bersama lembaga kemanusiaan mancanegara.
                </p>
                <p>
                  <strong>Rukun Tetangga (RT) 02</strong> dibentuk sebagai wadah administratif yang berfokus membentuk kearifan bermasyarakat yang rukun, aman, dan inovatif. Secara administratif terletak di Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu, kami meyakini bahwa sekadar berpindah ke tempat tinggal huni yang kokoh saja tidaklah cukup. Kami membutuhkan integrasi erat antarwarga, pemahaman mitigasi risiko bencana, serta tata perekonomian lokal yang terus tumbuh.
                </p>
                <p>
                  Untuk mewujudkannya, pengurus mencetuskan blueprint **TERAS RT 02**. Prinsip ini adalah komitmen harian dalam memberikan pelayanan optimal kependudukan digital, menjaga stabilitas lingkungan malam, transparansi kas swadaya mutlak, dan mempererat silaturahmi tanpa membedakan status sosial.
                </p>
              </div>
            </div>
            
            <div className="bg-rose-50/60 rounded-2xl p-4 border border-rose-100/70 flex items-center gap-3 mt-6">
              <Award size={20} className="text-rose-500 flex-shrink-0" />
              <p className="text-[11px] font-extrabold text-slate-700">
                Peringkat Utama <strong>Rukun Tetangga Tanggap &amp; Cerdas Bencana Tingkat Kelurahan Tondo</strong>, Sulawesi Tengah.
              </p>
            </div>
          </motion.div>

          {/* DYNAMIC DATABASE INTEGRATED PROFILING TABS */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-650 text-indigo-600 mb-2 block font-mono">DASHBOARD INTEGRASI DATABASE FIRESTORE</span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mb-1">Struktur Sosial &amp; <span className="font-serif italic text-indigo-605 text-indigo-600">Fisik</span></h2>
              <p className="text-[11px] text-slate-400 font-medium mb-4">Statistik komposisi real-time yang tersinkronisasi dari pangkalan data digital RT.</p>

              {/* Tabs Navigation */}
              <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-0.5 mb-5 text-xs font-black">
                <button 
                  onClick={() => setActiveGeoTab('hunian')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center cursor-pointer uppercase transition-all text-[10px] tracking-wide ${activeGeoTab === 'hunian' ? 'bg-indigo-600 text-white shadow' : 'text-slate-650 text-slate-600 hover:text-slate-900'}`}
                >
                  Hunian
                </button>
                <button 
                  onClick={() => setActiveGeoTab('ekonomi')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center cursor-pointer uppercase transition-all text-[10px] tracking-wide ${activeGeoTab === 'ekonomi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-650 text-slate-600 hover:text-slate-900'}`}
                >
                  Ekonomi
                </button>
                <button 
                  onClick={() => setActiveGeoTab('kerentanan')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center cursor-pointer uppercase transition-all text-[10px] tracking-wide ${activeGeoTab === 'kerentanan' ? 'bg-indigo-600 text-white shadow' : 'text-slate-650 text-slate-600 hover:text-slate-900'}`}
                >
                  Rentan
                </button>
                <button 
                  onClick={() => setActiveGeoTab('birokrasi')}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-center cursor-pointer uppercase transition-all text-[10px] tracking-wide ${activeGeoTab === 'birokrasi' ? 'bg-indigo-600 text-white shadow' : 'text-slate-650 text-slate-600 hover:text-slate-900'}`}
                >
                  Layanan
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="space-y-4">
                {activeGeoTab === 'hunian' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-semibold text-slate-650 text-slate-600">Unit Rumah Berpenghuni</span>
                      <span className="text-xs font-black text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded-lg">{occupiedHouses} Rumah</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-semibold text-slate-650 text-slate-600">Rumah Pembuka Usaha</span>
                      <span className="text-xs font-black text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-lg">{businessHouses} Unit</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-semibold text-slate-650 text-slate-600">Unit Kosong / Cadangan</span>
                      <span className="text-xs font-black text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded-lg">{emptyHouses} Unit</span>
                    </div>
                    <div className="flex items-center justify-between pb-1 text-xs">
                      <span className="font-semibold text-slate-600">Rasio Pemanfaatan Lahan</span>
                      <span className="font-black text-slate-900 font-mono">
                        {totalKK > 0 ? Math.round((occupiedHouses / totalKK) * 100) : 0}% Terhuni
                      </span>
                    </div>
                  </div>
                )}

                 {activeGeoTab === 'ekonomi' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                       <span className="text-xs font-semibold text-slate-600">Kategori Pra-Sejahtera</span>
                       <span className="text-xs font-black text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded-lg">{praSejahteraCount} KK</span>
                     </div>
                     <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                       <span className="text-xs font-semibold text-slate-600">Kategori Sejahtera &amp; Mampu</span>
                       <span className="text-xs font-black text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded-lg">{sejahteraCount} KK</span>
                     </div>
                     <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                       <span className="text-xs font-semibold text-slate-600">Penerima Manfaat Bansos RT</span>
                       <span className="text-xs font-black text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-lg">{bansosCount} KK</span>
                     </div>
                     <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                       *Kelayakan bansos PKH/BLT dipetakan langsung ke database demi menjamin keseimbangan keadilan distributif.
                     </p>
                   </div>
                 )}
 
                 {activeGeoTab === 'kerentanan' && (
                   <div className="space-y-3">
                     <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                       <span className="text-xs font-semibold text-slate-600">Balita &amp; Bayi Usia Dini</span>
                       <span className="text-xs font-black text-pink-700 font-mono bg-pink-50 px-2 py-0.5 rounded-lg">{babyToddlerCount} Anak</span>
                     </div>
                     <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                       <span className="text-xs font-semibold text-slate-600">Lanjut Usia (Lansia)</span>
                       <span className="text-xs font-black text-amber-700 font-mono bg-amber-50 px-2 py-0.5 rounded-lg">{elderlyCount} Jiwa</span>
                     </div>
                     <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                       <span className="text-xs font-semibold text-slate-600">Ibu Hamil &amp; Menyusui</span>
                       <span className="text-xs font-black text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded-lg">{pregnantCount} Jiwa</span>
                     </div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">
                      *Kelompok rentan di atas didaftarkan dalam prioritas evakuasi jalur khusus mitigasi bahaya sesar Palu-Koro.
                    </p>
                  </div>
                )}

                {activeGeoTab === 'birokrasi' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-semibold text-slate-650 text-slate-600">Total Pengaduan Warga</span>
                      <span className="text-xs font-black text-slate-800 font-mono bg-slate-100 px-2 py-0.5 rounded-lg">{totalReports} Laporan</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-semibold text-slate-650 text-slate-600">Laporan Selesai Ditangani</span>
                      <span className="text-xs font-black text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded-lg">{resolvedReports} Kasus</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-semibold text-slate-650 text-slate-600">Kasus Masih Ditinjau</span>
                      <span className="text-xs font-black text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded-lg">{activeReports} Laporan</span>
                    </div>
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-xs font-semibold text-slate-650 text-slate-600">Pengajuan Surat Disetujui</span>
                      <span className="text-xs font-black text-indigo-700 font-mono bg-indigo-50 px-2 py-0.5 rounded-lg">{approvedLetters} dari {totalLetters} Berkas</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
              <Database size={14} className="text-indigo-600 flex-shrink-0" />
              <span className="text-[10px] font-black text-slate-450 text-slate-400 tracking-wider font-mono">
                PULSE DATA AKTIF SECARA REAL TIME
              </span>
            </div>
          </motion.div>
        </div>



        {/* FINANCIAL TRANSPARENCY: MINI CASHFLOW & TRANS DETAILED REKAP */}
        {cashFlow.length > 0 && (
          <section className="mb-16">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-amber-600 mb-1 block font-mono">TRANSPARANSI KEUANGAN MUTLAK</span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Laporan Kas &amp; <span className="font-serif italic text-amber-600">Aliran Dana Swadaya</span></h2>
                  <p className="text-xs text-slate-500 font-semibold">Memastikan setiap rupiah tercatat akurat, berimbang, dan dapat ditinjau oleh seluruh warga secara terbuka.</p>
                </div>
                <button 
                  onClick={() => navigate('/info')}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow cursor-pointer active:scale-95 flex items-center gap-2"
                >
                  <Database size={14} />
                  Detail Laporan Kas RT
                </button>
              </div>

              {/* Grid with transaction list */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/60 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-black text-emerald-500 tracking-wider font-mono">Total Akumulasi Pemasukan</p>
                      <p className="text-lg font-black font-mono text-emerald-800 mt-0.5">
                        +{totalIncome.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-sm">
                      <TrendingUp size={20} />
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100/60 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-black text-rose-500 tracking-wider font-mono">Total Akumulasi Pengeluaran</p>
                      <p className="text-lg font-black font-mono text-rose-800 mt-0.5">
                        -{totalExpense.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-sm">
                      <TrendingDown size={20} />
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                    <Info size={16} className="text-indigo-600 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-slate-500 leading-normal">
                      Kas dipergunakan untuk operasional kebersihan swadaya, sarana air bersih, lampu jalan, takziah duka warga, hingga pemeliharaan pos ronda RT.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-3 font-mono">REKAPITULASI TRANSAKSI TERBARU DARI DATABASE</p>
                  <div className="space-y-2.5">
                    {cashFlow.slice(-4).reverse().map((flow, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-3.5">
                          <span className={`h-3 w-3 rounded-full flex-shrink-0 shadow-sm ${flow.type === 'Income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <div>
                            <p className="text-slate-900 font-extrabold line-clamp-1">{flow.description}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{flow.date} • Kategori: {flow.category} • Pencatat: {flow.referenceNumber || 'Pengurus Swadaya'}</p>
                          </div>
                        </div>
                        <span className={`font-mono font-black text-sm whitespace-nowrap pl-4 ${flow.type === 'Income' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {flow.type === 'Income' ? '+' : '-'} Rp {flow.amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                    {cashFlow.length === 0 && (
                      <p className="text-center text-xs text-slate-400 py-6 uppercase font-black">Belum ada transaksi terekam.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* INTEGRATED UMKM SECTOR SHOWCASE */}
        {totalUMKMCount > 0 && (
          <section className="mb-16">
            <div className="mb-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 mb-1 block font-mono">PEMBERDAYAAN EKONOMI KREATIF (UMKM)</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Pasar Kreatif <span className="font-serif italic text-emerald-600">RT 02</span></h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">Etalase digital unit usaha milik warga Huntap Tondo 2 yang diverifikasi dan aktif.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {umkm.slice(0, 4).map((shop, sidx) => (
                <div key={sidx} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all">
                  <div className="relative">
                    {shop.image ? (
                      <img 
                        src={shop.image} 
                        alt={shop.name}
                        referrerPolicy="no-referrer"
                        className="h-36 w-full object-cover" 
                      />
                    ) : (
                      <div className="h-36 bg-slate-100 flex items-center justify-center text-slate-400 font-extrabold uppercase text-xs font-mono border-b border-slate-100">
                        WARUNG WARGA 02
                      </div>
                    )}
                    <span className="absolute top-3 right-3 bg-emerald-550 bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-lg tracking-wider font-mono shadow-sm">
                      {shop.category}
                    </span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-905 text-slate-950 tracking-tight leading-snug line-clamp-1 mb-1">{shop.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4 font-semibold">{shop.description}</p>
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-bold font-mono">
                      <span>OWNER: {shop.owner}</span>
                      {shop.contact && <span className="text-emerald-600 font-extrabold">{shop.contact}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button 
                onClick={() => navigate('/market')}
                className="inline-flex items-center gap-2 text-xs font-extrabold text-emerald-600 hover:text-emerald-800 transition-colors uppercase tracking-wider cursor-pointer"
              >
                MASUK PASAR UMKM DIGITAL WARGA ({totalUMKMCount} Unit Terdaftar)
                <ArrowUpRight size={16} />
              </button>
            </div>
          </section>
        )}

        {/* STRUKTUR ORGANISASI KELUARGA BESAR */}
        <section className="mb-16">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-600 mb-1 block font-mono">STRUKTUR KEBERSAMAAN</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Amanah Kepengurusan <span className="font-serif italic text-emerald-600">RT 02</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold font-serif">Aparatur pengurus pilihan warga yang senantiasa mengutamakan transparansi dan pelayanan santun.</p>
            </div>
            
            {officials.length > 0 && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-xl font-black uppercase font-mono tracking-widest shadow-sm">
                {officials.length} Petugas Terdaftar
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreStructure.map((member, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:scale-[1.01] transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider font-mono">
                      {member.role}
                    </span>
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  
                  <h3 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight mb-2">
                    {member.name}
                  </h3>
                  
                  <p className="text-xs italic text-slate-500 leading-relaxed font-semibold mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                    {member.phrase}
                  </p>
                  
                  <div className="space-y-2.5 mb-6">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1.5 font-mono">PANDUAN TUGAS UTAMA</p>
                    {member.tasks.map((task, tidx) => (
                      <div key={tidx} className="flex items-start gap-2">
                        <CheckCircle2 size={13} className="text-emerald-500 mt-1 flex-shrink-0" />
                        <span className="text-xs text-slate-655 text-slate-600 font-semibold leading-normal">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {member.phone && (
                  <div className="border-t border-slate-100 pt-4 mt-2">
                    <p className="text-[10px] text-slate-450 text-slate-400 font-black uppercase tracking-wider font-mono">TELEPON RESPONS</p>
                    <p className="text-xs font-mono font-black text-slate-750 text-slate-705 text-slate-700 mt-1">{member.phone}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* ADDITIONAL FIRESTORE OFFICIALS EXPANSION */}
          {officials.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200/80">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest mb-6 flex items-center gap-2 font-mono">
                <Users size={18} className="text-indigo-650 text-indigo-600" />
                STAF BIDANG PEMBANTU LAINNYA (DIVERIFIKASI DATABASE)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {officials
                  .filter(o => !['Ketua RT', 'Sekretaris', 'Bendahara'].some(title => o.role.toLowerCase().includes(title.toLowerCase())))
                  .map((off, oidx) => (
                    <div key={oidx} className="flex items-center gap-3.5 p-4 bg-white rounded-2xl border border-slate-105 border-slate-200/60 shadow-sm hover:border-slate-350 transition-all">
                      {off.photo ? (
                        <img 
                          src={off.photo} 
                          alt={off.name} 
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-full object-cover border border-slate-200" 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase border border-indigo-100">
                          {off.name.substring(0,2)}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-black text-slate-950 leading-none">{off.name}</p>
                        <p className="text-[10px] text-indigo-605 text-indigo-600 font-black uppercase tracking-wider mt-1.5">{off.role}</p>
                        {off.phone && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{off.phone}</p>}
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* DONASI SOSIAL & KEGIATAN AKTIF IN ACTION */}
        {donationCampaigns.length > 0 && (
          <section className="mb-16">
            <div className="mb-6">
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 mb-1 block font-mono">MEMBANGUN SOLIDARITAS SOSIAL</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Aksi Solidaritas &amp; <span className="font-serif italic text-indigo-605 text-indigo-600">Donasi Swadaya</span></h2>
              <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-0.5">Program sosial kemanusiaan, takziah musibah, dan pembangunan fasilitas yang sedang berjalan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donationCampaigns.slice(0, 3).map((camp, cidx) => {
                const target = camp.targetAmount || 0;
                const percent = target > 0 ? Math.min(100, Math.round((camp.currentAmount / target) * 100)) : 0;
                return (
                  <div key={cidx} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] bg-indigo-55 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-lg font-black tracking-wider uppercase font-mono">
                          {camp.type}
                        </span>
                        <span className={`h-2 w-2 rounded-full ${camp.status === 'Aktif' ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
                      </div>

                      <h3 className="text-sm font-black text-slate-950 hover:text-indigo-650 transition-colors mb-1 line-clamp-1">{camp.title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold mb-4 line-clamp-2">{camp.description}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-4 space-y-2">
                      <div className="flex justify-between text-[10px] font-bold font-mono">
                        <span className="text-slate-400">TERKUMPUL</span>
                        <span className="text-slate-900">
                          {percent}% ({camp.currentAmount.toLocaleString('id-ID')} / {target > 0 ? target.toLocaleString('id-ID') : '∞'})
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 text-center">
              <button 
                onClick={() => navigate('/donasi')}
                className="inline-flex items-center gap-2 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Akses Portal Donasi Selengkapnya ({donationCampaigns.length} Kampanye)
                <ArrowUpRight size={16} />
              </button>
            </div>
          </section>
        )}

        {/* DETAIL APLIKASI TERAS RT 02 (THE APP EXPLANATION & WALKTHROUGH) */}
        <section className="mb-16">
          <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
            {/* Ambient Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-400 mb-2 block font-mono">DOKUMENTASI SISTEM &amp; PENJELASAN INTEGRASI</span>
              <h2 className="text-2xl sm:text-4xl font-black text-white hover:text-indigo-200 transition-colors tracking-tight">
                Mengenal Platform Digital <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300 font-serif italic animate-pulse">TERAS RT 02</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-semibold mt-2 max-w-3xl leading-relaxed mb-8">
                TERAS RT 02 (Sistem Informasi &amp; Transparansi Huntap Tondo 2) adalah platform cerdas satu-pintu (one-stop digital portal) yang menggabungkan basis data rukun tetangga, birokrasi persuratan mandiri, pelaporan insiden darurat, monitoring kebencanaan aktif, dan asisten kependudukan berbasis AI guna melayani warga secara responsif, amanah, dan terintegrasi 24 jam.
              </p>

              {/* Core System Capabilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Module 1: Surat & Birokrasi */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-indigo-500/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-4">
                      <FileText size={20} />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">1. Administrasi Surat</h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed text-justify">
                      Sistem layanan pengajuan surat pengantar domisili, surat keterangan tidak mampu (SKTM), dsb., secara digital mandiri. Warga dapat memonitor proses persetujuan (approval) admin secara transparan, mempercepat birokrasi, dan menghemat dokumen kertas (paperless).
                    </p>
                  </div>
                  <div className="text-[10px] text-indigo-400 font-bold font-mono mt-4 border-t border-white/5 pt-2">
                    ✓ STATUS PELACAKAN SEKETIKA
                  </div>
                </div>

                {/* Module 2: Inventaris RT */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4">
                      <Archive size={20} />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">2. Inventaris Bersama</h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed text-justify">
                      Semua aset fisik RT seperti tenda darurat, kursi lipat, gerobak, sound system, hingga peralatan gotong royong terdata detail dari segi jumlah total, sisa ketersediaan, hingga kondisi fisik ("Baik" / "Rusak"). Membantu warga melakukan booking pinjam alat secara tertib.
                    </p>
                  </div>
                  <div className="text-[10px] text-emerald-400 font-bold font-mono mt-4 border-t border-white/5 pt-2">
                    ✓ MINIMALISIR KONFLIK PINJAMAN
                  </div>
                </div>

                {/* Module 3: Lapor & Pengaduan */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-rose-500/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl w-fit mb-4">
                      <AlertTriangle size={20} />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">3. Aduan &amp; Investigasi</h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed text-justify">
                      Warga dapat melayangkan laporan masalah lingkungan seperti jalan rusak, tumpukan sampah, sengketa, hingga lampu jalan padam langsung dari HP. Dilengkapi tingkat urgensi (Rendah/Sedang/Gawat) dan status pengawasan (Diproses, Diselidiki, Selesai).
                    </p>
                  </div>
                  <div className="text-[10px] text-rose-400 font-bold font-mono mt-4 border-t border-white/5 pt-2">
                    ✓ OPERASIONAL CEPAT TANGGAP
                  </div>
                </div>

                {/* Module 4: ChatBot AI & Asisten */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-500/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-4">
                      <Lightbulb size={20} />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">4. Smart ChatBot AI</h3>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed text-justify">
                      Asisten virtual yang ditenagai oleh kecerdasan buatan Gemini API. Siap memberikan respons instan 24/7 kepada warga mengenai sisa kas RT, nama-nama pengurus, jadwal ronda malam ini, draf pengumuman kegiatan, hingga rujukan langkah mitigasi pertama saat gempa.
                    </p>
                  </div>
                  <div className="text-[10px] text-amber-400 font-bold font-mono mt-4 border-t border-white/5 pt-2">
                    ✓ LAYANAN ASSISTANT 24 JAM
                  </div>
                </div>

              </div>

              {/* Sub-section: Interaktivitas Data Map & Kebencanaan */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                
                {/* Left Card: Database Mapping & Bansos */}
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-4 items-start hover:border-indigo-500/30 transition-all">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl flex-shrink-0">
                    <Map size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Pemetaan Sosial &amp; Akurasi Bansos</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed text-justify">
                      Kami merancang visualisasi peta hunian per blok wilayah RT 02 secara akurat. Sistem ini bukan hanya mencatat siapa penghuni rumah, namun menganalisis tingkat ekonomi (Pra-Sejahtera, Sejahtera, Mampu) warga secara objektif. Ini sangat krusial dalam mengambil keputusan penyaluran bantuan sosial (Bansos PKH, BLT, BPNT) agar tepat sasaran tanpa adanya kecemburuan sosial.
                    </p>
                  </div>
                </div>

                {/* Right Card: Safeguard & Panic Button */}
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col sm:flex-row gap-4 items-start hover:border-rose-500/30 transition-all">
                  <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl flex-shrink-0">
                    <Smartphone size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">Panic Button &amp; Mitigasi Sesar Swadaya</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed text-justify">
                      Menyadari letak geografis Huntap Tondo II yang berimpitan di atas patahan sesar aktif Palu-Koro, aplikasi ini dilengkapi fitur Panic Button instan. Ketika ditekan oleh warga dalam bahaya (gempa bumi, kebakaran, aksi pencurian, darurat medis), alarm bersuara kencang akan bersinkronisasi langsung ke dashboard petugas ronda dan memicu pengamanan terpadu seketika.
                    </p>
                  </div>
                </div>

              </div>
              
              <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-[10px] font-bold text-slate-400 tracking-widest font-mono uppercase">
                  ✓ DIKEMBANGKAN MANDIRI OLEH WARGA, UNTUK WARGA RT 02 HUNTAP TONDO II
                </span>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => navigate('/rules')}
                    className="px-4 py-2 bg-white/5 text-slate-300 hover:bg-white/10 rounded-xl text-xs font-black uppercase transition-all tracking-wider border border-white/10 whitespace-nowrap"
                  >
                    Aturan &amp; Tata Tertib RT
                  </button>
                  <button 
                    onClick={() => navigate('/services')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase transition-all tracking-wider whitespace-nowrap shadow-md active:scale-95"
                  >
                    Akses Menu Layanan
                  </button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* PENJELASAN MENDALAM: TANTANGAN RIIL YANG KAMI SELESAIKAN */}
        <section className="mb-16">
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 mb-2 block font-mono">LATAR BELAKANG &AMP; URGENSI SOLUSI</span>
            <h3 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight mb-8 leading-tight">
              Tantangan Riil Kemasyarakatan yang <span className="font-serif italic text-indigo-600">Kami Selesaikan</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">1. Birokrasi Fisik yang Lamban &amp; Berbelit</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1 text-justify">
                    Secara konvensional, warga Huntap yang membutuhkan surat pengantar RT harus mencari keberadaan ketua RT secara fisik ke rumahnya, menulis draf manual, dan menunggu berhari-hari karena ketidakcocokan waktu luang. TERAS RT 02 meremajakan birokrasi ini menjadi serba digital: ajukan lewat HP, disetujui dalam hitungan menit, tanpa kertas.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-100">
                  <Database size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">2. Krisis Kepercayaan &amp; Ketidakjelasan Kas Swadaya</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1 text-justify">
                    Kecurigaan penyalahgunaan keuangan rukun tetangga sering kali memicu keretakan rukun bertetangga. Dengan modul Transparansi Kas Terpadu, setiap uang masuk dari iuran warga dan pemakaian untuk kepentingan umum (seperti perbaikan gorong-gorong atau sumbangan kedukaan) terarsip akurat di database cloud dan dapat dipantau oleh siapa saja kapan saja.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                  <Map size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">3. Ambiguitas Akurasi Pendistribusian Bantuan Sosial (Bansos)</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1 text-justify">
                    Program bantuan darurat pemerintah rawan salah sasaran akibat tumpang tindih status ekonomi keluarga yang tidak tervalidasi secara objektif. Melalui peta hunian digital berdasar status sosial, pengurus memiliki draf peta demografi yang transparan demi memastikan warga kakek-nenek, yatim, atau dhuafa yang layak memperoleh haknya terlebih dahulu.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 border border-rose-100">
                  <BadgeAlert size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">4. Kekosongan Sistem Peringatan Kebencanaan Lokal</h4>
                  <p className="text-xs text-slate-500 font-semibold leading-relaxed mt-1 text-justify">
                    Berdiri di atas pemukiman pasca-bencana tsunami Palu, ketidaksiapan mitigasi mandiri warga dapat berakibat fatal saat sesar Palu-Koro kembali bergeliat. Aplikasi ini mengintegrasikan rujukan mandiri siaga lindu, titik kaku evakuasi luar ruang, laporan aduan bahaya lingkungan, hingga integrasi kontak respons cepat dalam satu genggaman.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex items-center gap-3.5 mt-8">
              <CheckCircle2 size={22} className="text-indigo-600 flex-shrink-0" />
              <p className="text-[11px] font-extrabold text-slate-700 leading-normal">
                Sinergi modernitas teknologi cloud berpadu kearifan gotong-royong demi mewujudkan RT Percontohan Tangguh Bencana pertama di Kota Palu.
              </p>
            </div>
          </div>
        </section>

        {/* TATA NILAI & KERANGKA STRATEGIS PORTAL TERAS RT 02 */}
        <section className="mb-20" id="core-values-section">
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 mb-1 block font-mono">PONDASI UTAMA &amp; VISI JANGKA PANJANG</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Pondasi &amp; <span className="font-serif italic text-indigo-600">Arah Gerak RT 02</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-2">Struktur tata luhur nilai, cita-cita bersama, sasaran strategis, serta rencana jangka panjang kepengurusan rukun tetangga Huntap Tondo 2.</p>
          </div>

          <div className="space-y-20">
            {/* A. NILAI-NILAI UTAMA */}
            <div className="border-t border-slate-100 pt-10" id="section-nilai-utama">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Bagian A</span>
                  <span className="text-xs text-slate-400 font-black font-mono">• TATA NILAI UTAMA</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Nilai-Nilai Utama <span className="font-serif italic text-indigo-600">Portal Teras RT 02</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Lima tata nilai luhur dasar kemasyarakatan dan tata kelola pelayanan warga Huntap Tondo 2.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" id="strategic-content-nilai">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 w-fit mb-4">
                      <Lock size={20} />
                    </div>
                    <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight mb-2">Transparansi Mutlak</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-justify">
                      Keterbukaan penuh pada seluruh aliran iuran kas rukun tetangga, dokumen kebijakan, serta penyaluran bantuan sosial secara real-time demi rasa saling percaya.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 w-fit mb-4">
                      <Award size={20} />
                    </div>
                    <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight mb-2">Integritas Amanah</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-justify">
                      Sikap jujur, adil, dan integritas tinggi pengurus RT dalam menjalankan roda organisasi pelayanan kependudukan warga Huntap dengan pengorganisasian amanah.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 w-fit mb-4">
                      <HeartHandshake size={20} />
                    </div>
                    <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight mb-2">Gotong Royong</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-justify">
                      Menjaga tradisi luhur tolong-menolong, solidaritas sosial tinggi, gotong-royong swadaya, serta bahu-membahu dalam menghadapi musibah suka maupun duka.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 w-fit mb-4">
                      <Users size={20} />
                    </div>
                    <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight mb-2">Inklusivitas Adil</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-justify">
                      Memberikan pelayanan dan perhatian adil merata bagi seluruh keluarga tanpa diskriminasi latar belakang suku, ras, gender, keyakinan, maupun taraf ekonomi keluarga.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                  <div>
                    <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 w-fit mb-4">
                      <Shield size={20} />
                    </div>
                    <h4 className="text-sm font-black text-slate-950 uppercase tracking-tight mb-2">Ketangguhan Siaga</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-justify">
                      Kesiapsiagaan penuh, tanggap darurat bencana, pengamanan pencegahan aktif, serta ketahanan mitigasi wilayah mandiri rukun tetangga di atas jalur sesar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* B. VISI & MISI */}
            <div className="border-t border-slate-100 pt-10" id="section-visi-misi">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Bagian B</span>
                  <span className="text-xs text-slate-400 font-black font-mono">• VISI &amp; MISI</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Visi &amp; Misi <span className="font-serif italic text-indigo-600">Rukun Tetangga 02</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Cita-cita luhur dan panduan langkah operasional kepengurusan jangka panjang.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="strategic-content-visi-misi">
                <div className="lg:col-span-5 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-indigo-900 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/10 rounded-xl">
                        <Globe size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 font-mono">VISI UTAMA</span>
                    </div>
                    <h4 className="text-lg sm:text-2xl font-black text-white mb-4 tracking-tight leading-normal">
                      "Mewujudkan Harmoni Huntap Tondo 2 Sebagai <span className="font-serif italic text-indigo-200">Pemukiman Digital Mandiri</span> yang Unggul, Transparan, Solider, Akuntabel, dan Siaga Bencana"
                    </h4>
                    <p className="text-xs text-indigo-200/90 font-medium leading-relaxed text-justify">
                      Visi luhur yang memandu langkah kita dalam mendirikan lingkungan hunian berbasis teknologi tinggi, kreatif sosiologis, dan bersahabat erat dalam gotong-royong harmonis di Sulawesi Tengah.
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
                  <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 mb-4 block font-mono">MISI STRATEGIS</span>
                  <h4 className="text-lg font-black text-slate-900 tracking-tight mb-4">Langkah Utama yang <span className="font-serif italic text-indigo-600">Terbimbing Nyata</span></h4>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <span className="h-6 w-6 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-[10px] font-black font-mono flex-shrink-0">PM 1</span>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 uppercase">Pelayanan Birokrasi Cepat</h5>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                          Mengotomatisasi surat menyurat satu pintu dan rekapitulasi domisili warga secara mandiri guna menghemat waktu warga.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <span className="h-6 w-6 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center text-[10px] font-black font-mono flex-shrink-0">PM 2</span>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 uppercase">Akuntabilitas &amp; Transparansi Kas</h5>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                          Mencatat dan mengumumkan mutasi kas rukun tetangga seketika (real-time) melalui aplikasi demi membangun integritas.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <span className="h-6 w-6 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-[10px] font-black font-mono flex-shrink-0">PM 3</span>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 uppercase">Pemberdayaan Ekonomi Kreatif Warga</h5>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                          Mempromosikan UMKM lokal warga, bank sampah digital ekonomis, serta pasar swadaya sebagai pondasi finansial keluarga huni.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <span className="h-6 w-6 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center text-[10px] font-black font-mono flex-shrink-0">PM 4</span>
                      <div>
                        <h5 className="text-xs font-black text-slate-900 uppercase">Sinergi Mitigasi Bencana &amp; Keamanan</h5>
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                          Memelihara pemetaan hunian, koordinasi pos ronda malam, pos tanggap darurat gempa, serta asisten AI pintar siaga bencana.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* C. TUJUAN STRATEGIS */}
            <div className="border-t border-slate-100 pt-10" id="section-tujuan">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Bagian C</span>
                  <span className="text-xs text-slate-400 font-black font-mono">• TARGET CAPAIAN</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Tujuan Strategis <span className="font-serif italic text-indigo-600">RT 02</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Garis arah bagi program-program sosial, ketahanan bencana, dan pemberdayaan ekonomi.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="strategic-content-tujuan">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex gap-4">
                  <div className="p-3.5 rounded-2xl bg-indigo-50 text-indigo-600 h-fit">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">1. Mewujudkan Birokrasi Adaptif &amp; Modern</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-justify">
                      Menyajikan mekanisme administrasi kesuratan rukun tetangga yang ringkas, efektif, terbebas dari kesalahan manual, tumpukan kertas fisik, ataupun pungutan liar.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex gap-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 h-fit">
                    <Users size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">2. Menumbuhkan Rasa Saling Percaya</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-justify">
                      Membangun ikatan sosial yang sehat dan harmoni melalui keterbukaan pelaporan kas publik tanpa celah manipulasi demi kedamaian lingkungan bersama.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex gap-4">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 h-fit">
                    <ShoppingBag size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">3. Mengakselerasi Kesejahteraan Finansial</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-justify">
                      Memicu keaktifan roda pasar swadaya mikro warga Huntap, memperluas jangkauan niaga UMKM, dan mendatangkan nilai ekonomis dari pemilahan bank sampah secara teratur.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex gap-4">
                  <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-600 h-fit">
                    <Shield size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">4. Meminimalkan Dampak Kebencanaan</h4>
                    <p className="text-xs text-slate-500 font-semibold leading-relaxed text-justify">
                      Meningkatkan kesiapsiagaan darurat lindu secara mandiri, mengarahkan peta titik kumpul secara cepat, koordinasi komunikasi darurat, dan menjaga keselamatan pengamanan warga.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* D. SASARAN 5 TAHUN KEDEPAN */}
            <div className="border-t border-slate-100 pt-10" id="section-sasaran">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Bagian D</span>
                  <span className="text-xs text-slate-400 font-black font-mono">• METRIK INDIKATOR</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Sasaran 5 Tahun Kedepan <span className="font-serif italic text-indigo-600">(Strategic Targets)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Key Performance Indicators (KPI) kebersamaan yang ingin dicapai pengurus RT 02 dalam jangka menengah.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" id="strategic-content-sasaran">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <span className="text-[36px] font-black text-indigo-600/20 font-mono tracking-tight">S-1</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">100% Pelayanan Digital</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Layanan administrasi, rekapitulasi KK, dan usulan korespondensi beralih penuh seutuhnya ke Teras RT 02.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <span className="text-[36px] font-black text-amber-600/20 font-mono tracking-tight">S-2</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Nol Masalah Rekonsiliasi</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Sistem penarikan iuran, laporan pengeluaran, dan audit saldo kas tercapai 100% transparan dengan akurasi mutlak.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <span className="text-[36px] font-black text-emerald-600/20 font-mono tracking-tight">S-3</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">UMKM Naik Kelas</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Minimal 90% pelaku niaga warga Huntap Tondo 2 terdaftar, memiliki lapak digital, dan mendapatkan pembeli konstan.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <span className="text-[36px] font-black text-rose-600/20 font-mono tracking-tight">S-4</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Desa Siaga Bencana</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Mewujudkan percontohan kerukunan rukun tetangga dengan mitigasi lindu berstandar tangguh bencana tingkat nasional.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <span className="text-[36px] font-black text-blue-600/20 font-mono tracking-tight">S-5</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2">Mandiri Finansial</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                      Terciptanya ketahanan kas mandiri operasional rukun tetangga yang diperoleh secara ekologis via bank sampah terpadu warga.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* E. MOTTO & SLOGAN JUANG */}
            <div className="border-t border-slate-100 pt-10" id="section-motto">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Bagian E</span>
                  <span className="text-xs text-slate-400 font-black font-mono">• SLOGAN JUANG</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Motto &amp; Slogan <span className="font-serif italic text-indigo-600">RT 02</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Singkatan luhur dan esensi identitas keguyuban rukun tetangga di Huntap Tondo 2.</p>
              </div>

              <div className="bg-indigo-950 text-white rounded-3xl p-6 sm:p-10 shadow-lg border border-indigo-900" id="strategic-content-motto">
                <div className="text-center mb-8">
                  <span className="text-[10px] text-indigo-400 font-black tracking-widest font-mono uppercase">MOTTO &amp; SLOGAN JUANG KITA</span>
                  <h3 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 mb-3 tracking-tight font-sans">
                    "TERAS RT 02"
                  </h3>
                  <div className="h-1 w-20 bg-indigo-500 mx-auto rounded-full mb-4" />
                  <p className="text-sm font-extrabold text-indigo-300 tracking-wider uppercase">
                    Teknologi • Ekraf • Rukun • Aman • Sinergi
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                    <span className="text-xl font-black text-indigo-400 font-mono">T</span>
                    <h4 className="text-xs font-black text-white uppercase mt-1 mb-1 tracking-wider">TEKNOLOGI</h4>
                    <p className="text-[10px] text-indigo-200/80 font-medium leading-relaxed">
                      Inovasi platform digital sebagai tiang penopang utama pelayanan administrasi satu pintu yang efektif.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                    <span className="text-xl font-black text-amber-400 font-mono">E</span>
                    <h4 className="text-xs font-black text-white uppercase mt-1 mb-1 tracking-wider">EKRAF</h4>
                    <p className="text-[10px] text-indigo-200/80 font-medium leading-relaxed">
                      Ekonomi kreatif mandiri melalui swadaya UMKM dan pemilahan bank sampah digital bernilai tinggi.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                    <span className="text-xl font-black text-emerald-400 font-mono">R</span>
                    <h4 className="text-xs font-black text-white uppercase mt-1 mb-1 tracking-wider">RUKUN</h4>
                    <p className="text-[10px] text-indigo-200/80 font-medium leading-relaxed">
                      Interaksi kemasyarakatan yang tulus, damai, pemaaf, saling asih, serta menjunjung tinggi tenggang rasa.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                    <span className="text-xl font-black text-rose-400 font-mono">A</span>
                    <h4 className="text-xs font-black text-white uppercase mt-1 mb-1 tracking-wider">AMAN</h4>
                    <p className="text-[10px] text-indigo-200/80 font-medium leading-relaxed">
                      Keamanan pemukiman yang terjaga, tanggap ronda bersama, serta siaga mitigasi gempa sesar aktif.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                    <span className="text-xl font-black text-blue-400 font-mono">S</span>
                    <h4 className="text-xs font-black text-white uppercase mt-1 mb-1 tracking-wider">SINERGI</h4>
                    <p className="text-[10px] text-indigo-200/80 font-medium leading-relaxed">
                      Kolaborasi erat nan selaras antara para pengurus, seluruh KK warga huni, akademisi, dan pemerintah.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* F. RENCANA JANGKA PANJANG */}
            <div className="border-t border-slate-100 pt-10" id="section-rencana">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono font-black uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">Bagian F</span>
                  <span className="text-xs text-slate-400 font-black font-mono">• LINIMASA ROADMAP</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Rencana Jangka Panjang <span className="font-serif italic text-indigo-600">(10-Year Roadmap)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">Linimasa tiga tahap utama pelaksanaan visi jangka panjang digitalisasi, kemandirian ekonomi, dan ketangguhan lingkungan Huntap Tondo 2 dalam kurun waktu 10 tahun.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="strategic-content-rencana">
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 py-1.5 px-3 bg-indigo-50 text-indigo-600 text-[9px] font-black font-mono rounded-bl-2xl uppercase">Tahap 1</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 mt-2">Fondasi &amp; Digitalisasi</h4>
                    <div className="text-[10px] text-indigo-600 font-black tracking-widest font-mono mb-3 uppercase">Tahun 1 - 3 (2026 - 2028)</div>
                    <ul className="space-y-1.5 text-[11px] text-slate-500 font-semibold list-disc pl-4 leading-relaxed">
                      <li>Migrasi data kependudukan terenkripsi dan integrasi penuh blok hunian.</li>
                      <li>Pembiasaan iuran kas terjadwal transparan berbasis web secara periodik.</li>
                      <li>Aktivasi asisten konsultasi AI Siaga Bencana dan pemetaan risiko darurat.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 py-1.5 px-3 bg-amber-50 text-amber-600 text-[9px] font-black font-mono rounded-bl-2xl uppercase">Tahap 2</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 mt-2">Pemberdayaan &amp; Ekonomi Mandiri</h4>
                    <div className="text-[10px] text-amber-600 font-black tracking-widest font-mono mb-3 uppercase">Tahun 4 - 6 (2029 - 2031)</div>
                    <ul className="space-y-1.5 text-[11px] text-slate-500 font-semibold list-disc pl-4 leading-relaxed">
                      <li>Inisiasi Bank Sampah digital terintegrasi iuran kas sosial warga.</li>
                      <li>Inkubasi bisnis swadaya, standarisasi, dan digitalisasi UMKM Huntap.</li>
                      <li>Pembangunan infrastruktur bersama ramah lingkungan &amp; energi mandiri.</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 py-1.5 px-3 bg-rose-50 text-rose-600 text-[9px] font-black font-mono rounded-bl-2xl uppercase">Tahap 3</div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 mt-2">Ketangguhan &amp; Kepemimpinan Regional</h4>
                    <div className="text-[10px] text-rose-600 font-black tracking-widest font-mono mb-3 uppercase">Tahun 7 - 10 (2032 - 2035)</div>
                    <ul className="space-y-1.5 text-[11px] text-slate-500 font-semibold list-disc pl-4 leading-relaxed">
                      <li>Penyediaan hidran mandiri, jalur evakuasi pintar, dan kelengkapan darurat tangguh.</li>
                      <li>Replikasi model tata kelola Smart RT berskala kota/nasional secara open-source.</li>
                      <li>Penciptaan ekosistem belajar digital jangka panjang berkelanjutan bagi anak-anak Huntap.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MITIGASI GEMPA & SIAGA BENCHMARK AREA */}
        <section className="mb-16 bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-[10px] text-indigo-400 font-extrabold tracking-widest font-mono uppercase block mb-2">POS LAJU SESAR AKTIF MITIGASI</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Pos Siaga &amp; <span className="font-serif italic text-indigo-300">Lapangan Evakuasi Warga</span></h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Mengingat Huntap Tondo II berdiri di radius proksimitas pengaruh letupan tektonik Sesar Palu-Koro yang aktif secara berulang, kami membangun kesiapsiagaan darurat terdigitalisasi secara saksama.
              </p>
              
              <div className="mt-6 space-y-4 font-semibold text-xs text-slate-200">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white/10 rounded-lg text-rose-450 mt-0.5">
                    <BadgeAlert size={16} className="text-rose-405 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-white font-extrabold">Titik Kumpul Evakuasi Utama</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Lapangan Terbuka Utama depan Masjid Agung Al-Ikhlas Huntap Tondo 2.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-white/10 rounded-lg text-emerald-400 mt-0.5">
                    <Globe size={16} className="text-emerald-405" />
                  </div>
                  <div>
                    <p className="text-white font-extrabold">Sistem Digital Mitigasi</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Notifikasi gempa langsung memotong jaringan (intercept) sistem BMKG.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm flex flex-col justify-between h-full">
              <h4 className="text-xs font-black text-rose-400 tracking-wider uppercase font-mono mb-4">📢 PETUNJUK KESELAMATAN SEBARAN SESAR</h4>
              <ul className="space-y-2.5 text-[11px] text-slate-300 font-medium leading-relaxed list-disc pl-4">
                <li>Saat lindu terasa, segera beralih menuju kolong meja kokoh atau lindungi kepala Anda dengan bantal/buku tebal.</li>
                <li>Setelah getaran reda, segera evakuasi keluarga secara beruntun lewat pintu keluar darurat luar rumah menuju lapangan luas.</li>
                <li>Haramkan mempercayai kabar burung desas-desus non-resmi BMKG atau isu tsunami tsunami palsu.</li>
                <li>Tekan tombol **PANIC BUTTON** merah di bagian bawah dashboard jika Anda atau tetangga terjebak reruntuhan.</li>
              </ul>
              
              <button 
                onClick={() => navigate('/gempa')}
                className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs tracking-wider uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Activity size={14} className="animate-pulse" />
                MASUK PANEL MONITOR GEMPA AKTIF (BMKG)
              </button>
            </div>
          </div>
        </section>

        {/* HUBUNGI & LOKASI SEKRETARIAT */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 mb-1 block font-mono">KONTAK RESMI &amp; SARANA LAYANAN</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-4">
                Sekretariat RT 02 <span className="font-serif italic text-indigo-600">Huntap Tondo 2</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-semibold mb-6">
                Butuh legalitas verifikasi kependudukan, pengurusan berkas fisik, konsultasi usaha, atau rujukan swadaya? Kami membuka pintu pelayanan langsung dengan senang hati.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-1 bg-red-50 text-red-500 rounded-lg mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Alamat Korespondensi</p>
                    <p className="text-xs text-slate-505 text-slate-500 mt-1 font-semibold leading-relaxed">
                      Blok B No. 42, Hunian Tetap (Huntap) Tondo II, RT 02 / RW 05, Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu, Sulawesi Tengah.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-1 bg-emerald-50 text-emerald-500 rounded-lg mt-0.5">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Saluran Telepon Siaga</p>
                    <p className="text-xs text-slate-505 font-mono font-bold text-slate-800 mt-1 hover:text-emerald-700 transition-colors">
                      +62 822-9333-2802 (Hotline Utama Pengaduan)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-1 bg-blue-50 text-blue-500 rounded-lg mt-0.5">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-900">Jam Layanan Kantor Sekretariat</p>
                    <p className="text-xs text-slate-505 text-slate-500 mt-1 font-semibold">
                      Setiap Hari Kerja (Senin s/d Jumat) Pukul 19.00 - 21.00 WITA.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-slate-50 to-indigo-50/20 rounded-3xl border border-slate-100 flex flex-col justify-between h-full">
              <div className="text-center lg:text-left mb-6">
                <h4 className="text-xs font-black text-slate-950 tracking-tight uppercase">Sistem Tata Kelola TERAS DIgital</h4>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-semibold">
                  Situs dan platform mandiri ini dikembangkan dalam mewujudkan tata pemukiman cerdas. Apabila Anda menemukan kejanggalan integrasi kependudukan Anda, silakan hubungi admin pengembang langsung.
                </p>
              </div>

              <div className="space-y-2.5">
                <button 
                  onClick={() => navigate('/services?tab=lapor')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Activity size={14} />
                    AJUKAN PENGADUAN / LAPORKAN KEJADIAN
                  </span>
                  <ChevronRight size={14} />
                </button>

                <button 
                  onClick={() => navigate('/services?tab=surat')}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-150 border-indigo-100 font-extrabold text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <span>PENGAJUAN PINJAM ALAT / SURAT RT</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
