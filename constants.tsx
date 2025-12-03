
import React from 'react';
import { House, PaymentStatus, Announcement, UMKM, Report, LetterRequest, RondaSchedule, CashFlow, Official } from './types';
import { Home, Users, TreePine } from 'lucide-react';

export const APP_NAME = "TerasWarga";
export const RT_ADDRESS = "Huntap 2 Tondo, Kel. Tondo, Kec. Mantikulore, Kota Palu";

// --- LOGO COMPONENT ---
export const Logo = () => (
  <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-800">
    <div className="bg-brand-blue text-white p-1.5 rounded-lg">
      <Home size={24} />
    </div>
    <span>{APP_NAME}</span>
  </div>
);

// --- DATA DUMMY (MOCK DATA) ---

export const INITIAL_OFFICIALS: Official[] = [
    { id: '1', role: 'Ketua RT', name: 'Bpk. Irfan Arianto', houseId: 'C10-08', phone: '0812-3456-7890' },
    { id: '2', role: 'Sekretaris', name: 'Ibu Siti Aminah', houseId: 'C5-02', phone: '0812-9876-5432' },
    { id: '3', role: 'Bendahara', name: 'Bpk. Rudi Hartono', houseId: 'C2-11', phone: '0813-4567-8901' },
    { id: '4', role: 'Koord. Keamanan', name: 'Bpk. Joko Susilo', houseId: 'C1-05', phone: '0813-1122-3344' },
];

export const generateHouses = (): House[] => {
  const blocks = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'];
  const houses: House[] = [];
  
  blocks.forEach(block => {
    for (let i = 1; i <= 20; i++) {
      const number = i < 10 ? `0${i}` : `${i}`;
      const statusRandom = Math.random();
      let status: House['status'] = 'Occupied';
      if (statusRandom > 0.85) status = 'Empty';
      else if (statusRandom > 0.95) status = 'Business';

      houses.push({
        id: `${block}-${number}`,
        block,
        number,
        headOfFamily: status === 'Empty' ? '-' : `Warga ${block}-${number}`,
        occupants: status === 'Empty' ? 0 : Math.floor(Math.random() * 4) + 1,
        status,
        paymentStatus: Math.random() > 0.3 ? PaymentStatus.PAID : (Math.random() > 0.5 ? PaymentStatus.PENDING : PaymentStatus.UNPAID),
        phone: status !== 'Empty' ? `0812-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : undefined
      });
    }
  });
  return houses;
};

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Kerja Bakti Lingkungan',
    content: 'Minggu ini akan diadakan kerja bakti membersihkan saluran air. Diharapkan kehadiran bapak-bapak membawa alat kebersihan.',
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

export const MOCK_RONDA: RondaSchedule[] = [
  { day: 'Senin', members: ['Bpk. Asep (C1-01)', 'Bpk. Budi (C1-02)', 'Bpk. Cecep (C1-03)'] },
  { day: 'Selasa', members: ['Bpk. Dedi (C2-01)', 'Bpk. Eko (C2-02)', 'Bpk. Fajar (C2-03)'] },
  { day: 'Rabu', members: ['Bpk. Gilang (C3-01)', 'Bpk. Hadi (C3-02)', 'Bpk. Indra (C3-03)'] },
  { day: 'Kamis', members: ['Bpk. Joko (C4-01)', 'Bpk. Kiki (C4-02)', 'Bpk. Lukman (C4-03)'] },
  { day: 'Jumat', members: ['Bpk. Maman (C5-01)', 'Bpk. Nanda (C5-02)', 'Bpk. Opik (C5-03)'] },
  { day: 'Sabtu', members: ['Bpk. Purnomo (C6-01)', 'Bpk. Qodir (C6-02)', 'Bpk. Rahmat (C6-03)'] },
  { day: 'Minggu', members: ['Bpk. Syaiful (C7-01)', 'Bpk. Tono (C7-02)', 'Bpk. Ujang (C7-03)'] },
];

export const MOCK_CASHFLOW: CashFlow[] = [
    { id: '1', date: '2023-10-01', description: 'Iuran Warga Blok C1', amount: 500000, type: 'Income', category: 'Iuran Warga' },
    { id: '2', date: '2023-10-02', description: 'Perbaikan Lampu Jalan', amount: 150000, type: 'Expense', category: 'Fasilitas' },
    { id: '3', date: '2023-10-05', description: 'Iuran Warga Blok C2', amount: 450000, type: 'Income', category: 'Iuran Warga' },
    { id: '4', date: '2023-10-10', description: 'Konsumsi Kerja Bakti', amount: 200000, type: 'Expense', category: 'Kegiatan' },
];

export const MOCK_GALLERY = [
    { id: 1, title: "Kerja Bakti", image: "https://images.unsplash.com/photo-1558036117-15db5275d42b?auto=format&fit=crop&q=80&w=300&h=300" },
    { id: 2, title: "Rapat Warga", image: "https://images.unsplash.com/photo-1529070538774-1843cb6e65b3?auto=format&fit=crop&q=80&w=300&h=300" },
    { id: 3, title: "Lomba 17an", image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=300&h=300" },
    { id: 4, title: "Posyandu", image: "https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&q=80&w=300&h=300" },
];

// --- KONFIGURASI GAMBAR PDF ---
// String Base64 di bawah ini adalah placeholder valid 1x1 pixel transparan agar tidak error.
// Untuk menggunakan Logo Kota Palu asli, pastikan string Base64-nya dalam SATU BARIS (tanpa enter) atau gunakan URL.

export const PDF_ASSETS = {
  // Placeholder Logo (Blue Dot) - Ganti dengan Base64 Logo Kota Palu yang valid jika perlu
  LOGO: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", 
  
  // Placeholder Stempel (Red Circle)
  STAMP: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFBQHAAX881AAAAABJRU5ErkJggg==",
  
  // Placeholder TTD
  SIGNATURE: "" 
};
