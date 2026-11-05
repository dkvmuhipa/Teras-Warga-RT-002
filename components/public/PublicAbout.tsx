import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Home, 
  MapPin, 
  Heart, 
  Activity, 
  Award, 
  Phone, 
  ArrowLeft, 
  ChevronRight, 
  Calendar,
  Globe,
  FileText,
  Clock,
  Sparkles,
  ShoppingBag,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { Official, House, UMKM, CashFlow, Report, LetterRequest } from '../../types';

interface PublicAboutProps {
  officials?: Official[];
  houses?: House[];
  umkm?: UMKM[];
  cashFlow?: CashFlow[];
  reports?: Report[];
  letters?: LetterRequest[];
}

export const PublicAbout: React.FC<PublicAboutProps> = ({ 
  officials = [], 
  houses = [], 
  umkm = [], 
  cashFlow = [],
  reports = [],
  letters = []
}) => {
  const navigate = useNavigate();
  const [activeGeoTab, setActiveGeoTab] = useState<'hunian' | 'demografi' | 'kerentanan' | 'layanan'>('hunian');

  // Demographics calculation
  const totalOccupants = houses.reduce((sum, h) => {
    if (h.status !== 'Occupied') return sum;
    const familyMembersCount = h.familyMembers ? h.familyMembers.length : 0;
    const baseOccupants = h.occupants || 1;
    return sum + Math.max(baseOccupants, 1 + familyMembersCount);
  }, 0);

  const demoStats = useMemo(() => {
    let males = 0;
    let females = 0;
    let productive = 0;
    let young = 0;
    let senior = 0;

    houses.forEach(h => {
      if (h.status === 'Occupied') {
        if (h.gender === 'Perempuan') females++;
        else males++;

        const birth = h.birthDate ? new Date(h.birthDate) : null;
        const age = birth && !isNaN(birth.getTime()) ? (new Date().getFullYear() - birth.getFullYear()) : 35;
        if (age < 15) young++;
        else if (age >= 60) senior++;
        else productive++;

        if (h.familyMembers && Array.isArray(h.familyMembers)) {
          h.familyMembers.forEach(m => {
            if (!m) return;
            if (m.gender === 'Perempuan') females++;
            else males++;

            const mBirth = m.birthDate ? new Date(m.birthDate) : null;
            const mAge = mBirth && !isNaN(mBirth.getTime()) ? (new Date().getFullYear() - mBirth.getFullYear()) : 20;
            if (mAge < 15) young++;
            else if (mAge >= 60) senior++;
            else productive++;
          });
        }
      }
    });

    const sexRatio = females > 0 ? ((males / females) * 100).toFixed(1) : '100.0';
    const depRatio = productive > 0 ? (((young + senior) / productive) * 100).toFixed(1) : '0';

    return { males, females, productive, young, senior, sexRatio, depRatio };
  }, [houses]);

  const occupiedHouses = houses.filter(h => h.status === 'Occupied').length;
  const emptyHouses = houses.filter(h => h.status === 'Empty').length;
  const businessHouses = houses.filter(h => h.status === 'Business').length;

  // Vulnerable groups
  const babyToddlerCount = houses.reduce((sum, h) => sum + (h.babyCount || 0) + (h.toddlerCount || 0), 0);
  const elderlyCount = houses.reduce((sum, h) => sum + (h.elderlyCount || 0), 0);
  const pregnantCount = houses.reduce((sum, h) => sum + (h.pregnantCount || 0), 0);

  // Bureaucracy & Reports Analytics
  const resolvedReports = reports.filter(r => r.status === 'Selesai').length;
  const processedLetters = letters.filter(l => l.status !== 'Ditolak' && l.status !== 'Rejected').length;

  // Dynamic Core Officials
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

  const coreStructure = [
    matchOfficialByRole(
      'ketua',
      'Ketua RT 02',
      'Memimpin pengayoman warga dengan keterbukaan, santun, dan responsif bagi kemajuan lingkungan bersama.',
      [
        'Penanggung jawab umum tata kelola dan perlindungan warga',
        'Penandatanganan berkas & verifikasi surat pengantar',
        'Penggerak musyawarah gotong royong dan kesiapsiagaan darurat'
      ]
    ),
    matchOfficialByRole(
      'sekretaris',
      'Sekretaris RT',
      'Ketertiban administrasi dan arsip adalah kunci terwujudnya pelayanan warga yang adil dan terdokumentasi.',
      [
        'Pengelolaan pangkalan data digital kependudukan KK warga',
        'Notulensi rapat musyawarah & arsip regulasi resmi RT',
        'Verifikasi pengajuan mutasi dan perubahan data mandiri'
      ]
    ),
    matchOfficialByRole(
      'bendahara',
      'Bendahara RT',
      'Setiap rupiah iuran warga adalah amanah swadaya yang wajib dipertanggungjawabkan secara terbuka.',
      [
        'Pencatatan pembukuan kas masuk & keluar terintegrasi',
        'Rekonsiliasi iuran kebersihan, air, dan kas sosial',
        'Penyusunan laporan transparansi keuangan periodik warga'
      ]
    )
  ];

  const terasValues = [
    {
      letter: 'T',
      title: 'Teknologi',
      desc: 'Digitalisasi administrasi persuratan satu pintu, absensi kegiatan, dan tata kelola berbasis web.',
      color: 'from-indigo-500 to-blue-600',
      bgLight: 'bg-indigo-50 text-indigo-700 border-indigo-100'
    },
    {
      letter: 'E',
      title: 'Ekraf & Mandiri',
      desc: 'Pemberdayaan UMKM lokal warga dan pemilahan bank sampah digital bernilai ekonomis.',
      color: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 text-amber-700 border-amber-100'
    },
    {
      letter: 'R',
      title: 'Rukun & Harmonis',
      desc: 'Kebersamaan guyub, saling asih, peduli tetangga, dan penyelesaian musyawarah mufakat.',
      color: 'from-emerald-500 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-100'
    },
    {
      letter: 'A',
      title: 'Aman & Tangguh',
      desc: 'Sistem ronda siskamling aktif, penerangan jalan, serta mitigasi gempa sesar Palu-Koro.',
      color: 'from-rose-500 to-red-600',
      bgLight: 'bg-rose-50 text-rose-700 border-rose-100'
    },
    {
      letter: 'S',
      title: 'Sinergi Warga',
      desc: 'Kolaborasi selaras antara pengurus, warga, kelurahan, dan pemangku kepentingan.',
      color: 'from-blue-500 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700 border-blue-100'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 py-6 sm:py-10 px-4 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12">

        {/* Navigation & Header */}
        <div>
          <button 
            onClick={() => navigate('/')} 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-xs font-bold uppercase tracking-wider mb-6 bg-white hover:bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} />
            <span>Kembali ke Beranda</span>
          </button>

          {/* Hero Profil RT */}
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-7 sm:p-10 md:p-12 shadow-xl overflow-hidden border border-slate-800">
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold border border-white/20 text-indigo-200">
                <Shield size={14} className="text-emerald-400" />
                <span>PROFIL RESMI • HUNTAP TONDO 2</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Rukun Tetangga 002 <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent">RW 020</span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
                Kawasan Hunian Tetap (Huntap) Tondo 2, Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu. Komunitas tangguh pasca-bencana yang bertransformasi menjadi pemukiman mandiri, transparan, dan terdigitalisasi melalui ekosistem <strong>TERAS Warga</strong>.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs font-semibold flex items-center gap-2">
                  <Home size={15} className="text-amber-400" />
                  <span>Blok C5 s/d C12</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs font-semibold flex items-center gap-2">
                  <Users size={15} className="text-emerald-400" />
                  <span>{houses.length} Kavling Terdaftar ({totalOccupants} Jiwa)</span>
                </div>
                <div className="px-3.5 py-2 rounded-2xl bg-white/10 border border-white/15 text-xs font-semibold flex items-center gap-2">
                  <Award size={15} className="text-sky-400" />
                  <span>RT Tanggap &amp; Cerdas Bencana</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. NILAI UTAMA: FILOSOFI TERAS */}
        <section className="space-y-4">
          <div className="text-center sm:text-left">
            <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 tracking-widest block mb-1">
              FONDASI KEGUYUBAN KITA
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Nilai &amp; Filosofi <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">"TERAS"</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1 max-w-2xl">
              Lima pilar nilai luhur yang menjadi pedoman pengurus dan seluruh warga dalam membangun kerukunan serta kemajuan lingkungan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {terasValues.map((val, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -3 }}
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${val.color} text-white font-mono font-black text-lg flex items-center justify-center shadow-md mb-3`}>
                    {val.letter}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-sm tracking-tight mb-1.5">{val.title}</h3>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{val.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 2. DEMOGRAFI & STRUKTUR SOSIAL REAL-TIME */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 mb-1 block">
                INTEGRASI DATABASE KEPENDUDUKAN
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Struktur Sosial &amp; Demografi Wilayah
              </h2>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 text-xs font-bold">
              {[
                { id: 'hunian', label: 'Hunian' },
                { id: 'demografi', label: 'Demografi' },
                { id: 'kerentanan', label: 'Warga Rentan' },
                { id: 'layanan', label: 'Layanan' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGeoTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    activeGeoTab === tab.id ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="pt-2">
            {activeGeoTab === 'hunian' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Kavling</p>
                  <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{houses.length}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Blok C5 s/d C12</p>
                </div>
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Rumah Berpenghuni</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1 font-mono">{occupiedHouses}</p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Tingkat Huni {houses.length > 0 ? Math.round((occupiedHouses / houses.length) * 100) : 0}%</p>
                </div>
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Membuka Usaha</p>
                  <p className="text-2xl font-black text-amber-900 mt-1 font-mono">{businessHouses || umkm.length}</p>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">UMKM mandiri aktif</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Unit Cadangan / Kosong</p>
                  <p className="text-2xl font-black text-slate-700 mt-1 font-mono">{emptyHouses}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Siap huni / mutasi</p>
                </div>
              </div>
            )}

            {activeGeoTab === 'demografi' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Total Jiwa Terdata</p>
                  <p className="text-2xl font-black text-indigo-900 mt-1 font-mono">{totalOccupants}</p>
                  <p className="text-[11px] text-indigo-700 font-medium mt-0.5">{demoStats.males} Pria &bull; {demoStats.females} Wanita</p>
                </div>
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Usia Produktif (15-59)</p>
                  <p className="text-2xl font-black text-blue-900 mt-1 font-mono">{demoStats.productive}</p>
                  <p className="text-[11px] text-blue-700 font-medium mt-0.5">Pilar kemandirian wilayah</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rasio Jenis Kelamin</p>
                  <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{demoStats.sexRatio}</p>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Indeks seimbang</p>
                </div>
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Rasio Ketergantungan</p>
                  <p className="text-2xl font-black text-amber-900 mt-1 font-mono">{demoStats.depRatio}%</p>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">Standar BPS kondusif</p>
                </div>
              </div>
            )}

            {activeGeoTab === 'kerentanan' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Balita &amp; Anak-Anak</p>
                  <p className="text-2xl font-black text-rose-900 mt-1 font-mono">{babyToddlerCount} Jiwa</p>
                  <p className="text-[11px] text-rose-700 font-medium mt-0.5">Sasaran imunisasi Posyandu berkala</p>
                </div>
                <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700">Lansia (Senior &gt;60 Thn)</p>
                  <p className="text-2xl font-black text-purple-900 mt-1 font-mono">{elderlyCount} Jiwa</p>
                  <p className="text-[11px] text-purple-700 font-medium mt-0.5">Prioritas evakuasi tanggap bencana</p>
                </div>
                <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Ibu Hamil Terdata</p>
                  <p className="text-2xl font-black text-teal-900 mt-1 font-mono">{pregnantCount} Jiwa</p>
                  <p className="text-[11px] text-teal-700 font-medium mt-0.5">Pemantauan gizi dan nutrisi</p>
                </div>
              </div>
            )}

            {activeGeoTab === 'layanan' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Surat Pengantar</p>
                  <p className="text-2xl font-black text-blue-900 mt-1 font-mono">{processedLetters}</p>
                  <p className="text-[11px] text-blue-700 font-medium mt-0.5">Diproses tuntas secara digital</p>
                </div>
                <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Aduan Warga Tuntas</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1 font-mono">{resolvedReports}</p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Terselesaikan secara musyawarah</p>
                </div>
                <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Pusat Bantuan &amp; FAQ</p>
                  <p className="text-2xl font-black text-amber-900 mt-1 font-mono">13 BAB</p>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5">Peraturan &amp; SOP resmi RT</p>
                </div>
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Portal Warga</p>
                  <p className="text-2xl font-black text-indigo-900 mt-1 font-mono">24/7</p>
                  <p className="text-[11px] text-indigo-700 font-medium mt-0.5">Layanan mandiri real-time</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 3. AMANAH KEPENGURUSAN RT 02 */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-600 block mb-1">
                STRUKTUR KEBERSAMAAN
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Amanah Kepengurusan <span className="text-emerald-600">RT 02</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Aparatur pengurus pilihan warga yang senantiasa mengutamakan transparansi dan pelayanan santun.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreStructure.map((member, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider font-mono">
                      {member.role}
                    </span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                  </div>

                  <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
                    {member.name}
                  </h3>

                  <p className="text-xs italic text-slate-500 leading-relaxed font-medium mb-5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-center">
                    {member.phrase}
                  </p>

                  <div className="space-y-2 mb-4">
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest font-mono">FOKUS TUGAS</p>
                    {member.tasks.map((task, tidx) => (
                      <div key={tidx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold text-xs mt-0.5">&bull;</span>
                        <span className="text-xs text-slate-600 font-medium leading-relaxed">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {member.phone && (
                  <div className="border-t border-slate-100 pt-3 mt-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Kontak Siaga</p>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{member.phone}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Staf Pendukung jika ada */}
          {officials.length > 3 && (
            <div className="pt-4">
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3 font-mono flex items-center gap-2">
                <Users size={15} className="text-indigo-600" />
                <span>Koordinator &amp; Petugas Bidang Khusus</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {officials
                  .filter(o => !['Ketua RT', 'Sekretaris', 'Bendahara'].some(title => o.role.toLowerCase().includes(title.toLowerCase())))
                  .map((off, oidx) => (
                    <div key={oidx} className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs uppercase border border-indigo-100 shrink-0">
                        {off.name.substring(0, 2)}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{off.name}</p>
                        <p className="text-[10px] text-indigo-600 font-medium truncate">{off.role}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </section>

        {/* 4. VISI, MISI & SASARAN STRATEGIS */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600 block mb-1">
              ARAH PENGEMBANGAN LINGKUNGAN
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Visi, Misi &amp; Sasaran Strategis
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visi */}
            <div className="p-6 bg-gradient-to-br from-indigo-50/70 via-indigo-50/30 to-white rounded-3xl border border-indigo-100 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider font-mono">
                VISI LINGKUNGAN
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-800 leading-relaxed italic">
                "Terwujudnya Rukun Tetangga 002 Huntap Tondo 2 yang berdaya, mandiri, rukun, aman dari ancaman bencana, serta terdepan dalam keterbukaan informasi dan pelayanan digital."
              </p>
            </div>

            {/* 4 Sasaran Strategis */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Birokrasi Cepat &amp; Paperless</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Pengurusan surat pengantar dan pendataan KK mandiri satu pintu tanpa repot antre.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Transparansi Finansial Mutlak</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Pencatatan kas dan iuran swadaya yang dapat diakses terbuka oleh setiap warga.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Pemberdayaan UMKM &amp; Bank Sampah</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Mendorong perputaran ekonomi keluarga warga melalui katalog usaha dan pilah sampah bernilai.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">4</span>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Ketahanan Lingkungan &amp; Mitigasi Gempa</h4>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Pemeliharaan jalur evakuasi, siskamling ronda malam aktif, dan informasi gempa BMKG.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. KONTAK & LOKASI SEKRETARIAT (DATA AKURAT BLOK C10 NO. 8) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 block mb-1 font-mono">
                  LAYANAN RESMI RT
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Sekretariat RT 002 <span className="text-indigo-600">RW 020</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Kami membuka pintu koordinasi dan layanan langsung bagi warga yang membutuhkan legalitas dokumen fisik, konsultasi lingkungan, atau pengaduan warga.
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-xl mt-0.5">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Alamat Kantor Sekretariat</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                      Blok C10 No. 8, Hunian Tetap (Huntap) Tondo 2, RT 002 / RW 020, Kelurahan Tondo, Kecamatan Mantikulore, Kota Palu, Sulawesi Tengah.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl mt-0.5">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Saluran Komunikasi Resmi</p>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">
                      +62 822-9333-2802 (Ketua RT / Hotline Pengaduan)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl mt-0.5">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Waktu Pelayanan Administrasi Fisik</p>
                    <p className="text-xs text-slate-600 mt-0.5 font-medium">
                      Senin s/d Jumat pukul 19.00 - 21.00 WITA (Layanan digital via web 24 jam).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200/80 space-y-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Pusat Layanan Warga</h4>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  Semua layanan dapat diakses langsung secara online tanpa harus menunggu jam kantor buka.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => navigate('/services?tab=surat')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <FileText size={15} />
                    <span>Ajukan Surat Pengantar Mandiri</span>
                  </span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => navigate('/services?tab=lapor')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Activity size={15} className="text-rose-600" />
                    <span>Laporkan Aduan / Kerusakan Fasilitas</span>
                  </span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => navigate('/info')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Globe size={15} className="text-emerald-600" />
                    <span>Transparansi Kas &amp; Jadwal Ronda</span>
                  </span>
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
