

export enum PaymentStatus {
  PAID = 'Lunas',
  PENDING = 'Belum Lunas',
  UNPAID = 'Menunggak'
}

export interface House {
  id: string;
  block: string;
  number: string;
  headOfFamily: string; // Nama Kepala Keluarga
  occupants: number;
  status: 'Occupied' | 'Empty' | 'Business';
  residenceType?: 'Tetap' | 'Kontrak' | 'Kost'; // NEW: Status Kepemilikan including Kost
  paymentStatus: PaymentStatus;
  phone?: string;
  accessCode?: string; // NEW: Kode Akses Unik untuk Verifikasi
  
  // Gamification & Rewards (NEW)
  paymentStreak?: number; // Jumlah bulan berturut-turut lunas
  isExemplary?: boolean;  // Status Warga Teladan (Streak >= 12)

  // Data Demografi (Optional)
  hasPregnant?: boolean; // Ibu Hamil
  hasBaby?: boolean;     // Bayi
  hasToddler?: boolean;  // Balita
  hasTeenager?: boolean; // Remaja
  hasElderly?: boolean;  // Lansia

  // Data Demografi Counts
  pregnantCount?: number;
  babyCount?: number;
  toddlerCount?: number;
  teenagerCount?: number;
  elderlyCount?: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'General' | 'Urgent' | 'Event';
}

// New Notification Interface
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'Info' | 'Alert' | 'Success';
  target?: string; // 'All' or specific User/House ID (for future use)
  isRead?: boolean; // Local state handling
}

export interface Report {
  id: string;
  type: 'Keamanan' | 'Kebersihan' | 'Fasilitas' | 'Lainnya';
  description: string;
  reporterName: string;
  date: string;
  status: 'Baru' | 'Diproses' | 'Selesai';
  houseId?: string; // Optional: Link report to specific house (e.g., "Rumah C1-05 kotor")
}

export interface UMKM {
  id: string;
  name: string;
  owner: string;
  category: string;
  description: string;
  contact: string;
  image: string;
}

export interface LetterRequest {
  id: string;
  type: 'Pengantar KTP' | 'Pengantar KK' | 'Domisili' | 'Kematian' | 'Kelahiran' | 'Surat Keterangan Usaha (SKU)' | 'Surat Izin Keramaian';
  applicantName: string;
  houseId: string; // Alamat Domisili di RT (Blok)
  
  // Data Tambahan Sesuai PDF Baru (1-11)
  nik: string;
  familyHeadName: string; // 3. Kepala Keluarga
  birthPlace: string;
  birthDate: string;
  religion: string;
  gender: 'Laki-laki' | 'Perempuan'; // Sesuai format PDF "Laki-laki" (Sentence case)
  job: string;
  maritalStatus: 'Kawin' | 'Belum Kawin' | 'Cerai Hidup' | 'Cerai Mati'; // Sesuai format PDF
  nationality: string; // 10. Kewarganegaraan
  addressKtp: string; 
  purposeDetail: string; // 11. Keperluan (Deskripsi Panjang)
  
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}

// New Types
export interface RondaSchedule {
  id?: string; // Optional for seeding, required for edit
  day: string;
  members: string[]; // Nama warga
}

// Digitalisasi Ronda (New Interface)
export interface RondaCheckLog {
  id: string;
  timestamp: string; // ISO String
  officerName: string;
  location: string; // "Gerbang", "Blok C5", "C5-02"
  status: 'Aman' | 'Mencurigakan' | 'Insiden';
  note?: string;
}

export interface CashFlow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
}

export interface Official {
  id: string;
  role: string;
  name: string;
  houseId: string;
  phone: string;
  photo?: string;
}

export interface PdfConfig {
  logo: string;      // Base64 string
  stamp: string;     // Base64 string
  signature: string; // Base64 string
  rtName: string;
  rtAddress: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  total: number;
  available: number;
  condition: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  notes?: string;
}

// E-Voting Types
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  date: string; // Creation date
  deadline: string;
  status: 'Open' | 'Closed';
  options: PollOption[];
  totalVotes: number;
  createdBy?: string; // Admin email/id
}

// Bursa Warga (Marketplace) Types
export interface MarketItem {
  id: string;
  title: string;
  description: string;
  price: number; // 0 for Gratis
  category: 'Jual' | 'Barter' | 'Gratis';
  sellerName: string;
  sellerContact: string;
  image: string;
  date: string;
  status: 'Available' | 'Sold';
  houseId?: string;
}