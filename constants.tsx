

import React from 'react';
import { House, PaymentStatus, Announcement, UMKM, Report, LetterRequest, RondaSchedule, CashFlow, Official } from './types';
import { Home, Users, TreePine } from 'lucide-react';

export const APP_NAME = "TerasWarga";
export const RT_ADDRESS = "Huntap 2 Tondo, Kel. Tondo, Kec. Mantikulore, Kota Palu";

// --- KONFIGURASI GAMBAR PDF ---
// Gambar asli (Logo, Stempel, TTD) dalam format Base64
// NOTE: String Base64 di bawah ini adalah placeholder yang valid untuk mencegah error.
// Jika mengganti dengan gambar asli, pastikan string dalam satu baris (tidak ada enter).

export const PDF_ASSETS = {
  // Logo Kota Palu
  LOGO: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Lambang_Kota_Palu.png",
  
  // Base64 Stempel RT 02 RW 20 (Placeholder Valid - Transparent 1x1 Pixel)
  STAMP: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==", 

  // Base64 Tanda Tangan Ketua RT (Placeholder Valid - Transparent 1x1 Pixel)
  SIGNATURE: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg=="
};

// --- MOCK DATA ---

export const generateHouses = (): House[] => {
  const blocks = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'];
  const houses: House[] = [];
  
  blocks.forEach(block => {
    const count = Math.floor(Math.random() * 10) + 15; // 15-25 houses per block
    for (let i = 1; i <= count; i++) {
      const status = Math.random() > 0.85 ? 'Empty' : Math.random() > 0.9 ? 'Business' : 'Occupied';
      const paymentStatus = status === 'Empty' ? PaymentStatus.PAID : 
                            Math.random() > 0.3 ? PaymentStatus.PAID : 
                            Math.random() > 0.5 ? PaymentStatus.PENDING : PaymentStatus.UNPAID;
      
      houses.push({
        id: `${block}-${i.toString().padStart(2, '0')}`,
        block,
        number: i.toString().padStart(2, '0'),
        headOfFamily: status === 'Occupied' ? `Warga ${block}-${i}` : '-',
        occupants: status === 'Occupied' ? Math.floor(Math.random() * 4) + 1 : 0,
        status: status as any,
        paymentStatus: paymentStatus,
        phone: status === 'Occupied' ? `0812-${Math.floor(Math.random()*1000)}-${Math.floor(Math.random()*1000)}` : undefined
      });
    }
  });
  return houses;
};

export const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: 'Kerja Bakti Lingkungan',
    content: 'Diharapkan kehadiran seluruh warga bapak-bapak untuk mengikuti kerja bakti membersihkan selokan utama.\n\nHari/Tanggal: Minggu, 25 Mei 2024\nWaktu: 07.00 WITA - Selesai\nLokasi: Lapangan Bulutangkis RT 02\n\nSilakan membawa peralatan kebersihan masing-masing. Konsumsi disediakan oleh ibu-ibu PKK.',
    date: '2024-05-20',
    type: 'Event'
  },
  {
    id: '2',
    title: 'Pembayaran Iuran Sampah',
    content: 'Mengingatkan kembali untuk pembayaran iuran sampah bulan Mei paling lambat tanggal 10. Pembayaran bisa dititipkan ke Bendahara RT atau transfer ke rekening RT.\n\nBCA: 1234567890 a.n Bendahara RT 02\n\nTerima kasih bagi yang sudah membayar tepat waktu.',
    date: '2024-05-01',
    type: 'Urgent'
  },
  {
    id: '3',
    title: 'Jadwal Posyandu Balita',
    content: 'Posyandu Balita bulan ini akan dilaksanakan pada:\n\nHari: Rabu, 15 Mei 2024\nJam: 09.00 - 11.00 WITA\nTempat: Rumah Ibu Kader (Blok C5 No. 12)\n\nMohon membawa buku KIA.',
    date: '2024-05-10',
    type: 'General'
  }
];

export const MOCK_UMKM: UMKM[] = [
  {
    id: '1',
    name: 'Warung Makan Bu Tini',
    owner: 'Ibu Hartini',
    category: 'Kuliner',
    description: 'Menyediakan nasi kuning, nasi campur, dan aneka kue basah. Menerima pesanan katering.',
    contact: '6281234567890',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '2',
    name: 'Laundry Kinclong',
    owner: 'Bpk. Budi',
    category: 'Jasa',
    description: 'Cuci setrika kilat, bersih, wangi. Bisa antar jemput khusus warga RT 02.',
    contact: '6281234567891',
    image: 'https://images.unsplash.com/photo-1545173168-9f1947eebb8f?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: '3',
    name: 'Toko Kelontong Berkah',
    owner: 'Ibu Siti',
    category: 'Retail',
    description: 'Sembako lengkap, gas elpiji, galon air, pulsa, dan token listrik.',
    contact: '6281234567892',
    image: 'https://images.unsplash.com/photo-1604719312566-b76d4685332e?auto=format&fit=crop&q=80&w=800'
  }
];

