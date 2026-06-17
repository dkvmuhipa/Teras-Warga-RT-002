import React from 'react';
import { House, PaymentStatus, Announcement, UMKM, Report, LetterRequest, RondaSchedule, CashFlow, Official, PdfConfig, InventoryItem, Poll, RondaCheckLog, MarketItem, GalleryItem, Checkpoint, FAQItem, Document, Bill, AppEvent, MapPoint, WastePrice } from './types';
import { Home, Users, TreePine } from 'lucide-react';

export const APP_NAME = "TERAS";
export const RT_NAME = "RT 02";
export const RW_NAME = "RW 020";
export const FULL_RT_NAME = `${RT_NAME} ${RW_NAME}`;
export const ADMIN_ROLE = "Admin Utama";
export const ADMIN_TITLE = "Ketua RT 02";
export const ADMIN_EMAIL = "admin@teras.id";
export const DEFAULT_DUES_AMOUNT = 25000;
export const CURRENCY_SYMBOL = "Rp";

// Updated Address per Letter Reference
export const RT_ADDRESS = "Jl. Pue Lombe Blok C10-08 Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu";

// --- LOGO CONFIGURATION ---
// Replace the empty string with your logo URL (e.g., "https://yourdomain.com/logo.png")
export const LOGO_URL = "/logo-rt.svg"; 

// --- LOGO COMPONENT ---
export const Logo = ({ className = "", iconSize = 24, imageSize = "h-10", showText = true, dark = false }) => {
  const textColor = dark ? "text-white" : "text-slate-800";
  const subTextColor = dark ? "text-slate-400" : "text-brand-blue";
  const imageFilter = dark ? "brightness-0 invert" : "";

  if (LOGO_URL) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <img 
          src={LOGO_URL} 
          alt={APP_NAME} 
          className={`${imageSize} w-auto object-contain ${imageFilter}`} 
          referrerPolicy="no-referrer"
        />
        {showText && (
          <span className={`font-bold text-xl tracking-tight ${textColor}`}>
            {APP_NAME} <span className={subTextColor}>{RT_NAME}</span>
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 font-bold text-xl tracking-tight ${textColor} ${className}`}>
      <div className="bg-brand-blue text-white p-1.5 rounded-lg shrink-0">
        <Home size={iconSize} />
      </div>
      {showText && (
        <span className="flex items-center gap-1">
            {APP_NAME} <span className={subTextColor}>{RT_NAME}</span>
        </span>
      )}
    </div>
  );
};

// --- DATA DUMMY (MOCK DATA) ---

export const generateHouses = (): House[] => {
  const blockConfig = [
    { code: 'C5', start: 1, end: 26 },
    { code: 'C7', start: 1, end: 18 },
    { code: 'C8', start: 1, end: 18 },
    { code: 'C9', start: 1, end: 18 },
    { code: 'C10', start: 1, end: 16 },
    { code: 'C11', start: 1, end: 18 },
    { code: 'C12', start: 1, end: 15 },
  ];

  const houses: House[] = [];
  
  blockConfig.forEach(config => {
    for (let i = config.start; i <= config.end; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      const statusRandom = Math.random();
      let status: House['status'] = 'Occupied';
      
      if (statusRandom > 0.85) status = 'Empty';
      else if (statusRandom > 0.95) status = 'Business';

      const isRenter = Math.random() > 0.8;
      const randomSuffix = Array(4).fill(0).map(() => Math.floor(Math.random()*36).toString(36).toUpperCase()).join('');
      const accessCode = `${config.code}-${number}-${randomSuffix}`;

      // Helper for random status
      const getRandStatus = () => Math.random() > 0.3 ? PaymentStatus.PAID : (Math.random() > 0.5 ? PaymentStatus.PENDING : PaymentStatus.UNPAID);

      const educations = ['SD', 'SMP', 'SMA', 'D3', 'S1', 'S2'];
      const jobs = ['PNS', 'Karyawan Swasta', 'Wiraswasta', 'Buruh', 'IRT', 'Mahasiswa', 'Pensiunan'];
      const religions = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Budha', 'Konghucu'];
      
      const occupants = status === 'Empty' ? 0 : Math.floor(Math.random() * 5) + 1;
      const hasElderly = occupants > 2 && Math.random() > 0.7;
      const hasBaby = occupants > 1 && Math.random() > 0.8;
      const hasToddler = occupants > 1 && Math.random() > 0.7;

      houses.push({
        id: `${config.code}-${number}`,
        block: config.code,
        number: number,
        headOfFamily: status === 'Empty' ? '-' : `Warga ${config.code}-${number}`,
        occupants,
        status,
        residenceType: status === 'Occupied' ? (isRenter ? 'Sewa' : 'Tetap') : 'Tetap',
        paymentStatusAir: getRandStatus(),
        paymentStatusSampah: getRandStatus(),
        phone: status !== 'Empty' ? `0812-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        accessCode: accessCode,
        education: status === 'Occupied' ? educations[Math.floor(Math.random() * educations.length)] : undefined,
        jobCategory: status === 'Occupied' ? jobs[Math.floor(Math.random() * jobs.length)] : undefined,
        religion: status === 'Occupied' ? religions[Math.floor(Math.random() * religions.length)] : undefined,
        gender: status === 'Occupied' ? (Math.random() > 0.5 ? 'Laki-laki' : 'Perempuan') : undefined,
        vehicleCount: status === 'Occupied' ? Math.floor(Math.random() * 3) : 0,
        babyCount: hasBaby ? 1 : 0,
        toddlerCount: hasToddler ? 1 : 0,
        elderlyCount: hasElderly ? 1 : 0,
        pregnantCount: status === 'Occupied' && Math.random() > 0.9 ? 1 : 0,
        widowCount: status === 'Occupied' && Math.random() > 0.9 ? 1 : 0,
        teenagerCount: occupants > 3 ? 1 : 0
      });
    }
  });
  return houses;
};

