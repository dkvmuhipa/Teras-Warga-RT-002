
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