export const INITIAL_REPORTS: Report[] = [
  {
    id: '1',
    type: 'Fasilitas',
    description: 'Lampu jalan di Blok C3 mati sudah 2 hari.',
    reporterName: 'Warga C3',
    date: '2024-05-21',
    status: 'Baru'
  },
  {
    id: '2',
    type: 'Keamanan',
    description: 'Ada orang asing mencurigakan nongkrong di pos ronda jam 2 pagi.',
    reporterName: 'Ronda Malam',
    date: '2024-05-20',
    status: 'Diproses'
  }
];

export const INITIAL_LETTERS: LetterRequest[] = [
  {
     id: '1',
     type: 'Pengantar KTP',
     applicantName: 'Budi Santoso',
     houseId: 'C5-10',
     nik: '7271000000000001',
     birthPlace: 'Palu',
     birthDate: '1990-01-01',
     religion: 'ISLAM',
     gender: 'LAKI-LAKI',
     job: 'Karyawan Swasta',
     maritalStatus: 'KAWIN',
     addressKtp: 'Jl. Pue Lombe Blok C5-10',
     status: 'Pending',
     date: '2024-05-22'
  },
  {
     id: '2',
     type: 'Domisili',
     applicantName: 'Siti Aminah',
     houseId: 'C2-05',
     nik: '7271000000000002',
     birthPlace: 'Poso',
     birthDate: '1995-05-05',
     religion: 'ISLAM',
     gender: 'PEREMPUAN',
     job: 'Ibu Rumah Tangga',
     maritalStatus: 'KAWIN',
     addressKtp: 'Jl. Pue Lombe Blok C2-05',
     status: 'Approved',
     date: '2024-05-20'
  }
];

export const MOCK_RONDA: RondaSchedule[] = [
  { day: 'Senin', members: ['Bpk. Andi (C1)', 'Bpk. Budi (C2)', 'Bpk. Cecep (C3)', 'Sdr. Dedi (C4)'] },
  { day: 'Selasa', members: ['Bpk. Eko (C5)', 'Bpk. Fajar (C6)', 'Bpk. Galih (C7)', 'Sdr. Hadi (C8)'] },
  { day: 'Rabu', members: ['Bpk. Indra (C9)', 'Bpk. Joko (C10)', 'Bpk. Kiki (C11)', 'Sdr. Lutfi (C12)'] },
  { day: 'Kamis', members: ['Bpk. Maman (C1)', 'Bpk. Nanang (C3)', 'Bpk. Opik (C5)', 'Sdr. Paul (C7)'] },
  { day: 'Jumat', members: ['Bpk. Qodir (C2)', 'Bpk. Rudi (C4)', 'Bpk. Surya (C6)', 'Sdr. Tono (C8)'] },
  { day: 'Sabtu', members: ['Bpk. Usman (C9)', 'Bpk. Vicky (C10)', 'Bpk. Wahyu (C11)', 'Sdr. Xaver (C12)'] },
  { day: 'Minggu', members: ['Bpk. Yanto (C2)', 'Bpk. Zainal (C4)', 'Sdr. Iwan (C6)', 'Sdr. Oki (C8)'] },
];

export const MOCK_CASHFLOW: CashFlow[] = [
  { id: '1', date: '2024-05-01', description: 'Iuran Warga Mei', amount: 1500000, type: 'Income', category: 'Iuran Wajib' },
  { id: '2', date: '2024-05-05', description: 'Sumbangan Donatur', amount: 500000, type: 'Income', category: 'Donasi' },
  { id: '3', date: '2024-05-10', description: 'Bayar Listrik Pos', amount: 150000, type: 'Expense', category: 'Operasional' },
  { id: '4', date: '2024-05-12', description: 'Konsumsi Kerja Bakti', amount: 300000, type: 'Expense', category: 'Kegiatan' },
  { id: '5', date: '2024-05-15', description: 'Perbaikan Gapura', amount: 750000, type: 'Expense', category: 'Pembangunan' },
];

export const INITIAL_OFFICIALS: Official[] = [
  { id: '1', role: 'Ketua RT', name: 'Bpk. Herman', houseId: 'C5-01', phone: '0812-3456-7890', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Herman' },
  { id: '2', role: 'Sekretaris', name: 'Ibu Rina', houseId: 'C7-12', phone: '0853-1234-5678', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rina' },
  { id: '3', role: 'Bendahara', name: 'Ibu Ani', houseId: 'C9-05', phone: '0813-9876-5432', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ani' },
  { id: '4', role: 'Koord. Keamanan', name: 'Bpk. Agus', houseId: 'C12-01', phone: '0821-2345-6789', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Agus' },
];

export const MOCK_GALLERY = [
  { id: '1', image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=800', title: 'Kerja Bakti Rutin', date: 'Mei 2023' },
  { id: '2', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800', title: 'Malam Tirakatan', date: 'Agustus 2023' },
  { id: '3', image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=800', title: 'Posyandu Balita', date: 'Juni 2023' },
  { id: '4', image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=800', title: 'Ronda Malam', date: 'Juli 2023' },
];

export const Logo = () => (
  <div className="flex items-center gap-2 font-bold text-slate-800">
    <div className="bg-brand-blue text-white p-1.5 rounded-lg">
      <Home size={20} strokeWidth={2.5} />
    </div>
    <span className="text-lg tracking-tight hidden sm:inline-block">{APP_NAME}</span>
  </div>
);