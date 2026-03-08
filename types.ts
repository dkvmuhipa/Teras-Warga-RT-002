export enum Role {
  ADMIN = 'Admin',
  TREASURER = 'Bendahara',
  SECRETARY = 'Sekretaris',
  RESIDENT = 'Warga'
}

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
  paymentStatus: PaymentStatus; // Default: Keamanan
  paymentStatusAir?: PaymentStatus; // NEW: Iuran Air
  paymentStatusSampah?: PaymentStatus; // NEW: Iuran Sampah
  phone?: string;
  accessCode?: string; // NEW: Kode Akses Unik untuk Verifikasi
  
  // New Fields for Professional Data Management
  isVerified?: boolean;
  ktpUrl?: string;
  kkUrl?: string;
  role?: Role; // RBAC
  
  education?: string;
  jobCategory?: string;
  vehicleCount?: number;
  
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

  // Family Members
  familyMembers?: {
    name: string;
    nik?: string;
    relation: 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain';
    birthDate?: string;
  }[];
}

export interface AuditLog {
  id: string;
  action: string;
  timestamp: string;
  user: string;
  targetId?: string;
}

// Feature 1: Event Management
export interface AppEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  attendees: string[]; // House IDs or Names
}

// Feature 3: Asset Management
export interface AssetLoan {
  id: string;
  assetId: string;
  houseId: string;
  borrowDate: string;
  returnDate?: string;
  status: 'Borrowed' | 'Returned';
}

// Feature 4: Direct Communication
export interface Message {
  id: string;
  senderId: string;
  receiverId: string; // 'All' or specific ID
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'General' | 'Urgent' | 'Event';
}

export interface News {
  id: string;
  title: string;
  content: string;
  date: string;
  image?: string;
  category?: 'Kegiatan' | 'Pengumuman' | 'Warga' | 'Lainnya';
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
  type: 'Keamanan' | 'Kebersihan' | 'Fasilitas' | 'Sosial' | 'Lainnya';
  description: string;
  reporterName: string;
  date: string;
  status: 'Baru' | 'Diproses' | 'Selesai';
  houseId?: string; // Optional: Link report to specific house (e.g., "Rumah C1-05 kotor")
  reporterHouseId?: string;
  photoUrl?: string; // NEW: Photo evidence
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
  type: string;
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

  // New Detailed Fields
  phone: string;
  email?: string;
  education: string;
  familyStatus: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Lainnya';
  bloodType: 'A' | 'B' | 'AB' | 'O' | '-';
  
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
  letterNumber?: string;
  estimatedTime?: string; // NEW: Estimated processing time
  rating?: number; // NEW: User feedback
  feedback?: string; // NEW: User feedback
}

// New Types
export interface RondaSchedule {
  id?: string; // Optional for seeding, required for edit
  day: string;
  members: string[]; // Nama warga (Legacy/Simple)
  shifts?: {
    id: string;
    time: string; // e.g., "22:00 - 01:00"
    members: string[];
  }[];
}

export interface RondaSwapRequest {
  id: string;
  requesterName: string;
  requesterHouseId: string;
  fromDay: string;
  toDay: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason?: string;
  timestamp: string;
}

// Digitalisasi Ronda (New Interface)
export interface RondaCheckLog {
  id: string;
  timestamp: string; // ISO String
  officerName: string;
  location: string; // "Gerbang", "Blok C5", "C5-02"
  type: 'Start' | 'End' | 'Report'; // NEW
  status: 'Aman' | 'Mencurigakan' | 'Insiden';
  note?: string;
  photoUrl?: string; // NEW
}

export interface Checkpoint {
  id: string;
  name: string;
  qrCode: string;
  x?: number; // Position X in percentage (0-100)
  y?: number; // Position Y in percentage (0-100)
}

export interface MapPoint {
  id: string;
  label: string;
  type: 'Gate' | 'Security' | 'Block' | 'Other';
  x: number;
  y: number;
  icon: string;
}

export interface PatrolSession {
  id: string;
  officerName: string;
  startTime: string;
  endTime?: string;
  visitedCheckpoints: string[]; // Array of Checkpoint IDs
  status: 'Ongoing' | 'Completed';
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
  rtChairman: string;
  lastLetterNumber: number;
  letterTemplates?: {
    type: string;
    suggestion: string;
  }[];
  introText?: string;
  closingText?: string;
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

export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  date: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface Document {
  id: string;
  title: string;
  category: 'SK RT' | 'Aturan' | 'Formulir' | 'Lainnya';
  url: string;
  uploadDate: string;
  uploadedBy: string;
}

export interface BillItem {
  id: string;
  name: string; // e.g., "Air", "Sampah", "Keamanan"
  amount: number;
  manager: string; // Name of the person/entity managing this item
  status: 'Unpaid' | 'Paid';
  paymentDate?: string;
}

export interface Bill {
  id: string;
  houseId: string;
  month: string; // e.g., "2026-03"
  items: BillItem[];
  total: number;
  dueDate: string; // e.g., "2026-03-20"
}

export interface PopulationChangeLog {
  id: string;
  type: 'Birth' | 'Newcomer' | 'MovedOut' | 'Death';
  houseId: string;
  date: string; // ISO String
  description: string;
}

export interface PopulationReport {
  id: string;
  month: string; // e.g., "2026-03"
  year: number;
  
  // Data Utama
  initialPopulation: number; // Penduduk Awal
  birthCount: number;        // Lahir
  deathCount: number;        // Meninggal
  newcomerCount: number;     // Pendatang
  movedOutCount: number;     // Pindah
  
  // Data Demografi Akhir
  maleCount: number;         // Laki-laki
  femaleCount: number;       // Perempuan
  
  // Data Musiman
  seasonalCount: number;     // Total Musiman
  seasonalMaleCount: number; // Musiman Laki-laki
  seasonalFemaleCount: number; // Musiman Perempuan
  
  createdAt: string;
}