export const INITIAL_OFFICIALS: Official[] = [
    { id: '1', role: 'Ketua RT', name: 'Bpk. IRFAN ARIANTO', houseId: 'C10-08', phone: '+62 859-6119-4621' }, 
    { id: '2', role: 'Sekretaris', name: 'Ibu Siti Aminah', houseId: 'C5-02', phone: '+62 812-9876-5432' },
    { id: '3', role: 'Bendahara', name: 'Bpk. Rudi Hartono', houseId: 'C11-12', phone: '+62 813-4567-8901' },
    { id: '4', role: 'Koord. Keamanan', name: 'Bpk. Joko Susilo', houseId: 'C8-05', phone: '+62 813-1122-3344' },
    { id: '5', role: 'Bendahara RW', name: 'Ibu Haryati', houseId: 'C9-10', phone: '+62 813-9988-7766' },
];

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Kerja Bakti Lingkungan',
    content: 'Minggu ini akan diadakan kerja bakti membersihkan saluran air di area Blok C7 dan C8. Diharapkan kehadiran bapak-bapak.',
    date: '2023-10-25',
    type: 'General'
  },
  {
    id: '2',
    title: 'Waspada Demam Berdarah',
    content: 'Mohon warga rutin menguras bak mandi dan menutup penampungan air. Sudah ada 1 kasus di blok C5.',
    date: '2023-10-20',
    type: 'Urgent'
  }
];

export const MOCK_EVENTS: AppEvent[] = [
  {
    id: '1',
    title: 'Kerja Bakti',
    description: 'Membersihkan selokan dan jalan utama',
    date: '2026-03-15',
    location: 'Area Blok C',
    attendees: ['C10-01', 'C10-02']
  },
  {
    id: '2',
    title: 'Rapat Warga',
    description: 'Pembahasan iuran bulanan',
    date: '2026-03-20',
    location: 'Pos Ronda',
    attendees: []
  }
];

