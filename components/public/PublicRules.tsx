import React, { useState } from 'react';
import { Shield, FileText, Users, Home, AlertTriangle, Trash2, Calendar, Smartphone, Scale, Briefcase, ChevronDown, ChevronUp, Heart, Leaf, Car, ArrowLeft, Search, X, Share2, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const PublicRules: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedRules, setExpandedRules] = useState<Record<string, boolean>>({});
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  
  const categories = [
    { id: 'all', label: 'Semua Peraturan', desc: 'Seluruh tata tertib dan peraturan lingkungan RT 02 Huntap Tondo 2' },
    { id: 'umum', label: 'Umum & Data', desc: 'Administrasi kependudukan, aturan huni, dan digital/privasi' },
    { id: 'ketertiban', label: 'Ketertiban & Sosial', desc: 'Etika keramaian, warga, tamu, hewan peliharaan, dan kerja bakti' },
    { id: 'keamanan', label: 'Keamanan & Parkir', desc: 'Sistem pertahanan sipil, ronda malam, parkir jalan, dan panic button' },
    { id: 'lingkungan', label: 'Lingkungan', desc: 'Pengelolaan bank sampah, sanitasi selokan, dan tanaman pekarangan' },
    { id: 'sanksi', label: 'Sanksi', desc: 'Konsekuensi dan prosedur tindak lanjut pelanggaran' }
  ];

  const rules = [
    {
      title: "Administrasi Kependudukan",
      category: "umum",
      nomorBerkas: "RT2-REG-ADM-01",
      nomorSurat: "Nomor 01 Tahun 2026",
      tentang: "Tata Tertib Administrasi Kependudukan dan Sistem Pendataan Warga Mandiri",
      menimbang: "bahwa untuk menjamin keakuratan basis data kependudukan tingkat rukun tetangga, mempermudah verifikasi layanan administrasi surat pengantar, serta menyelaraskan pendataan berbasis digital di Huntap Tondo 2, diperlukan pedoman pelaporan kependudukan yang sistematis dan terintegrasi.",
      icon: <FileText className="text-indigo-500" size={24} />,
      items: [
        "Setiap warga baru (pemilik kavling, penyewa kontrakan, penghuni rumah keluarga, mahasiswa, maupun pekerja musiman) berkewajiban melakukan pelaporan diri kepada Ketua RT 02 atau pengurus bidang administrasi kependudukan dalam kurun waktu maksimal 1×24 jam terhitung sejak menetap.",
        "Prosedur lapor diri wajib disertai penyerahan salinan identitas diri yang sah, meliputi Kartu Tanda Penduduk Elektronik (KTP-el) dan Kartu Keluarga (KK) guna keperluan registrasi data kependudukan RT 02.",
        "Bagi warga dengan status sewa/kontrak, kos, atau musiman, diwajibkan menyertakan Surat Perjanjian Sewa/Kontrak Rumah, fotokopi identitas pengenal aktif, serta nomor kontak darurat pihak keluarga/wali kandung.",
        "Setiap Kepala Keluarga (KK) wajib mendaftarkan nomor WhatsApp aktif yang digunakan sebagai sarana komunikasi kedinasan resmi dan saluran pengiriman log notifikasi iuran digital pada Aplikasi Teras Warga RT 02.",
        "Warga yang telah terdaftar wajib melengkapi pengisian Formulir Profil Data Warga Mandiri secara daring melalui modul kependudukan Aplikasi Teras Warga paling lambat 7 (tujuh) hari kerja setelah laporan pertama.",
        "Setiap bentuk perubahan status kependudukan (meliputi peristiwa kelahiran anak, pernikahan anggota keluarga, perceraian, kematian, serta kepindahan domisili keluar wilayah RT 02) wajib dilaporkan kepada pengurus RT maksimal 14 (empat belas) hari kerja setelah peristiwa terjadi.",
        "Pelayanan administrasi publik secara tatap muka (fisik) dan penerbitan Surat Pengantar RT dilayani pada hari kerja (Senin s/d Jumat) pukul 19.00 - 21.00 WITA di Sekretariat RT atau diajukan secara daring melalui menu Layanan Publik pada Aplikasi."
      ]
    },
    {
      title: "Ketentuan Tinggal bagi Penyewa Kontrakan",
      category: "umum",
      nomorBerkas: "RT2-REG-HNI-02",
      nomorSurat: "Nomor 02 Tahun 2026",
      tentang: "Ketentuan Hunian dan Prosedur Tinggal bagi Penghuni Sewa/Kontrakan",
      menimbang: "bahwa demi memelihara ketenteraman sosial, mencegah potensi kerawanan keamanan lingkungan, serta mewujudkan kebersamaan yang berkeadilan di lingkungan hunian bersama, perlu diatur tata tertib bagi warga penyewa rumah kontrakan.",
      icon: <Users className="text-emerald-500" size={24} />,
      items: [
        "Warga penyewa rumah/kontrakan wajib menyerahkan Surat Keterangan Huni dari pemilik properti/kavling yang sah pada saat melakukan koordinasi pelaporan diri pertama kepada pengurus RT 02.",
        "Dilarang keras menyewakan kembali (sub-kontrak) sebagian atau seluruh area hunian sewa kepada pihak ketiga tanpa persetujuan tertulis dari pemilik properti dan tanpa sepengetahuan serta izin resmi dari pengurus RT 02.",
        "Setiap penghuni rumah sewa berkewajiban menjunjung tinggi norma hukum, adat istiadat setempat, etika bersosialisasi, toleransi beragama, serta menghormati kenyamanan lingkungan warga sekitar.",
        "Kapasitas hunian untuk masing-masing unit sewa wajib disesuaikan dengan kelayakan fisik bangunan demi menjaga kesehatan lingkungan, kelayakan sanitasi, serta mencegah kepadatan penduduk yang berlebih di satu kavling.",
        "Penyewa atau penghuni kos diwajibkan berpartisipasi aktif dalam kegiatan sosial kemasyarakatan, agenda gotong royong kebersihan, musyawarah RT, serta kegiatan ronda malam siskamling terjadwal (khusus pria dewasa).",
        "Pemilik rumah kontrakan yang berdomisili di luar wilayah RT 02 tetap bertanggung jawab moral atas perilaku penyewa propertinya dan wajib menyerahkan kontak darurat yang aktif kepada pengurus RT untuk koordinasi insidental."
      ]
    },
    {
      title: "Ketentuan Keramaian & Tamu Malam",
      category: "ketertiban",
      nomorBerkas: "RT2-REG-TTR-03",
      nomorSurat: "Nomor 03 Tahun 2026",
      tentang: "Batas Kegiatan Keramaian Lingkungan dan Tata Cara Penerimaan Tamu Malam",
      menimbang: "bahwa untuk melindungi hak istirahat malam warga, mencegah gangguan polusi suara, serta menjaga ketertiban sirkulasi kendaraan warga, perlu ditetapkan ketentuan penyelenggaraan acara keramaian dan jam malam.",
      icon: <Calendar className="text-amber-500" size={24} />,
      items: [
        "Setiap aktivitas hajatan, peringatan hari besar, pertemuan sosial, atau pesta keluarga yang mendatangkan keramaian diizinkan berlangsung dengan batas toleransi waktu maksimal berakhir hingga pukul 23.59 WITA.",
        "Penyelenggaraan kegiatan kemasyarakatan atau acara keluarga berskala besar (undangan melebihi 50 orang) wajib mengajukan surat pemberitahuan resmi tertulis kepada Ketua RT 02 sekurang-kurangnya H-3 sebelum pelaksanaan.",
        "Tingkat kebisingan dari instalasi pengeras suara (sound system) selama acara dibatasi maksimal 80 desibel (dB) dengan posisi speaker diatur menghadap ke dalam area acara guna meminimalkan pantulan gema polusi suara ke rumah tetangga.",
        "Tamu kunjungan dilarang memarkirkan kendaraan di jalur lalu lintas utama warga dan dilarang keras menghalangi akses gerbang/halaman keluar-masuk kediaman tetangga tanpa persetujuan terlebih dahulu.",
        "Tamu luar yang bermaksud menginap melebihi durasi 2×24 jam (2 hari) wajib dilaporkan secara daring melalui aplikasi atau dilaporkan manual kepada pengurus RT oleh kepala keluarga penerima tamu dengan melampirkan identitas tamu.",
        "Pihak penyelenggara acara bertanggung jawab penuh atas pembersihan sisa sampah, pemulihan kebersihan jalan publik, serta ketertiban parkir di sekitar lokasi acara paling lambat 6 (enam) jam setelah acara selesai."
      ]
    },
    {
      title: "Siskamling, Ronda & Tertib Parkir",
      category: "keamanan",
      nomorBerkas: "RT2-REG-KMN-04",
      nomorSurat: "Nomor 04 Tahun 2026",
      tentang: "Penyelenggaraan Sistem Keamanan Ronda Malam dan Ketertiban Parkir Kendaraan",
      menimbang: "bahwa demi meminimalisir ancaman kriminalitas lingkungan, menjaga kelancaran akses evakuasi darurat, serta memastikan keselamatan pejalan kaki di jalan umum, perlu diatur tata cara siskamling dan disiplin parkir.",
      icon: <Shield className="text-rose-500" size={24} />,
      items: [
        "Warga wajib memastikan gerbang pekarangan, pintu utama, serta jendela rumah terkunci rapat pada malam hari, dan segera membunyikan alarm/panic button jika menemukan gerak-gerik mencurigakan di lingkungan.",
        "Dilarang keras memarkirkan kendaraan bermotor roda empat secara paralel di badan jalan utama yang dapat mempersempit ruang gerak armada darurat seperti mobil Ambulans dan Pemadam Kebakaran.",
        "Setiap pemilik kendaraan roda empat (mobil) wajib menyediakan area garasi pribadi yang memadai di dalam batas pekarangan rumah dan dilarang membangun kanopi parkir liar permanen di luar batas bahu jalan.",
        "Warga yang masuk dalam daftar dinas ronda malam wajib hadir tepat waktu di Pos Ronda, atau jika berhalangan dapat mengirimkan pengganti dewasa atau membayar kompensasi ronda sebesar Rp 50.000 via kas RT untuk biaya operasional siskamling.",
        "Batas kecepatan maksimum mengemudikan kendaraan bermotor di area pemukiman RT 02 Huntap Tondo 2 adalah 15 km/jam demi mengutamakan keselamatan anak-anak dan pejalan kaki.",
        "Setiap penyalahgunaan fitur Panic Button pada Aplikasi Teras Warga tanpa adanya kondisi darurat aktual (kemalingan, kebakaran, medis, bencana) akan dikenakan sanksi penangguhan/pembekuan akun digital."
      ]
    },
    {
      title: "Kebersihan & Bank Sampah RT",
      category: "lingkungan",
      nomorBerkas: "RT2-REG-KLG-05",
      nomorSurat: "Nomor 05 Tahun 2026",
      tentang: "Tata Kelola Kebersihan Drainase dan Pengelolaan Sampah Rumah Tangga Terpadu",
      menimbang: "bahwa untuk mewujudkan lingkungan pemukiman yang higienis, bebas banjir, asri, serta mengedukasi warga dalam pemanfaatan program Bank Sampah RT, perlu diatur tata cara pembuangan sampah domestik.",
      icon: <Trash2 className="text-teal-500" size={24} />,
      items: [
        "Setiap rumah tangga diimbau memisahkan sampah secara mandiri sejak dari dapur, memilah antara sampah organik (sisa makanan basah) dan sampah anorganik ekonomis (botol plastik, kardus, kaleng logam).",
        "Penyetoran sampah anorganik bernilai ekonomis dilakukan secara terjadwal melalui Bank Sampah RT 02 Teras Warga untuk ditimbang dan dikonversi menjadi saldo keuangan digital milik masing-masing warga.",
        "Tanggung jawab kebersihan jalan depan, pemotongan rumput liar pekarangan luar, serta pembersihan sedimen lumpur/pasir di saluran selokan depan rumah berada pada penghuni rumah yang bersangkutan.",
        "Dilarang keras membuang sampah plastik, popok bayi, minyak goreng bekas, sisa renovasi beton, atau bahan berbahaya lainnya ke dalam saluran drainase/selokan RT 02.",
        "Sampah rumah tangga harian wajib ditampung di tempat sampah tertutup rapat di dalam pagar pekarangan, dan hanya diletakkan di luar pagar pada pagi hari jadwal pengangkutan armada (Senin dan Kamis).",
        "Tindakan membuang sampah sembarangan atau membakar sampah plastik di halaman terbuka yang menimbulkan asap beracun bagi tetangga akan dikenakan teguran dan sanksi administrasi sosial."
      ]
    },
    {
      title: "Kegiatan Sosial & Iuran RT",
      category: "ketertiban",
      nomorBerkas: "RT2-REG-SOC-06",
      nomorSurat: "Nomor 06 Tahun 2026",
      tentang: "Partisipasi Agenda Gotong Royong Warga dan Kedisiplinan Kas RT",
      menimbang: "bahwa untuk merawat gotong royong, mempererat persaudaraan antar-warga, serta menjamin ketersediaan dana darurat sosial kemanusiaan, perlu diatur kontribusi wajib kerja bakti dan iuran kas RT.",
      icon: <Home className="text-blue-500" size={24} />,
      items: [
        "Setiap Kepala Keluarga (KK) wajib mengirimkan sekurang-kurangnya 1 (satu) perwakilan anggota keluarga dewasa dalam agenda kerja bakti gotong royong massal yang diumumkan pengurus RT.",
        "Warga yang berhalangan hadir pada agenda gotong royong wajib memberikan konfirmasi tertulis/lisan kepada pengurus H-1, atau berkontribusi denda kompensasi kerja bakti sebesar Rp 25.000 yang dimasukkan ke kas sosial RT.",
        "Setiap warga wajib melakukan pembayaran Iuran Bulanan RT sebesar Rp 25.000 secara disiplin paling lambat tanggal 10 setiap bulannya melalui kas digital Aplikasi Teras Warga.",
        "Dana Kas Sosial dan Duka dikelola secara transparan oleh bendahara RT untuk disalurkan sebagai santunan bagi warga yang mengalami kedukaan, musibah bencana, atau menjalani rawat inap di rumah sakit.",
        "Warga diimbau menghadiri forum Musyawarah Warga RT 02 triwulan guna mendiskusikan laporan keuangan kas RT, evaluasi keamanan siskamling, serta penyelarasan program pembangunan sarana fisik lingkungan."
      ]
    },
    {
      title: "Ketentuan Pemeliharaan Hewan",
      category: "ketertiban",
      nomorBerkas: "RT2-REG-PET-07",
      nomorSurat: "Nomor 07 Tahun 2026",
      tentang: "Tata Cara Pemeliharaan Hewan Ternak dan Pengawasan Hewan Peliharaan",
      menimbang: "bahwa untuk menghindari pencemaran sanitasi jalan umum, kebisingan suara hewan, serta menjaga keselamatan fisik warga sekitar, perlu diatur batas kepemilikan dan pemeliharaan hewan peliharaan.",
      icon: <Heart className="text-pink-500" size={24} />,
      items: [
        "Setiap pemilik hewan peliharaan (anjing, kucing, kelinci, burung) berkewajiban melatih dan mengawasi hewannya secara ketat agar tidak menimbulkan polusi suara bising yang konstan (seperti gonggongan berulang) atau bertindak agresif menyerang warga sekitar.",
        "Pemilik hewan peliharaan bertanggung jawab mutlak secara hukum dan moral untuk segera menyiram, membersihkan, dan membuang kotoran hewannya apabila mengotori jalan umum, saluran air drainase, taman bermain bersama, maupun pekarangan rumah tetangga.",
        "Hewan peliharaan dilarang keras dibiarkan berkeliaran bebas di luar batas pekarangan rumah pribadi tanpa menggunakan tali penuntun (leash/harness) serta tanpa pengawasan langsung dari pemilik.",
        "Kandang atau tempat penangkaran hewan wajib ditempatkan di dalam batas pekarangan sendiri dengan jarak yang wajar dari jendela/ventilasi rumah tetangga, serta dibersihkan secara steril setiap hari guna mencegah aroma menyengat.",
        "Pemilik hewan peliharaan (terutama anjing dan kucing) wajib melakukan vaksinasi berkala secara rutin (termasuk vaksin anti-rabies) serta menjaga kebersihan medis hewan guna menghindari penyebaran penyakit menular (zoonosis).",
        "Dilarang memelihara hewan berbahaya atau ras agresif yang tidak dilengkapi sertifikat pelatihan penjinakan di dalam wilayah pemukiman padat RT 02 Huntap Tondo 2 demi keselamatan pejalan kaki dan anak-anak.",
        "Dilarang keras memelihara hewan ternak berskala besar (seperti kambing, sapi, babi) di dalam lingkungan pemukiman padat Huntap karena melanggar fungsi tata ruang tata huni pemukiman. Pemeliharaan unggas (seperti ayam hias/aduan) dibatasi maksimal 5 (lima) ekor per unit kavling dengan kandang yang steril dan kedap bau.",
        "Apabila terjadi perselisihan akibat aduan warga mengenai kebisingan atau aroma tidak sedap dari hewan, pemilik wajib melakukan tindakan korektif (seperti memindahkan posisi kandang atau merawat kebersihan ekstra) dalam waktu maksimal 1×24 jam sejak aduan diterima.",
        "Jika hewan peliharaan terbukti merusak tanaman tetangga, merusak fasilitas publik, atau melukai fisik warga lain, pemilik hewan wajib memikul tanggung jawab perdata penuh atas seluruh biaya ganti rugi perbaikan properti atau biaya pengobatan medis korban hingga sembuh total."
      ]
    },
    {
      title: "Etika Digital & Penggunaan CCTV",
      category: "umum",
      nomorBerkas: "RT2-REG-DIG-08",
      nomorSurat: "Nomor 08 Tahun 2026",
      tentang: "Etika Komunikasi Media Grup Warga, Keamanan Data, dan Pengawasan CCTV Mandiri",
      menimbang: "bahwa untuk mewujudkan ruang interaksi digital warga yang santun, bebas hoaks, serta melindungi privasi data pribadi dan area privat keluarga, perlu disepakati batas etika digital.",
      icon: <Smartphone className="text-violet-500" size={24} />,
      items: [
        "Grup komunikasi resmi (WhatsApp) RT 02 diperuntukkan bagi penyebaran info penting lingkungan, info kedinasan, dan dilarang mengirimkan materi bernada SARA, hoaks, kampanye politik, atau pesan spam komersial.",
        "Dilarang keras menyebarluaskan dokumen identitas pribadi warga lain (seperti KTP, KK, data tunggakan iuran, riwayat surat, aduan pribadi) ke media sosial luar tanpa persetujuan eksplisit pemilik data.",
        "Pemasangan kamera pengawas (CCTV) mandiri di rumah wajib diatur sudut sorotnya agar tidak menembus batas area privat (interior rumah/jendela kamar tidur) milik tetangga tanpa izin tertulis dari tetangga terkait.",
        "Setiap perselisihan sengketa pekarangan atau kesalahpahaman antar-tetangga diutamakan diselesaikan secara damai dan kekeluargaan dengan mengajukan laporan terpadu pada Aplikasi Teras Warga.",
        "Pengguna aplikasi diwajibkan menulis opini, komentar, dan tanggapan di forum digital dengan bahasa yang sopan, santun, konstruktif, serta menghargai perbedaan pendapat."
      ]
    },
    {
      title: "Estetika Fasad & Penghijauan Pekarangan",
      category: "lingkungan",
      nomorBerkas: "RT2-REG-EST-09",
      nomorSurat: "Nomor 09 Tahun 2026",
      tentang: "Tata Estetika Fasad Rumah Hunian, Penghijauan, dan Batas Penyimpanan Material",
      menimbang: "bahwa demi merawat keindahan visual lingkungan Huntap Tondo 2, mencegah sumbatan tiang utilitas umum, serta memelihara kerapian fasad, perlu diatur keasrian pekarangan warga.",
      icon: <Leaf className="text-emerald-500" size={24} />,
      items: [
        "Setiap rumah dihimbau menata minimal 2 (dua) pot tanaman hijau atau bunga hidup di halaman depan guna mewujudkan konsep kawasan Huntap yang teduh, sejuk, asri, dan hijau.",
        "Warga yang menanam pohon rindang wajib memotong dahan/ranting pohonnya secara berkala jika telah menjulur keluar pagar menghalangi penerangan jalan umum, tiang listrik PLN, atau mengganggu lalu lintas.",
        "Penanaman tanaman obat (apotek hidup) di area fasilitas umum diperbolehkan setelah berkoordinasi dan mendapat izin dari kaur pembangunan/lingkungan hidup pengurus RT 02.",
        "Dilarang meletakkan sisa material renovasi berat (pasir, kerikil, semen, besi beton) di bahu jalan umum melebihi batas waktu 14 (empat belas) hari berturut-turut karena mempersempit jalan dan merusak estetika.",
        "Warga berkewajiban merawat kebersihan dinding depan, pagar pekarangan, serta membersihkan lumut tebal pada fasad rumah agar tidak terkesan kumuh atau terbengkalai."
      ]
    },
    {
      title: "Penyelenggaraan Usaha Rumahan",
      category: "umum",
      nomorBerkas: "RT2-REG-ECO-10",
      nomorSurat: "Nomor 10 Tahun 2026",
      tentang: "Tata Kelola Penyelenggaraan Usaha Mikro Rumahan dan Ketertiban Konsumen",
      menimbang: "bahwa untuk mendukung pemulihan ekonomi mandiri warga melalui sektor UMKM rumahan tanpa merugikan ketenangan, kenyamanan istirahat, serta kelancaran lalu lintas tetangga sekitar.",
      icon: <Briefcase className="text-orange-500" size={24} />,
      items: [
        "Aktivitas usaha mikro rumahan (warung kelontong, kuliner, laundry, studio desain, agensi kreatif) diperbolehkan beroperasi dengan syarat bebas polusi suara bising mesin, asap pekat, atau limbah berbahaya.",
        "Pemilik usaha wajib mendaftarkan identitas profil usahanya kepada pengurus RT Bidang Ekraf/UMKM untuk dimasukkan ke Direktori UMKM Digital pada Aplikasi Teras guna perluasan pemasaran.",
        "Pelaku usaha fisik yang melayani pembeli langsung wajib menyediakan area parkir tertib dan mengatur konsumennya agar tidak menimbulkan kemacetan atau menyumbat akses jalan umum.",
        "Batas waktu pelayanan transaksi fisik tatap muka di tempat usaha dibatasi maksimal hingga pukul 22.00 WITA (hari biasa) dan pukul 23.00 WITA (akhir pekan) guna menghargai ketenangan istirahat malam tetangga."
      ]
    },
    {
      title: "Penegakan Sanksi Pelanggaran",
      category: "sanksi",
      nomorBerkas: "RT2-REG-SNC-11",
      nomorSurat: "Nomor 11 Tahun 2026",
      tentang: "Mekanisme Pembinaan Disiplin, Eskalasi SP, Denda Administrasi, dan Penangguhan Layanan",
      menimbang: "bahwa untuk menjamin tegaknya kepatuhan terhadap aturan bersama, memberikan kepastian hukum lingkungan, serta menyelesaikan perselisihan secara adil dan berjenjang.",
      icon: <Scale className="text-slate-500" size={24} />,
      items: [
        "Tahap 1 (Teguran Lisan): Warga yang terbukti melanggar tata tertib akan diberikan pembinaan atau teguran lisan persuasif secara kekeluargaan oleh Kepala Seksi Keamanan dan Ketertiban RT 02.",
        "Tahap 2 (Surat Peringatan Kesatu & Kedua): Jika pelanggaran diabaikan dalam waktu 7 hari sejak teguran lisan, Pengurus RT 02 akan melayangkan Surat Peringatan (SP) tertulis kesatu disusul kedua secara resmi.",
        "Tahap 3 (Denda Administratif & Tindakan Fisik): Pelanggaran parkir jalan darurat atau limbah selokan pasca-SP 2 akan ditindak melalui denda administratif atau pembersihan paksa yang seluruh biayanya dibebankan kepada pelanggar.",
        "Tahap 4 (Penangguhan Layanan Administrasi & Digital): Bagi pelanggar berulang atau menolak sanksi tanpa iktikad baik, Pengurus RT berhak menonaktifkan hak akses kelola digital warga pada aplikasi, serta menangguhkan sementara penerbitan surat pengantar administrasi RT hingga kewajiban dipenuhi.",
        "Tahap 5 (Rujukan ke Pihak Pemerintah & Kepolisian): Jika pelanggaran termasuk kategori tindak pidana, kriminal, atau asusila berat, kasus akan dialihkan dengan koordinasi aktif ke Bhabinkamtibmas, Babinsa, dan jajaran Kelurahan Tondo."
      ]
    }
  ];

  const getBadgeDetails = (cat: string) => {
    switch (cat) {
      case 'umum': return { label: 'Umum & Data', color: 'bg-indigo-50 text-indigo-750 border-indigo-150' };
      case 'ketertiban': return { label: 'Ketertiban', color: 'bg-amber-50 text-amber-750 border-amber-150' };
      case 'keamanan': return { label: 'Keamanan', color: 'bg-rose-50 text-rose-750 border-rose-150' };
      case 'lingkungan': return { label: 'Lingkungan', color: 'bg-teal-50 text-teal-750 border-teal-150' };
      case 'sanksi': return { label: 'Sanksi', color: 'bg-slate-100 text-slate-755 border-slate-250' };
      default: return { label: 'Umum', color: 'bg-slate-50 text-slate-650 border-slate-150' };
    }
  };

  const toggleRule = (title: string) => {
    setExpandedRules(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  React.useEffect(() => {
    let ruleNo = searchParams.get('no');
    let ruleTitle = searchParams.get('rule');

    // Robust Fallback: check manually within window.location.hash
    if (!ruleNo && !ruleTitle) {
      const hashStr = window.location.hash || '';
      const queryIdx = hashStr.indexOf('?');
      if (queryIdx !== -1) {
        const hashQueryParams = new URLSearchParams(hashStr.substring(queryIdx));
        ruleNo = hashQueryParams.get('no');
        ruleTitle = hashQueryParams.get('rule');
      }
    }

    // Secondary Fallback: check standard window.location.search
    if (!ruleNo && !ruleTitle) {
      const standardParams = new URLSearchParams(window.location.search);
      ruleNo = standardParams.get('no');
      ruleTitle = standardParams.get('rule');
    }

    if (ruleNo) {
      const idx = parseInt(ruleNo, 10) - 1;
      if (idx >= 0 && idx < rules.length) {
        setExpandedRules({ [rules[idx].title]: true });
        setTimeout(() => {
          const el = document.getElementById(`rule-card-${rules[idx].title}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    } else if (ruleTitle) {
      const found = rules.find(r => r.title.toLowerCase().includes(ruleTitle.toLowerCase()) || r.nomorSurat.toLowerCase().includes(ruleTitle.toLowerCase()));
      if (found) {
        setExpandedRules({ [found.title]: true });
        setTimeout(() => {
          const el = document.getElementById(`rule-card-${found.title}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [searchParams]);

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    rules.forEach(r => {
      allExpanded[r.title] = true;
    });
    setExpandedRules(allExpanded);
  };

  const collapseAll = () => {
    setExpandedRules({});
  };

  const isRuleExpanded = (ruleTitle: string) => {
    if (searchTerm.trim() !== '') return true;
    return !!expandedRules[ruleTitle];
  };

  const filteredRules = rules.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.items.some(item => item.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          f.tentang.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeCategoryDesc = categories.find(c => c.id === selectedCategory)?.desc || '';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.98, y: 8 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto px-4 py-8 mb-24 font-sans"
    >
      {/* Back Button */}
      <motion.button 
        onClick={() => navigate('/')}
        className="mb-8 flex items-center gap-2 text-slate-500 hover:text-slate-800 text-xs font-black uppercase tracking-wider transition-all bg-slate-50 hover:bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-100 cursor-pointer"
      >
        <ArrowLeft size={16} strokeWidth={2.5} /> Kembali ke Beranda
      </motion.button>

      <div id="rules" className="bg-white rounded-[2.5rem] p-6 md:p-10 border border-slate-100 shadow-xl shadow-slate-100/40">
        {/* Header section with rich design */}
        <div className="text-center mb-12 relative">
          <div className="absolute inset-0 -top-12 -z-10 bg-gradient-to-b from-emerald-50/20 to-transparent rounded-full blur-3xl w-72 h-72 mx-auto" />
          <div className="inline-flex justify-center items-center p-3.5 bg-emerald-50 text-emerald-600 rounded-3xl border border-emerald-100 mb-4 shadow-sm">
            <Scale size={32} strokeWidth={2} />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight mb-4">
            Peraturan Umum <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-indigo-600 font-serif">TERAS RT 02</span>
          </h2>
          <p className="text-slate-400 font-bold tracking-wider text-xs md:text-sm uppercase mb-4">
            Teknologi | Ekraf | Rukun | Aman | Sinergi
          </p>
          <p className="text-slate-500 font-medium max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Demi menjaga keharmonisan, ketertiban, keamanan, dan kebersihan lingkungan Huntap Tondo 2, berikut adalah ketetapan bersama warga RT 02 Huntap Tondo 2 yang diatur secara resmi.
          </p>
        </div>

        {/* Search & Tabs Layout */}
        <div className="space-y-4 mb-8">
          {/* Search Field */}
          <div className="relative">
            <Search size={20} className="absolute left-4.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-slate-50 hover:bg-slate-50/80 focus:bg-white border border-slate-200/60 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 rounded-2xl text-sm outline-none transition-all placeholder:text-slate-400 font-bold text-slate-800 shadow-sm"
              placeholder="Cari kata kunci peraturan... (misal: tamu wajib lapor, jam malam, parkir bising, pilah sampah)"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Categories & Action Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 items-center">
              {categories.map((cat) => {
                const count = rules.filter(f => cat.id === 'all' || f.category === cat.id).length;
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                        setSelectedCategory(cat.id);
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-xs font-black border transition-all flex items-center gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${
                      isActive ? 'bg-slate-800 text-emerald-100' : 'bg-slate-100 text-slate-500'
                    }`}>{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Quick Collapse/Expand Actions */}
            {searchTerm.trim() === '' && (
              <div className="flex items-center gap-2.5">
                <button
                  onClick={expandAll}
                  className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-700 hover:text-emerald-800 rounded-xl text-xs font-bold border border-emerald-100 transition-all cursor-pointer"
                >
                  Buka Semua Pasal
                </button>
                <button
                  onClick={collapseAll}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-700 rounded-xl text-xs font-bold border border-slate-200/60 transition-all cursor-pointer"
                >
                  Tutup Semua
                </button>
              </div>
            )}
          </div>

          {/* Active Category Description */}
          <p className="text-xs text-slate-400 font-medium italic transition-all px-1.5">
            * {activeCategoryDesc}
          </p>
        </div>        {/* Categories Listing Rows (Custom Table Layout) */}
        <div className="space-y-6 relative mt-10">
          
          {/* Header of the Rules Table as in reference screenshot */}
          <div className="flex items-end justify-between border-b-2 border-slate-200/80 pb-3 px-1.5 font-serif mb-6">
            <h3 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-none text-left">
              Peraturan berlaku
            </h3>
            <span className="text-[11px] md:text-xs text-slate-400 font-extrabold tracking-widest uppercase">
              {filteredRules.length} DOKUMEN
            </span>
          </div>

          {/* Table Header Row - Desktop Only */}
          <div className="hidden md:grid md:grid-cols-12 gap-6 px-8 py-3.5 bg-slate-900 text-slate-200 rounded-2xl text-[10px] md:text-xs font-black tracking-widest uppercase mb-4 shadow bg-[#0d1527] items-center text-left">
            <div className="col-span-2 font-serif tracking-[0.15em]">NO. PERATURAN</div>
            <div className="col-span-6 font-serif tracking-[0.15em]">JUDUL</div>
            <div className="col-span-2 text-center font-serif tracking-[0.15em]">KATEGORI</div>
            <div className="col-span-2 text-right font-serif tracking-[0.15em]">BERLAKU</div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredRules.length === 0 ? (
                <motion.div 
                  key="empty-state"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-16 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-500 flex flex-col items-center justify-center p-6"
                >
                  <AlertTriangle size={44} className="text-slate-300 mb-3" />
                  <h4 className="font-bold text-slate-800 text-base mb-1">Peraturan Tidak Ditemukan</h4>
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed font-semibold">
                    Coba gunakan kata kunci pencarian yang lain atau pilih kategori peraturan lainnya.
                  </p>
                </motion.div>
              ) : (
                filteredRules.map((rule) => {
                  const badge = getBadgeDetails(rule.category);
                  const isOpen = isRuleExpanded(rule.title);
                  const originalIndex = rules.findIndex(r => r.title === rule.title);
                  const pasalNumber = originalIndex + 1;
                  const shortRegistry = `0${pasalNumber}/2026`;
                  
                  return (
                    <motion.div 
                      key={rule.title}
                      id={`rule-card-${rule.title}`}
                      layout="position"
                      variants={itemVariants}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={`rounded-3xl border transition-all duration-300 flex flex-col justify-between h-fit group overflow-hidden ${
                        isOpen 
                          ? 'bg-white border-indigo-200 shadow-xl shadow-indigo-950/5' 
                          : 'bg-slate-50/60 border-slate-100 hover:bg-white hover:border-slate-200 hover:shadow shadow-sm'
                      }`}
                    >
                      {/* Interactive Row Container (Fully click-toggleable) */}
                      <div 
                        onClick={() => toggleRule(rule.title)}
                        className="p-5 md:p-6 lg:px-8 cursor-pointer select-none"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-center">
                          
                          {/* No. Peraturan / Kode */}
                          <div className="col-span-1 md:col-span-2 flex md:flex-col items-center md:items-start justify-between md:justify-center border-b md:border-b-0 border-slate-150 pb-2 md:pb-0 mb-1 md:mb-0">
                            <span className="md:hidden text-[9px] font-black text-slate-450 uppercase font-serif tracking-wider">No. Peraturan</span>
                            <div className="text-left font-serif">
                              <p className="text-slate-800 font-extrabold text-sm md:text-base leading-none tracking-tight font-serif">
                                {shortRegistry}
                              </p>
                              <p className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-wide hidden md:block font-mono">
                                {rule.nomorBerkas}
                              </p>
                            </div>
                          </div>

                          {/* Judul & Detail */}
                          <div className="col-span-1 md:col-span-6 flex flex-col gap-1 items-start text-left">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 md:p-2 rounded-xl border transition-all duration-300 shrink-0 ${
                                isOpen 
                                  ? 'bg-indigo-50 border-indigo-100 text-indigo-600 scale-105' 
                                  : 'bg-white border-slate-150 text-slate-500 group-hover:scale-105'
                              }`}>
                                {rule.icon}
                              </div>
                              <h3 className={`text-sm md:text-base font-medium leading-snug transition-colors duration-300 font-serif ${
                                isOpen ? 'text-indigo-900 font-bold' : 'text-slate-800 group-hover:text-indigo-650'
                              }`}>
                                Peraturan Ketua RT 02 Huntap Tondo 2 {rule.nomorSurat} tentang {rule.title}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 px-1">
                              <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider font-sans">
                                Versi 1.0 (Berlaku)
                              </span>
                              <span className="text-slate-300 text-xs font-bold leading-none select-none">•</span>
                              <span className="text-[10px] text-slate-450 font-bold bg-slate-100 px-1.5 py-0.5 rounded font-sans">
                                1 Pasal / {rule.items.length} Ayat
                              </span>
                              {searchTerm.trim() !== '' && (
                                <span className="text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-100 uppercase font-sans">Cocok</span>
                              )}
                            </div>
                          </div>

                          {/* Kategori Badge */}
                          <div className="col-span-1 md:col-span-2 flex md:justify-center items-center justify-between py-1 md:py-0">
                            <span className="md:hidden text-[9px] font-black text-slate-450 uppercase font-serif tracking-wider">Kategori</span>
                            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center font-sans">
                              {badge.label}
                            </span>
                          </div>

                          {/* Berlaku Sejak & Action */}
                          <div className="col-span-1 md:col-span-2 flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-150">
                            <span className="md:hidden text-[9px] font-black text-slate-450 uppercase font-serif tracking-wider">Diberlakukan</span>
                            <div className="flex items-center gap-3">
                              <div className="text-right font-serif hidden md:block">
                                <p className="text-slate-700 font-medium text-xs md:text-sm">
                                  1 Juni 2026
                                </p>
                                <p className="text-[8px] text-emerald-600 font-black tracking-widest uppercase mt-0.5">
                                  SAH & BERLAKU
                                </p>
                              </div>
                              <span className={`p-1.5 rounded-xl border transition-all duration-300 ${
                                isOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-600 rotate-180' : 'bg-white border-slate-200 text-slate-450'
                              }`}>
                                <ChevronDown size={14} strokeWidth={2.5} />
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Expanded Panel (Official Decree Document Presentation) */}
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0, marginTop: 0 }}
                              animate={{ height: "auto", opacity: 1, marginTop: 24 }}
                              exit={{ height: 0, opacity: 0, marginTop: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden border-t border-slate-100 pt-8 text-left"
                            >
                              {/* Share Box precisely modeled after target UI */}
                              <div className="max-w-2xl mx-auto mb-6 bg-[#fbf9f4] rounded-2xl p-5 border border-amber-800/10 shadow-sm space-y-3 font-sans">
                                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                                  <span>DAFTAR PERATURAN</span>
                                  <span>/</span>
                                  <span className="text-amber-800 font-extrabold">{rule.nomorSurat.toUpperCase()}</span>
                                </div>
                                
                                <div className="p-4 bg-white/95 rounded-xl border border-slate-200/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <div className="space-y-1 my-1 flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-slate-800 font-extrabold text-sm font-serif">
                                      <Share2 size={15} className="text-amber-700 shrink-0" />
                                      <span>Bagikan peraturan ini</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-mono break-all font-medium select-all">
                                      {window.location.origin}/#/rules?no={pasalNumber}
                                    </p>
                                  </div>
                                  
                                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const shareUrl = `${window.location.origin}/#/rules?no=${pasalNumber}`;
                                        navigator.clipboard.writeText(shareUrl);
                                        setCopiedStates(prev => ({ ...prev, [rule.title]: true }));
                                        setTimeout(() => {
                                          setCopiedStates(prev => ({ ...prev, [rule.title]: false }));
                                        }, 2000);
                                      }}
                                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm transition-all duration-150 focus:outline-none"
                                    >
                                      {copiedStates[rule.title] ? (
                                        <>
                                          <Check size={14} className="text-emerald-600 animate-bounce" />
                                          <span className="text-emerald-700 font-semibold">Tersalin</span>
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={14} className="text-slate-400" />
                                          <span>Salin tautan</span>
                                        </>
                                      )}
                                    </button>
                                    
                                    <a
                                      href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`🚨 *Peraturan Resmi RT 02 Huntap Tondo 2*\n\nNaskah Ketentuan: *Peraturan ${rule.nomorSurat} tentang ${rule.title}*\n\nSilakan baca selengkapnya pada platform Teras Warga RT 02:\n${window.location.origin}/%23/rules?no=${pasalNumber}`)}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#20ba59] active:bg-[#1ca34d] text-white font-bold text-xs rounded-xl shadow-sm transition-all duration-150 focus:outline-none"
                                    >
                                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                                        <path d="M12.004 2c-5.523 0-10 4.477-10 10a9.96 9.96 0 0 0 1.516 5.253L2 22l4.915-1.285A9.957 9.957 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10zm5.666 14.195c-.244.688-1.22 1.254-1.688 1.309-.465.056-.913.256-2.936-.554-2.576-1.03-4.218-3.66-4.346-3.832-.128-.172-1.042-1.39-1.042-2.651s.66-1.879.894-2.128c.234-.25.511-.312.682-.312s.34.004.489.012c.153.008.358-.058.553.414.2.484.682 1.671.741 1.792.059.12.098.261.018.421-.08.159-.12.261-.24.402-.12.14-.251.312-.358.421-.12.12-.244.25-.104.489.14.238.623 1.027 1.336 1.66.918.812 1.691 1.062 1.933 1.183.243.12.386.101.527-.062.141-.164.6-1.004.75-.141s.3.238.64.406c.343.17.683.342.853.421.17.08.283.12.441-.141z"/>
                                      </svg>
                                      <span>Bagikan via WhatsApp</span>
                                    </a>
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const shareUrl = `${window.location.origin}/#/rules?no=${pasalNumber}`;
                                        if (navigator.share) {
                                          navigator.share({
                                            title: `Peraturan RT 02 - ${rule.nomorSurat}`,
                                            text: `Silakan baca dokumen keputusan resmi: Peraturan Ketua RT 02 Huntap Tondo 2 ${rule.nomorSurat} tentang ${rule.title}.`,
                                            url: shareUrl,
                                          }).catch(err => console.log(err));
                                        } else {
                                          const subject = encodeURIComponent(`Bagi Peraturan RT 02: ${rule.nomorSurat}`);
                                          const body = encodeURIComponent(`Silakan periksa dokumen keputusan resmi Peraturan Ketua RT 02 Huntap Tondo 2 ${rule.nomorSurat} tentang ${rule.title} di tautan berikut:\n\n${shareUrl}`);
                                          window.location.href = `mailto:?subject=${subject}&body=${body}`;
                                        }
                                      }}
                                      className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm transition-all duration-150 focus:outline-none"
                                    >
                                      <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-2 shrink-0" viewBox="0 0 24 24">
                                        <circle cx="18" cy="5" r="3" />
                                        <circle cx="6" cy="12" r="3" />
                                        <circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                                        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                      </svg>
                                      <span>Bagikan...</span>
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Parchment/Legal Document Wrapper */}
                              <div className="bg-slate-50/50 rounded-[2rem] border border-slate-200/80 p-4 md:p-8 space-y-6 shadow-inner relative overflow-hidden">
                                
                                {/* Background watermark effect */}
                                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.02),transparent)] pointer-events-none" />

                                {/* Document header */}
                                <div className="text-center font-serif space-y-2">
                                  <p className="text-[10px] md:text-xs tracking-[0.25em] text-slate-400 uppercase font-bold">
                                    DALAM HAL {rule.category.toUpperCase()} LINGKUNGAN
                                  </p>
                                  <p className="text-sm md:text-base tracking-[0.15em] text-indigo-950 font-black uppercase">
                                    RUKUN TETANGGA 02 HUNTAP TONDO 2 KELURAHAN TONDO
                                  </p>
                                  <p className="text-[9px] md:text-xs tracking-[0.1em] text-slate-400 font-bold uppercase">
                                    KECAMATAN MANTIKULORE · KOTA PALU
                                  </p>
                                  
                                  <div className="py-4 justify-center flex">
                                    <div className="border border-slate-800 px-6 py-1 bg-white text-[11px] md:text-xs tracking-[0.25em] uppercase font-semibold text-slate-800 shadow-sm">
                                      PERATURAN RESMI
                                    </div>
                                  </div>
                                  
                                  <h4 className="text-base md:text-xl font-bold font-serif text-slate-900 leading-normal max-w-3xl mx-auto">
                                    Peraturan Ketua RT 02 Huntap Tondo 2 {rule.nomorSurat} <br />
                                    <span className="text-slate-500 font-semibold italic text-sm md:text-base block mt-2">tentang {rule.tentang}</span>
                                  </h4>
                                </div>

                                {/* Metadata list table */}
                                <div className="max-w-xl mx-auto my-6 grid grid-cols-2 gap-y-2.5 gap-x-4 text-left font-serif text-xs border-y border-dashed border-slate-300 py-4 px-3 bg-white/70 backdrop-blur-sm rounded-2xl shadow-sm">
                                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">PENOMERAN</div>
                                  <div className="text-slate-800 font-bold">{rule.nomorSurat}</div>
                                  
                                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">NOMOR BERKAS</div>
                                  <div className="text-slate-850 font-mono font-bold text-[11px] text-indigo-700">{rule.nomorBerkas}</div>
                                  
                                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">KLASIFIKASI</div>
                                  <div className="text-slate-800 font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    {badge.label}
                                  </div>
                                  
                                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">SIFAT REVISI</div>
                                  <div className="text-slate-800 font-bold">Naskah Asli (Belum Direvisi)</div>
                                  
                                  <div className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">BERLAKU SEJAK</div>
                                  <div className="text-slate-800 font-bold">1 Juni 2026</div>
                                </div>

                                {/* Elegant Divider */}
                                <div className="h-0.5 bg-slate-850 w-full" />

                                {/* Command declaration */}
                                <div className="text-center font-serif py-3 px-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                  <p className="text-[10px] md:text-xs font-bold tracking-wider text-slate-500 uppercase leading-relaxed">
                                    BERIKUT ADALAH PASAL TATA TERTIB YANG TELAH DI SEPAKATI DALAM MUSYAWARAH WARGA RT 02 HUNTAP TONDO 2 KELURAHAN TONDO.
                                  </p>
                                </div>

                                {/* "Menimbang" Section */}
                                <div className="text-left font-serif space-y-3 my-6">
                                  <h5 className="font-extrabold text-slate-850 text-[11px] md:text-xs tracking-[0.2em] text-slate-400 uppercase font-mono border-b border-slate-200 pb-1.5">Menimbang:</h5>
                                  <div className="border-l-4 border-amber-500/80 pl-4">
                                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed italic text-justify">
                                      {rule.menimbang}
                                    </p>
                                  </div>
                                </div>

                                {/* "Mengingat" Section */}
                                <div className="text-left font-serif space-y-3 my-6">
                                  <h5 className="font-extrabold text-slate-850 text-[11px] md:text-xs tracking-[0.2em] text-slate-400 uppercase font-mono border-b border-slate-200 pb-1.5">Mengingat:</h5>
                                  <div className="border-l-4 border-indigo-500/80 pl-4">
                                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed italic text-justify">
                                      bahwa Rukun Tetangga (RT) 02 Huntap Tondo 2 Kelurahan Tondo berwenang mengatur ketertiban, kebersihan, dan kerukunan bersama di tingkat lingkungan demi mewujudkan asas TERAS (Teknologi, Ekraf, Rukun, Aman, Sinergi) serta keasrian hunian warga.
                                    </p>
                                  </div>
                                </div>

                                {/* "Pasal" (Single Pasal 1 container containing all sub-clauses in the document) */}
                                <div className="space-y-4 font-serif text-left pt-2">
                                  <div className="bg-white/95 rounded-2xl border border-slate-200/95 p-5 md:p-6 space-y-5 shadow-sm">
                                    <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                                      <h6 className="font-extrabold text-indigo-950 text-xs md:text-sm uppercase tracking-[0.2em] font-serif">PASAL 1 — {rule.title.toUpperCase()}</h6>
                                      <span className="text-[9px] md:text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-150 uppercase tracking-widest leading-none">Salinan Dokumen</span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                      {rule.items.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-start p-3 hover:bg-slate-50/50 rounded-xl transition-colors duration-150">
                                          <div className="text-xs md:text-sm font-bold text-indigo-700 w-6 shrink-0 text-right font-serif">
                                            {idx + 1}.
                                          </div>
                                          <div className="text-xs md:text-sm text-slate-700 leading-relaxed text-justify space-y-1 flex-1 font-serif">
                                            <p className="font-semibold text-slate-700">
                                              {idx === 0 && <span className="font-extrabold text-slate-900 tracking-wider mr-2 uppercase">MEMUTUSKAN:</span>}
                                              {item}
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Signature, Disclaimer & Back action section from reference */}
                                <div className="pt-8 pb-3 flex flex-col items-center justify-center space-y-6 font-serif max-w-2xl mx-auto border-t border-dashed border-slate-350">
                                  <p className="text-[11px] md:text-xs text-slate-500 text-justify md:text-center leading-relaxed italic px-2">
                                    Dokumen ini merupakan peraturan resmi RT 02 Huntap Tondo 2 sebagaimana disahkan pengurus RT.
                                    Pelanggaran dapat ditindaklanjuti melalui musyawarah lingkungan dan koordinasi dengan pihak terkait sesuai ketentuan yang berlaku.
                                  </p>
                                  
                                  <div className="pt-2 flex flex-col items-center space-y-2">
                                    <div className="w-56 h-[1.5px] bg-slate-450" />
                                    <p className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-slate-750 uppercase pt-1 text-center">
                                      KETUA RT 02 HUNTAP TONDO 2
                                    </p>
                                  </div>

                                  <div className="pt-4 text-center">
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleRule(rule.title);
                                      }}
                                      className="text-xs md:text-sm font-semibold text-indigo-700 hover:text-indigo-950 transition-all duration-250 focus:outline-none flex items-center justify-center gap-1.5 mx-auto font-serif border-b border-dashed border-indigo-700/40 hover:border-indigo-950 pb-0.5"
                                    >
                                      ← Kembali ke daftar peraturan
                                    </button>
                                  </div>
                                </div>

                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Footer Toggle Accordion Trigger bar */}
                      <div 
                        onClick={() => toggleRule(rule.title)}
                        className={`px-6 py-2.5 border-t text-[10px] md:text-xs font-black flex items-center justify-between cursor-pointer transition-colors duration-300 ${
                          isOpen 
                            ? 'bg-indigo-50/20 border-indigo-105 text-indigo-700 hover:bg-indigo-50' 
                            : 'bg-slate-50/30 border-slate-100/60 text-slate-500 hover:text-indigo-600 hover:bg-white'
                        }`}
                      >
                        <span className="font-serif italic tracking-wide">{isOpen ? "Tutup kembali lembar keputusan peraturan" : "Lihat salinan resmi & isi naskah keputusan"}</span>
                        <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`} />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer info banner */}
        <div className="mt-12 p-8 bg-gradient-to-br from-indigo-900 via-slate-900 to-[#041410] rounded-[2.5rem] text-center relative overflow-hidden shadow-lg shadow-indigo-950/25">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
          <div className="relative z-10 space-y-6">
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black text-[10px] uppercase tracking-widest px-3.5 py-1.5 rounded-full">
              Keluarga Besar RT 02
            </span>
            <p className="text-indigo-100 font-medium max-w-3xl mx-auto leading-relaxed text-sm md:text-base">
              Dengan semangat TERAS RT 02 — Teknologi, Ekraf, Rukun, Aman, Sinergi, mari kita bangun lingkungan Huntap Tondo 2 RT 02 sebagai tempat tinggal yang nyaman, tertib, aman, dan penuh kekeluargaan.
            </p>
            <div className="inline-block text-left bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 shadow-md">
              <p className="text-white font-black text-lg mb-1">Ketua RT 02: Irfan</p>
              <p className="text-indigo-200 text-sm mb-1">Alamat: Blok C10 No. 08</p>
              <p className="text-indigo-200 text-sm">WhatsApp: +62 859-6119-4621</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
