import React, { useState } from 'react';
import { Shield, FileText, Users, Home, AlertTriangle, Trash2, Calendar, Smartphone, Scale, Briefcase, ChevronDown, ChevronUp, Heart, Leaf, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PublicRules: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const rules = [
    {
      title: "Administrasi Kependudukan",
      icon: <FileText className="text-indigo-500" size={24} />,
      items: [
        "Warga baru (pemilik rumah, penyewa, mahasiswa, atau keluarga pendatang) wajib melapor ke Ketua RT maksimal 1×24 jam setelah tinggal.",
        "Menyerahkan fotokopi KTP dan KK (untuk warga tetap) atau KTP, KTM, dan surat kontrakan (untuk mahasiswa).",
        "Menuliskan nomor WhatsApp aktif di bagian belakang dokumen KK/KTP.",
        "Mengisi Formulir Data Warga yang disediakan pengurus RT.",
        "Wajib melapor jika terjadi perpindahan keluar, perubahan status keluarga (pernikahan, meninggal dunia), atau tamu menginap lebih dari 1 malam."
      ]
    },
    {
      title: "Aturan bagi Warga & Penghuni Kontrakan",
      icon: <Users className="text-emerald-500" size={24} />,
      items: [
        "Wajib lapor diri dalam 1×24 jam setelah menempati rumah kontrakan.",
        "Wajib menjaga sopan santun dan etika sosial terhadap warga sekitar.",
        "Diharapkan aktif dalam ronda malam (khusus laki-laki), gotong royong, dan kegiatan kebersamaan.",
        "Penghuni kontrakan dilarang mengadakan pesta/acara musik melewati pukul 23.59 WITA.",
        "Tanggung jawab pribadi atas keamanan rumah, perilaku tamu, dan tertib berkendara (tidak ugal-ugalan/knalpot bising)."
      ]
    },
    {
      title: "Ketentuan Keramaian & Tamu",
      icon: <Calendar className="text-amber-500" size={24} />,
      items: [
        "Kegiatan hiburan/keramaian diizinkan selama berakhir maksimal pukul 23.59 WITA.",
        "Jika mengadakan keramaian, wajib izin dan memberitahu Ketua RT minimal H-3.",
        "Tamu wajib menjaga ketertiban dan tidak parkir sembarangan yang menghalangi jalan umum.",
        "Bila melanggar, Pengurus RT berhak memberikan teguran langsung atau berkoordinasi dengan pihak keamanan."
      ]
    },
    {
      title: "Keamanan, Ketertiban & Parkir",
      icon: <Shield className="text-rose-500" size={24} />,
      items: [
        "Warga diimbau menutup pagar rumah pada malam hari dan melaporkan kegiatan mencurigakan.",
        "Dilarang keras memarkir kendaraan di bahu jalan yang dapat menghambat akses darurat (Pemadam/Ambulans).",
        "Warga wajib mengarahkan tamu agar parkir tidak menutupi akses pagar rumah tetangga.",
        "Pengaturan jadwal ronda malam dikelola secara digital melalui sistem RT.",
        "Gunakan fitur Panic Button di aplikasi hanya untuk keadaan darurat yang sebenarnya."
      ]
    },
    {
      title: "Kebersihan & Bank Sampah",
      icon: <Trash2 className="text-teal-500" size={24} />,
      items: [
        "Warga diwajibkan memilah sampah organik and anorganik dari rumah.",
        "Aktif menyetorkan sampah anorganik ke Bank Sampah RT 02 melalui aplikasi untuk saldo digital.",
        "Setiap rumah bertanggung jawab atas kebersihan halaman and saluran air sekitarnya.",
        "Dilarang keras membuang sampah di saluran air, lahan kosong, atau bahu jalan.",
        "Dukung pengelolaan TPS3R untuk lingkungan yang lebih sehat."
      ]
    },
    {
      title: "Sosial & Kemasyarakatan",
      icon: <Home className="text-blue-500" size={24} />,
      items: [
        "Warga diwajibkan mengikuti kegiatan sosial: pengajian, arisan RT, posyandu, dan kerja bakti.",
        "Memberikan kabar jika berhalangan hadir dalam kegiatan warga.",
        "Membayar iuran bulanan RT sesuai kesepakatan musyawarah.",
        "Bersedia menyumbang sukarela untuk bantuan duka, bencana, atau musibah warga."
      ]
    },
    {
      title: "Hewan Peliharaan",
      icon: <Heart className="text-pink-500" size={24} />,
      items: [
        "Pemilik hewan wajib memastikan peliharaannya tidak mengganggu ketenangan (suara) and keamanan warga.",
        "Wajib segera membersihkan kotoran hewan peliharaan jika berada di area publik atau jalan umum.",
        "Memastikan hewan peliharaan dalam kondisi sehat and tidak membahayakan lingkungan."
      ]
    },
    {
      title: "Etika Digital & Privasi",
      icon: <Smartphone className="text-violet-500" size={24} />,
      items: [
        "Dilarang menyebarkan berita hoaks atau informasi yang belum terverifikasi di grup komunikasi warga.",
        "Dilarang menyebarkan data pribadi warga lain (No HP, Foto KTP, dll) tanpa izin yang bersangkutan.",
        "Sampaikan aspirasi, ide, and laporan melalui fitur Musyawarah Digital di aplikasi.",
        "Menjaga kesantunan dalam berkomunikasi di ruang digital warga."
      ]
    },
    {
      title: "Penghijauan & Estetika",
      icon: <Leaf className="text-emerald-500" size={24} />,
      items: [
        "Setiap rumah diimbau memiliki minimal satu tanaman hijau di area depan rumah untuk keasrian lingkungan.",
        "Menjaga keindahan and kerapian fasad rumah agar lingkungan tetap harmonis.",
        "Dilarang menumpuk material bangunan atau barang bekas di bahu jalan dalam waktu lama."
      ]
    },
    {
      title: "Usaha & UMKM",
      icon: <Briefcase className="text-orange-500" size={24} />,
      items: [
        "Usaha rumahan diperbolehkan selama tidak mengganggu tetangga (asap, bau, suara) and menjaga kebersihan.",
        "Wajib melaporkan jenis usahanya ke pengurus RT untuk pendataan and promosi di fitur UMKM aplikasi."
      ]
    },
    {
      title: "Sanksi",
      icon: <Scale className="text-slate-500" size={24} />,
      items: [
        "Warga yang melanggar aturan akan dikenakan teguran lisan atau tertulis.",
        "Pelanggaran berulang dapat mengakibatkan pencabutan akses grup komunikasi RT.",
        "Dalam kasus berat, pelanggaran akan dilaporkan ke pemilik kontrakan atau pihak berwajib.",
        "Aturan ini berlaku untuk seluruh warga dan penghuni RT 02 tanpa terkecuali."
      ]
    }
  ];
;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm mt-12">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight mb-4">
          Peraturan Umum <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-cyan-500">TERAS RT 02</span>
        </h2>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">
          Teknologi | Ekraf | Rukun | Aman | Sinergi
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
        <AnimatePresence initial={false}>
          {rules.slice(0, isExpanded ? rules.length : 4).map((rule, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                  {rule.icon}
                </div>
                <h3 className="text-lg font-black text-slate-800 leading-tight">{rule.title}</h3>
              </div>
              <ul className="space-y-3">
                {rule.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </AnimatePresence>

        {!isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white via-white/80 to-transparent z-10 flex items-end justify-center pb-4">
          </div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
        >
          {isExpanded ? (
            <>
              Tampilkan Lebih Sedikit <ChevronUp size={18} />
            </>
          ) : (
            <>
              Baca Selengkapnya <ChevronDown size={18} />
            </>
          )}
        </button>
      </div>

      <div className="mt-12 p-8 bg-gradient-to-br from-indigo-900 to-slate-900 rounded-3xl text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
        <div className="relative z-10">
          <p className="text-indigo-200 font-medium mb-6 max-w-3xl mx-auto leading-relaxed">
            Dengan semangat TERAS RT 02 — Teknologi, Ekraf, Rukun, Aman, Sinergi, mari kita bangun lingkungan Huntap 2 Tondo RT 02 sebagai tempat tinggal yang nyaman, tertib, aman, dan penuh kekeluargaan.
          </p>
          <div className="inline-block text-left bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
            <p className="text-white font-black text-lg mb-1">Ketua RT 02: Irfan</p>
            <p className="text-indigo-200 text-sm mb-1">Alamat: Blok C10 No. 08</p>
            <p className="text-indigo-200 text-sm">WhatsApp: +62 859-6119-4621</p>
          </div>
        </div>
      </div>
    </div>
  );
};