export const MOCK_UMKM: UMKM[] = [
  {
    id: '1',
    name: 'Warung Nasi Kuning Bu Ani',
    owner: 'Ibu Ani',
    category: 'Kuliner',
    description: 'Nasi kuning khas Palu, tersedia mulai jam 6 pagi. Menerima pesanan katering.',
    contact: '6285961194621',
    image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&q=80&w=300&h=200'
  }
];

export const INITIAL_REPORTS: Report[] = [];
export const INITIAL_LETTERS: LetterRequest[] = [];

export const MOCK_RONDA: RondaSchedule[] = [
  { day: 'Senin', members: ['Bpk. Asep (C5-01)', 'Bpk. Budi (C5-02)', 'Bpk. Cecep (C5-03)'] },
  { day: 'Selasa', members: ['Bpk. Dedi (C7-01)', 'Bpk. Eko (C7-02)', 'Bpk. Fajar (C7-03)'] },
  { day: 'Rabu', members: ['Bpk. Gilang (C8-01)', 'Bpk. Hadi (C8-02)', 'Bpk. Indra (C8-03)'] },
  { day: 'Kamis', members: ['Bpk. Joko (C9-01)', 'Bpk. Kiki (C9-02)', 'Bpk. Lukman (C9-03)'] },
  { day: 'Jumat', members: ['Bpk. Maman (C10-01)', 'Bpk. Nanda (C10-02)', 'Bpk. Opik (C10-03)'] },
  { day: 'Sabtu', members: ['Bpk. Purnomo (C11-01)', 'Bpk. Qodir (C11-02)', 'Bpk. Rahmat (C11-03)'] },
  { day: 'Minggu', members: ['Bpk. Syaiful (C12-01)', 'Bpk. Tono (C12-02)', 'Bpk. Ujang (C12-03)'] },
];

export const CHECKPOINTS: Checkpoint[] = [
    { id: 'cp1', name: 'Gerbang Utama', qrCode: 'GERBANG_UTAMA_RT02', x: 5, y: 50 },
    { id: 'cp2', name: 'Pos Satpam', qrCode: 'POS_SATPAM_RT02', x: 10, y: 50 },
    { id: 'cp3', name: 'Blok C5', qrCode: 'BLOK_C5_RT02', x: 25, y: 20 },
    { id: 'cp4', name: 'Blok C10', qrCode: 'BLOK_C10_RT02', x: 75, y: 20 },
    { id: 'cp5', name: 'Masjid Al-Ikhlas', qrCode: 'MASJID_RT02', x: 85, y: 85 },
];

export const MOCK_MAP_POINTS: MapPoint[] = [
    { id: 'mp1', label: 'Gerbang Utama', type: 'Gate', x: 5, y: 50, icon: 'Move' },
    { id: 'mp2', label: 'Pos Satpam', type: 'Security', x: 10, y: 50, icon: 'Shield' },
    { id: 'mp3', label: 'APAR Blok C5', type: 'APAR', x: 25, y: 20, icon: 'Flame' },
    { id: 'mp4', label: 'Titik Kumpul Lapangan', type: 'AssemblyPoint', x: 50, y: 50, icon: 'Users' },
    { id: 'mp5', label: 'Jalur Evakuasi Utara', type: 'EvacuationRoute', x: 50, y: 10, icon: 'ArrowRight' },
    { id: 'mp6', label: 'Masjid Al-Ikhlas', type: 'Facility', x: 85, y: 85, icon: 'MapPin', facilityInfo: 'Masjid utama warga RT 02, berlokasi di sisi timur jalur alternatif. Digunakan untuk shalat berjamaah dan kegiatan keagamaan warga.' },
];

