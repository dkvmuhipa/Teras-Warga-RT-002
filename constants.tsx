

import React from 'react';
import { House, PaymentStatus, Announcement, UMKM, Report, LetterRequest, RondaSchedule, CashFlow, Official, PdfConfig, InventoryItem } from './types';
import { Home, Users, TreePine } from 'lucide-react';

export const APP_NAME = "TERAS";
// Updated Address per Letter Reference
export const RT_ADDRESS = "Jl. Pue Lombe Blok C10-08 Huntap Tondo 2, Kel. Tondo, Kec. Mantikulore, Kota Palu";

// --- LOGO COMPONENT ---
export const Logo = () => (
  <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-800">
    <div className="bg-brand-blue text-white p-1.5 rounded-lg">
      <Home size={24} />
    </div>
    <span className="flex items-center gap-1">
        {APP_NAME} <span className="text-brand-blue">RT 002</span>
    </span>
  </div>
);

// --- DATA DUMMY (MOCK DATA) ---

export const generateHouses = (): House[] => {
  // Konfigurasi Wilayah RT 002 (Fix Update)
  // C5 (1-26), C7 (1-18), C8 (1-18), C9 (1-18), C10 (1-16), C11 (1-18), C12 (1-15)
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
      
      // Simulasi status hunian
      if (statusRandom > 0.85) status = 'Empty';
      else if (statusRandom > 0.95) status = 'Business';

      // Simulasi Kontrak vs Tetap (20% Kontrak)
      const isRenter = Math.random() > 0.8;

      houses.push({
        id: `${config.code}-${number}`,
        block: config.code,
        number: number,
        headOfFamily: status === 'Empty' ? '-' : `Warga ${config.code}-${number}`,
        occupants: status === 'Empty' ? 0 : Math.floor(Math.random() * 4) + 1,
        status,
        residenceType: status === 'Occupied' ? (isRenter ? 'Kontrak' : 'Tetap') : 'Tetap',
        paymentStatus: Math.random() > 0.3 ? PaymentStatus.PAID : (Math.random() > 0.5 ? PaymentStatus.PENDING : PaymentStatus.UNPAID),
        phone: status !== 'Empty' ? `0812-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : undefined
      });
    }
  });
  return houses;
};

// Updated Officials to match valid blocks (C5, C7-C12)
export const INITIAL_OFFICIALS: Official[] = [
    // Updated Name per Letter Reference (IRFAN ARIANTO)
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

export const MOCK_UMKM: UMKM[] = [
  {
    id: '1',
    name: 'Warung Nasi Kuning Bu Ani',
    owner: 'Ibu Ani',
    category: 'Kuliner',
    description: 'Nasi kuning khas Palu, tersedia mulai jam 6 pagi. Menerima pesanan katering.',
    contact: '628123456789',
    image: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?auto=format&fit=crop&q=80&w=300&h=200'
  },
  {
    id: '2',
    name: 'Jasa Service AC Berkah',
    owner: 'Pak Budi',
    category: 'Jasa',
    description: 'Cuci AC, tambah freon, bongkar pasang. Bergaransi dan profesional.',
    contact: '628219876543',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=300&h=200'
  },
  {
    id: '3',
    name: 'Keripik Pisang Renyah',
    owner: 'Mama Nisa',
    category: 'Kuliner',
    description: 'Keripik pisang aneka rasa: coklat, balado, keju. Cocok untuk oleh-oleh.',
    contact: '6285211223344',
    image: 'https://images.unsplash.com/photo-1599639668555-735096e411d3?auto=format&fit=crop&q=80&w=300&h=200'
  }
];

export const INITIAL_REPORTS: Report[] = [];
export const INITIAL_LETTERS: LetterRequest[] = [];

// Updated Ronda Schedule to match valid blocks (C5, C7, etc)
export const MOCK_RONDA: RondaSchedule[] = [
  { day: 'Senin', members: ['Bpk. Asep (C5-01)', 'Bpk. Budi (C5-02)', 'Bpk. Cecep (C5-03)'] },
  { day: 'Selasa', members: ['Bpk. Dedi (C7-01)', 'Bpk. Eko (C7-02)', 'Bpk. Fajar (C7-03)'] },
  { day: 'Rabu', members: ['Bpk. Gilang (C8-01)', 'Bpk. Hadi (C8-02)', 'Bpk. Indra (C8-03)'] },
  { day: 'Kamis', members: ['Bpk. Joko (C9-01)', 'Bpk. Kiki (C9-02)', 'Bpk. Lukman (C9-03)'] },
  { day: 'Jumat', members: ['Bpk. Maman (C10-01)', 'Bpk. Nanda (C10-02)', 'Bpk. Opik (C10-03)'] },
  { day: 'Sabtu', members: ['Bpk. Purnomo (C11-01)', 'Bpk. Qodir (C11-02)', 'Bpk. Rahmat (C11-03)'] },
  { day: 'Minggu', members: ['Bpk. Syaiful (C12-01)', 'Bpk. Tono (C12-02)', 'Bpk. Ujang (C12-03)'] },
];

export const MOCK_CASHFLOW: CashFlow[] = [
    { id: '1', date: '2023-10-01', description: 'Iuran Warga Blok C5', amount: 500000, type: 'Income', category: 'Iuran Warga' },
    { id: '2', date: '2023-10-02', description: 'Perbaikan Lampu Jalan C10', amount: 150000, type: 'Expense', category: 'Fasilitas' },
    { id: '3', date: '2023-10-05', description: 'Iuran Warga Blok C7', amount: 450000, type: 'Income', category: 'Iuran Warga' },
    { id: '4', date: '2023-10-10', description: 'Konsumsi Kerja Bakti', amount: 200000, type: 'Expense', category: 'Kegiatan' },
];

export const MOCK_INVENTORY: InventoryItem[] = [
    { id: '1', name: 'Tenda Terpal 4x6', total: 2, available: 2, condition: 'Baik' },
    { id: '2', name: 'Kursi Plastik', total: 50, available: 45, condition: 'Baik', notes: '5 kursi dipinjam Pak Budi' },
    { id: '3', name: 'Wireless Sound System', total: 1, available: 1, condition: 'Baik' },
    { id: '4', name: 'Mesin Potong Rumput', total: 1, available: 0, condition: 'Perlu Perbaikan', notes: 'Sedang diservis' },
];

export const MOCK_GALLERY = [
    { id: 1, title: "Kerja Bakti", image: "https://images.unsplash.com/photo-1558036117-15db5275d42b?auto=format&fit=crop&q=80&w=300&h=300" },
    { id: 2, title: "Rapat Warga", image: "https://images.unsplash.com/photo-1529070538774-1843cb6e65b3?auto=format&fit=crop&q=80&w=300&h=300" },
    { id: 3, title: "Lomba 17an", image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=300&h=300" },
    { id: 4, title: "Posyandu", image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=300&h=300" },
];

// --- KONFIGURASI DEFAULT (Fallback) ---
export const DEFAULT_PDF_CONFIG: PdfConfig = {
  logo: "", 
  stamp: "",
  signature: "",
  rtName: "RT.002 / RW.020",
  // Updated default address
  rtAddress: "Jl. Pue Lombe Blok C10-08 Huntap Tondo 2, Telp. 085961194621" 
};