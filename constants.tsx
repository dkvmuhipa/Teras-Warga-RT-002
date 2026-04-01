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
        residenceType: status === 'Occupied' ? (isRenter ? 'Kontrak' : 'Tetap') : 'Tetap',
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
    { id: '1', role: 'Ketua RT', name: 'Bpk. IRFAN ARIANTO', houseId: 'C10-08', phone: '0859-6119-4621' }, 
    { id: '2', role: 'Sekretaris', name: 'Ibu Siti Aminah', houseId: 'C5-02', phone: '0812-9876-5432' },
    { id: '3', role: 'Bendahara', name: 'Bpk. Rudi Hartono', houseId: 'C11-12', phone: '0813-4567-8901' },
    { id: '4', role: 'Koord. Keamanan', name: 'Bpk. Joko Susilo', houseId: 'C8-05', phone: '0813-1122-3344' },
    { id: '5', role: 'Bendahara RW', name: 'Ibu Haryati', houseId: 'C9-10', phone: '0813-9988-7766' },
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
    contact: '628123456789',
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
  { id: '1', question: 'Bagaimana cara mengurus KTP?', answer: 'Silakan hubungi Sekretaris RT untuk mendapatkan surat pengantar.' },
  { id: '2', question: 'Kapan jadwal pengambilan sampah?', answer: 'Jadwal pengambilan sampah adalah setiap hari Senin dan Kamis pagi.' },
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
  logo: "", 
  stamp: "",
  signature: "",
  rtName: "RT.02 / RW.020",
  rtAddress: "Jl. Pue Lombe Blok C10-08 Huntap Tondo 2, Telp. 085961194621",
  rtChairman: "IRFAN ARIANTO",
  kelurahan: "TONDO",
  kecamatan: "MANTIKULORE",
  kota: "PALU",
  lastLetterNumber: 0,
  whatsappGroupId: "",
  whatsappGroupName: ""
};