export const MOCK_CASHFLOW: CashFlow[] = [
    { id: '1', date: '2023-10-01', description: 'Iuran Warga Blok C5', amount: 500000, type: 'Income', category: 'Iuran Warga' },
    { id: '2', date: '2023-10-02', description: 'Perbaikan Lampu Jalan C10', amount: 150000, type: 'Expense', category: 'Fasilitas' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
    { id: '1', name: 'Tenda Terpal 4x6', total: 2, available: 2, condition: 'Baik', category: 'Perlengkapan Acara' },
];

export const MOCK_POLLS: Poll[] = [];
export const MOCK_MARKET_ITEMS: MarketItem[] = [];
export const MOCK_RONDA_LOGS: RondaCheckLog[] = [];
export const MOCK_GALLERY: GalleryItem[] = [
  { id: '1', title: 'Kerja Bakti Blok C', image: 'https://images.unsplash.com/photo-1558036117-15db5275d42b?auto=format&fit=crop&q=80', date: '2023-10-25' },
  { id: '2', title: 'Rapat Warga Bulanan', image: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?auto=format&fit=crop&q=80', date: '2023-10-01' },
  { id: '3', title: 'Lomba 17 Agustus', image: 'https://images.unsplash.com/photo-1530021232320-687d8e3dba54?auto=format&fit=crop&q=80', date: '2023-08-17' },
  { id: '4', title: 'Posyandu Balita', image: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80', date: '2023-09-15' },
];

export const MOCK_FAQ: FAQItem[] = [
  { 
    id: '1', 
    category: 'layanan',
    question: 'Bagaimana cara mengurus surat pengantar RT secara online?', 
    answer: 'Warga dapat mengajukan surat pengantar secara online melalui menu "Layanan Digital" di aplikasi ini. Caranya sangat praktis: Pilih kategori layanan "Persuratan", tentukan jenis surat yang dibutuhkan (misalnya Surat Pengantar KTP, Kartu Keluarga, Keterangan Domisili, atau Keterangan Kematian), lalu isi data formulir yang diperlukan secara lengkap. Setelah dikirim, Admin RT atau Sekretaris akan memverifikasi dan menandatangani dokumen secara digital menggunakan tanda tangan elektronik resmi RT 02. Dokumen yang telah disetujui akan meluncur langsung ke galeri dokumen warga Anda dan dapat diunduh (format PDF) atau dicetak secara mandiri tanpa perlu bertamu langsung ke rumah Ketua RT.' 
  },
  { 
    id: '2', 
    category: 'lingkungan',
    question: 'Kapan jadwal pembuangan dan pengambilan sampah rutin dilakukan?', 
    answer: 'Pengambilan sampah domestik rumah tangga non-B3 (sampah dapur/basah) dilakukan rutin setiap hari Senin, Rabu, dan Jumat pagi mulai jam 07:00 hingga 10:00 oleh petugas kebersihan dinas lingkungan hidup. Warga diimbau untuk membungkus sampah dengan rapat di dalam kantong plastik hitam tebal sebelum menaruhnya di tong sampah depan rumah masing-masing demi mencegah bau menyengat dan gangguan hewan liar.' 
  },
  { 
    id: '3', 
    category: 'lingkungan',
    question: 'Apa itu program Bank Sampah RT 02 dan bagaimana saya bisa berpartisipasi?', 
    answer: 'Bank Sampah adalah program kepedulian lingkungan bernilai ekonomi tinggi di RT 02. Warga dapat menyetorkan sampah kering yang telah dipilah dari rumah (seperti botol plastik, kertas karton bekas, kaleng logam, koran, dan minyak jelantah) ke Pos Bank Sampah setiap hari Sabtu pagi mulai pukul 08:00 hingga 11:30. Sampah yang Anda setorkan akan ditimbang, dihargai sesuai daftar harga pasar yang update di aplikasi, dan nominalnya langsung masuk ke saldo tabungan digital Bank Sampah Anda di aplikasi ini. Tabungan tersebut dapat ditarik tunai atau digunakan untuk potongan iuran bulanan RT!' 
  },
  { 
    id: '4', 
    category: 'iuran',
    question: 'Bagaimana rincian pembayaran iuran bulanan dan pengelolaannya?', 
    answer: 'Iuran rutin warga RT 02 terdiri dari tiga pos utama: Iuran Sampah (Rp 25.000/bulan untuk operasional truk kebersihan), Iuran Keamanan/Ronda (Rp 15.000/bulan untuk perawatan alat pos kamling dan kegiatan ronda), serta Iuran Kas RT (Rp 10.000/bulan untuk dana sosial, santunan duka, dan perawatan fasilitas umum). Total tagihan bulanan adalah Rp 50.000. Untuk kenyamanan warga, rincian pembayaran masing-masing rumah, status tunggakan, serta pembukuan keluar-masuk kas RT dapat dipantau sepenuhnya secara transparan melalui menu "Transparansi Keuangan".' 
  },
  { 
    id: '5', 
    category: 'keamanan',
    question: 'Apakah tamu yang menginap wajib dilaporkan ke Ketua RT?', 
    answer: 'Ya, betul sekali. Demi menjaga ketertiban dan keamanan lingkungan bersama, tamu luar kota yang menginap di rumah warga lebih dari 1x24 jam wajib dilaporkan. Pelaporan kini sangat mudah, Anda tidak perlu lagi menemui Ketua RT secara fisik di malam hari; cukup isi formulir digital singkat pada menu "Lapor Tamu" dengan memasukkan nama tamu, hubungan keluarga, nomor kontak, foto identitas/KTP tamu, serta estimasi lama menginap. Informasi ini otomatis akan tersinkronisasi ke sistem pengurus serta regu ronda malam yang bertugas.' 
  },
  { 
    id: '6', 
    category: 'keamanan',
    question: 'Di mana saya bisa melihat jadwal Ronda malam dan aktivitas patroli?', 
    answer: 'Jadwal ronda malam dapat dilihat pada menu "Keamanan & Ronda" di aplikasi. Jadwal ini diupdate secara berkala oleh Koordinator Lapangan Keamanan. Warga juga bisa memantau jalannya ronda dan aktivitas patroli petugas secara real-time melalui log patroli digital yang terintegrasi dengan pemindaian barcode pos pos keamanan.' 
  },
  { 
    id: '7', 
    category: 'sosial',
    question: 'Bagaimana syarat mendaftarkan usaha lokal saya ke bursa UMKM RT 02?', 
    answer: 'Bursa UMKM adalah etalase digital gratis khusus bagi warga RT 02 yang memiliki usaha kuliner, jasa, fesyen, jualan kelontong, atau kerajinan tangan. Anda dapat mendaftarkan usaha secara mandiri di menu "UMKM RT 02". Masukkan nama toko, nama pemilik, unggah foto produk unggulan, harga estimasi, deskripsi singkat usaha, serta nomor WhatsApp pemesanan Anda. Admin RT akan memverifikasi dalam 1x24 jam untuk meluncurkan produk Anda ke dalam katalog umum yang dapat diakses oleh seluruh warga tetangga demi meningkatkan pertumbuhan ekonomi lokal.' 
  },
  { 
    id: '8', 
    category: 'keamanan',
    question: 'Bagaimana cara kerja "Tombol Panic" (Darurat) di aplikasi?', 
    answer: 'Tombol Darurat (Panic Button) adalah fitur prioritas keselamatan di aplikasi TERAS RT 02. Jika Anda menemui keadaan darurat (seperti kebakaran, kemalingan, ancaman keamanan fisik, atau serangan medis akut), silakan tekan tombol ini selama 3 detik. Aplikasi akan langsung memicu sirine darurat di HP seluruh pengurus RT serta menyebarkan notifikasi push instan yang memuat nama Anda, nomor rumah, dan jenis kedaruratan. Petugas ronda terdekat dan pengurus RT akan segera meluncur ke lokasi Anda untuk memberikan pertolongan pertama.' 
  },
  { 
    id: '9', 
    category: 'layanan',
    question: 'Apa saja berkas yang harus saya unggah untuk verifikasi data warga resmi?', 
    answer: 'Untuk melakukan verifikasi keanggotaan warga resmi RT 02, Anda dapat mengunjungi profil akun Anda di aplikasi ini lalu mengunggah foto Kartu Tanda Penduduk (KTP) dan Kartu Keluarga (KK). Foto dokumen harus terlihat jelas, tidak buram, dan teks terbaca dengan baik. Data yang diunggah hanya digunakan untuk keperluan pencatatan demografi kependudukan internal oleh Sekretaris RT dan dijamin kerahasiaannya dengan standar keamanan data pribadi.' 
  },
  { 
    id: '10', 
    category: 'layanan',
    question: 'Bagaimana jika saya warga baru yang baru pindah ke lingkungan RT 02?', 
    answer: 'Warga baru yang tinggal atau menyewa rumah di lingkungan RT 02 wajib melapor dalam waktu maksimal 3x24 jam. Anda dapat mendaftarkan diri secara digital melalui fitur "Registrasi Resident" di halaman utama. Isi data diri lengkap keluarga Anda, lampirkan surat pindah dari domisili asal, salinan KTP, serta KK. Setelah itu, Ketua RT atau pengurus akan menjadwalkan kunjungan silaturahmi singkat untuk memvalidasi pendaftaran Anda serta menambahkan rumah Anda ke peta digital warga.' 
  },
  { 
    id: '11', 
    category: 'iuran',
    question: 'Apakah pembayaran iuran RT 02 bisa ditransfer secara non-tunai?', 
    answer: 'Tentu saja! Demi mendukung digitalisasi keuangan, warga dapat melakukan transfer iuran bulanan ke rekening resmi Bank Mandiri/BSI RT 02 yang tercantum pada menu Keuangan, lalu mengunggah bukti transfer melalui fitur "Lapor Bayar Iuran" di aplikasi. Pembayaran otomatis akan diverifikasi oleh Bendahara RT dalam waktu 1x24 jam dan status rumah Anda akan langsung berubah menjadi "Lunas" berwarna hijau di beranda.' 
  },
  { 
    id: '12', 
    category: 'iuran',
    question: 'Bagaimana jika sebuah rumah mengalami keterlambatan atau menunggak iuran?', 
    answer: 'Sistem aplikasi ini akan melacak sejarah pembayaran secara berkala. Jika ada rumah yang berstatus "Menunggak" lebih dari 3 bulan, Bendahara RT akan mengirimkan notifikasi pengingat ramah secara otomatis via WhatsApp Blast. Bila keterlambatan berlanjut tanpa konfirmasi alasan khusus, pengurus RT akan melakukan dialog kekeluargaan untuk mencari solusi terbaik atau memberikan keringanan jika warga yang bersangkutan sedang tertimpa musibah berat.' 
  },
  { 
    id: '13', 
    category: 'keamanan',
    question: 'Bagaimana aturan dan konsekuensi jika warga berhalangan ikut ronda malam?', 
    answer: 'Setiap warga laki-laki yang telah dewasa wajib mengikuti ronda malam sesuai jadwal bergilir yang ditentukan di menu "Keamanan & Ronda". Jika Anda berhalangan hadir karena urusan dinas ke luar kota, sakit, atau alasan krusial lainnya, Anda wajib mengajukan pertukaran jadwal (Swap Ronda) kepada warga lain melalui fitur "Tukar Jadwal" di aplikasi ini minimal 1 hari sebelumnya, atau membayar kontribusi pengganti sebesar Rp 25.000 ke kas ronda melalui Bendahara untuk mendukung dana konsumsi tim ronda malam.' 
  },
  { 
    id: '14', 
    category: 'lingkungan',
    question: 'Bagaimana cara melaporkan masalah fasilitas umum seperti lampu jalan mati atau selokan mampet?', 
    answer: 'Jika Anda menemukan fasilitas umum yang rusak atau selokan yang mampet sehingga berisiko banjir, Anda dapat menggunakan menu "Laporan Warga" atau "Formulir Pengaduan". Ambil foto fasilitas yang bermasalah, tulis deskripsi lokasinya, lalu kirimkan laporan Anda. Laporan akan masuk ke dasbor pengurus RT dengan status "Baru", lalu beranjak ke "Diproses" saat tim kerja bakti ditugaskan, hingga statusnya "Selesai" begitu selesai diperbaiki. Seluruh warga dapat memantau progres perbaikan tersebut secara real-time.' 
  },
  { 
    id: '15', 
    category: 'sosial',
    question: 'Bagaimana jadwal pelaksanaan Posyandu Balita serta Posbindu Lansia?', 
    answer: 'Kegiatan Posyandu Terpadu untuk pemantauan tumbuh kembang Balita (timbang badan, imunisasi, PMT balon) serta Posbindu Lansia (cek tensi darah, gula darah, kolesterol, konsultasi kesehatan) diadakan secara serempak setiap bulan di hari Sabtu pekan kedua, bertempat di Gedung Balai Pertemuan RT 02 mulai pukul 08:30 - 13:00 WIB. Informasi pengingat secara berkala mengenai hal ini akan otomatis dikomunikasikan melalui notifikasi pengumuman dari aplikasi H-2 pelaksanaan.' 
  },
  { 
    id: '16', 
    category: 'sosial',
    question: 'Bagaimana prosedur pengajuan bantuan sosial (Bansos) pemerintah di lingkungan RT?', 
    answer: 'Semua pengajuan bansos dari pemerintah pusat seperti PKH, BPNT, atau BLT dikurasi secara ketat berdasarkan data kemiskinan nasional (DTKS). Pengurus RT 02 bertugas mengusulkan warga prasejahtera di lingkungan kami yang datanya terekam valid di dalam aplikasi dasbor kependudukan RT. Warga yang merasa berhak dan belum terdaftar dapat berkonsultasi langsung dengan menyerahkan Surat Keterangan Tidak Mampu (SKTM) dari Kelurahan dan berkas KK ke Ketua RT untuk diverifikasi profil ekonominya secara objektif.' 
  }
];

export const MOCK_DOCUMENTS: Document[] = [
  { id: '1', title: 'SK Pengurus RT 02', category: 'SK RT', url: '#', uploadDate: '2023-01-01', uploadedBy: 'Admin' },
  { id: '2', title: 'Aturan Kebersihan Lingkungan', category: 'Aturan', url: '#', uploadDate: '2023-02-15', uploadedBy: 'Admin' },
];

export const MOCK_WASTE_PRICES: WastePrice[] = [
  { id: '1', type: 'Plastik', pricePerUnit: 2000, unit: 'kg' },
  { id: '2', type: 'Kertas', pricePerUnit: 1500, unit: 'kg' },
  { id: '3', type: 'Logam', pricePerUnit: 5000, unit: 'kg' },
  { id: '4', type: 'Minyak Jelantah', pricePerUnit: 3000, unit: 'liter' },
  { id: '5', type: 'Lainnya', pricePerUnit: 1000, unit: 'kg' },
];

export const MOCK_BILLS: Bill[] = [
  {
    id: '1',
    houseId: 'C10-01',
    month: '2026-03',
    dueDate: '2026-03-20',
    total: 50000,
    items: [
      { id: '1-1', name: 'Iuran Sampah', amount: 25000, status: 'Paid', manager: 'Bpk. Asep' },
      { id: '1-2', name: 'Iuran Air', amount: 25000, status: 'Unpaid', manager: 'Bpk. Irfan' }
    ]
  }
];

export const DEFAULT_PDF_CONFIG: PdfConfig = {
  logo: LOGO_URL, 
  stamp: "",
  signature: "",
  rtName: "RT.02 / RW.020",
  rtAddress: "Jl. Pue Lombe Blok C10-08 Huntap Tondo 2, Telp. +62 859-6119-4621",
  rtChairman: "IRFAN ARIANTO",
  rtPhone: "6285961194621",
  kelurahan: "TONDO",
  kecamatan: "MANTIKULORE",
  kota: "PALU",
  lastLetterNumber: 0,
  whatsappGroupId: "",
  whatsappGroupName: ""
};