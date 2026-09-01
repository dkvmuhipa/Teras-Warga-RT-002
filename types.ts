export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

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

export interface OccupancyHistoryRecord {
  id: string;
  startDate: string;
  endDate?: string;
  headOfFamily: string;
  residenceType: 'Tetap' | 'Sewa' | 'Rumah Keluarga';
  occupantsCount: number;
  notes?: string;
  movedReason?: 'Pindah Keluar' | 'Beli Rumah Baru' | 'Sewa Selesai' | 'Lainnya';
}

export interface House {
  id: string;
  block: string;
  number: string;
  headOfFamily: string; // Nama Kepala Keluarga
  gender?: 'Laki-laki' | 'Perempuan';
  birthDate?: string;
  occupants: number;
  status: 'Occupied' | 'Empty' | 'Business' | 'Visiting';
  residenceType?: 'Tetap' | 'Sewa' | 'Rumah Keluarga'; // NEW: Status Kepenghunian (Tetap, Sewa, Rumah Keluarga)
  ownerName?: string; // NEW: Nama Pemilik Rumah (jika berbeda dengan penghuni)
  ownerPhone?: string; // NEW: Kontak Pemilik Rumah
  paymentStatus?: PaymentStatus; // Status Iuran Umum
  paymentDate?: string; // Tanggal Pembayaran Iuran
  paymentStatusAir?: PaymentStatus; // Iuran Air
  paymentStatusSampah?: PaymentStatus; // Iuran Sampah
  paymentStatusKeamanan?: PaymentStatus; // Iuran Keamanan (Opsional/Belum Ada)
  phone?: string;
  accessCode?: string; // NEW: Kode Akses Unik untuk Verifikasi
  isOutOfTown?: boolean; // NEW: Status Keluar Kota
  hasGuest?: boolean; // NEW: Status Ada Tamu
  isIsoman?: boolean; // NEW: Status Isolasi Mandiri
  vaccinationStatus?: 'Belum' | 'Dosis 1' | 'Dosis 2' | 'Booster 1' | 'Booster 2'; // NEW: Status Vaksinasi
  specialNotes?: string; // NEW: Catatan Khusus
  housePhotoUrl?: string; // NEW: Foto Rumah
  
  // Smart Tagging & Occupancy History
  tags?: string[];
  occupancyHistory?: OccupancyHistoryRecord[];
  
  // New Fields for Professional Data Management
  isVerified?: boolean;
  joiningDate?: string; // ISO String or YYYY-MM
  createdAt?: string; // NEW: Track when record was created for arrears fallback
  updatedAt?: string; // NEW: Track last update
  ktpUrl?: string;
  kkUrl?: string;
  role?: Role; // RBAC
  location?: { x: number; y: number };
  
  education?: string;
  jobCategory?: string;
  job?: string; // NEW: Pekerjaan Spesifik
  religion?: string;
  vehicleCount?: number;
  
  // New Identity Fields
  nik?: string; // NEW: NIK Kepala Keluarga
  birthPlace?: string; // NEW: Tempat Lahir
  maritalStatus?: 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati'; // NEW: Status Perkawinan
  bloodType?: 'A' | 'B' | 'AB' | 'O' | '-'; // NEW: Golongan Darah
  nationality?: string; // NEW: Kewarganegaraan
  addressKtp?: string; // NEW: Alamat sesuai KTP
  bpjsStatus?: 'PPU' | 'PBPU' | 'PBI' | 'Tidak Ada'; // NEW: Status BPJS
  kkNumber?: string; // NEW: Nomor Kartu Keluarga
  
  // Data Demografi (Optional)
  hasPregnant?: boolean; // Ibu Hamil
  hasBaby?: boolean;     // Bayi
  hasToddler?: boolean;  // Balita
  hasTeenager?: boolean; // Remaja
  hasAdult?: boolean;    // Dewasa
  hasElderly?: boolean;  // Lansia
  hasWidow?: boolean;    // Janda
  hasChild?: boolean;    // Anak

  // Data Demografi Counts
  pregnantCount?: number;
  babyCount?: number;
  toddlerCount?: number;
  teenagerCount?: number;
  adultCount?: number;
  elderlyCount?: number;
  widowCount?: number;
  childCount?: number;

  // Social Assistance (Bantuan Sosial)
  isPKH?: boolean;
  isBLT?: boolean;
  isBPNT?: boolean;
  isBansosLain?: boolean;
  bansosLainName?: string;
  
  // Vulnerable Groups & Economic Status
  isDisability?: boolean;
  disabilityCount?: number;
  isOrphan?: boolean;
  orphanCount?: number;
  economicStatus?: 'Pra-Sejahtera' | 'Sejahtera' | 'Mampu';
  emergencyContactName?: string; // NEW: Nama Kontak Darurat
  emergencyContactPhone?: string; // NEW: Nomor Kontak Darurat
  bpjsNumber?: string; // NEW: Nomor Kartu BPJS 13 Digit
  disabilityType?: string; // NEW: Jenis Disabilitas / Kebutuhan Khusus
  
  // Ronda Management
  rondaExempt?: boolean; // NEW: Pengecualian Ronda (Lansia, Sakit, dll)
  rondaPoints?: number; // NEW: Sistem Poin Keaktifan
  rondaDutyCount?: number; // NEW: Jumlah Tugas dalam sebulan/periode
  rondaLastDuty?: string; // NEW: Tanggal Tugas Terakhir (ISO)

  // PBB Management
  pbbStatus?: 'Sudah Diambil' | 'Belum Diambil'; // NEW: Status Pengambilan PBB
  pbbYear?: string; // NEW: Tahun PBB
  isInitialData?: boolean; // NEW: Flag for initial sync
  useManualDemographics?: boolean; // NEW: Allow manual override of auto counts

  // Family Members
  familyMembers?: {
    id?: string;
    name: string;
    nik?: string;
    gender?: 'Laki-laki' | 'Perempuan';
    relation: 'Suami' | 'Istri' | 'Anak' | 'Menantu' | 'Cucu' | 'Orang Tua' | 'Mertua' | 'Saudara' | 'Keponakan' | 'Kakek/Nenek' | 'Pembantu' | 'Famili Lain';
    education?: string;
    birthDate?: string;
    job?: string;
  }[];
}

export interface ResidentRegistration {
  id: string;
  headOfFamily: string;
  gender: 'Laki-laki' | 'Perempuan';
  birthDate: string;
  ownerName?: string;
  block: string;
  number: string;
  phone: string;
  status: 'Occupied' | 'Empty' | 'Business' | 'Visiting';
  residenceType: 'Tetap' | 'Sewa' | 'Rumah Keluarga';
  occupants: number;
  kkNumber?: string;
  education?: string;
  jobCategory?: string;
  religion?: string;
  vehicleCount?: number;
  pregnantCount?: number;
  babyCount?: number;
  toddlerCount?: number;
  teenagerCount?: number;
  adultCount?: number;
  elderlyCount?: number;
  widowCount?: number;
  childCount?: number;
  isPKH?: boolean;
  isBLT?: boolean;
  isBPNT?: boolean;
  isBansosLain?: boolean;
  bansosLainName?: string;
  isDisability?: boolean;
  isOrphan?: boolean;
  ktpUrl?: string;
  kkUrl?: string;
  useManualDemographics?: boolean;
  familyMembers?: {
    id?: string;
    name: string;
    nik?: string;
    gender: 'Laki-laki' | 'Perempuan';
    relation: 'Suami' | 'Istri' | 'Anak' | 'Menantu' | 'Cucu' | 'Orang Tua' | 'Mertua' | 'Saudara' | 'Keponakan' | 'Kakek/Nenek' | 'Pembantu' | 'Famili Lain';
    education?: string;
    birthDate?: string;
    job?: string;
  }[];
  date: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected' | 'Menunggu' | 'Disetujui' | 'Ditolak';
  notes?: string;
}

export interface GuestReport {
  id: string;
  residentName: string;
  residentHouseId: string;
  hostHouseNumber?: string;
  hostBlock?: string;
  guestName: string;
  guestNik?: string; // NEW: NIK Tamu
  guestJob?: string; // NEW: Pekerjaan Tamu
  guestAddress?: string; // NEW: Alamat Asal
  gender?: 'Laki-laki' | 'Perempuan'; // NEW: Jenis Kelamin
  relationship: string;
  purpose?: string; // NEW: Keperluan
  stayDuration: string;
  arrivalDate: string;
  departureDate?: string; // NEW: Rencana Kepulangan
  vehicleInfo?: string; // NEW: Info Kendaraan
  ktpUrl?: string;
  phone: string;
  status: 'Active' | 'Departed';
  createdAt: string;
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
  time?: string;
  location: string;
  attendees: string[]; // House IDs or Names
  organizer?: string;
  category?: 'Gotong Royong' | 'Rapat RT' | 'Keagamaan' | 'Olahraga' | 'Sosial/Budaya';
  quota?: number;
  dresscode?: string;
  isBroadcast?: boolean;
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
  author?: string;
  excerpt?: string;
  location?: string;
  isBroadcast?: boolean;
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
  type: 'Keamanan' | 'Kebersihan' | 'Fasilitas' | 'Sosial' | 'Aspirasi/Saran' | 'Temuan Lapangan' | 'Lainnya';
  description: string;
  reporterName: string;
  date: string;
  status: 'Baru' | 'Diproses' | 'Selesai';
  houseId?: string; // Optional: Link report to specific house (e.g., "Rumah C1-05 kotor")
  reporterHouseId?: string;
  reporterPhone?: string; // NEW: Reporter's phone number
  photoUrl?: string; // NEW: Photo evidence
  archived?: boolean; // NEW: Archive status
}

export interface UMKM {
  id: string;
  name: string;
  owner: string;
  category: string;
  description: string;
  contact: string;
  image: string;
  address?: string;
  houseId?: string;
  operatingHours?: string;
  gallery?: string[];
  rating?: number;
  reviewsCount?: number;
  priceRange?: string;
  isVerified?: boolean;
  featuredProduct?: string;
  socialMedia?: {
    platform: 'Instagram' | 'Facebook' | 'TikTok';
    url: string;
  }[];
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
  currentAddress: string; // NEW: Alamat Domisili Saat Ini
  purposeDetail: string; // 11. Keperluan (Deskripsi Panjang)

  // New Detailed Fields
  phone: string;
  email?: string;
  education: string;
  familyStatus: 'Kepala Keluarga' | 'Suami' | 'Istri' | 'Anak' | 'Menantu' | 'Cucu' | 'Orang Tua' | 'Mertua' | 'Saudara/Adik/Kakak' | 'Famili Lain' | 'Pembantu' | 'Lainnya';
  bloodType: 'A' | 'B' | 'AB' | 'O' | '-';
  
  status: 'Pending' | 'Approved' | 'Rejected' | 'Menunggu' | 'Disetujui' | 'Ditolak';
  date: string;
  letterNumber?: string;
  estimatedTime?: string; // NEW: Estimated processing time
  rating?: number; // NEW: User feedback
  feedback?: string; // NEW: User feedback
  archived?: boolean; // NEW: Archive status
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
  targetMemberName?: string; // NEW: Target warga yang diajak tukar
  targetHouseId?: string; // NEW: ID rumah target
  status: 'Pending' | 'Approved' | 'Rejected' | 'Menunggu' | 'Disetujui' | 'Ditolak';
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

export interface RondaAttendance {
  id: string;
  date: string; // YYYY-MM-DD
  day: string; // Senin, Selasa, etc.
  presentMembers: string[];
  absentMembers: string[];
  notes?: string;
  recordedBy: string; // Admin or Officer name
  timestamp: string;
}

export interface MapPoint {
  id: string;
  label: string;
  type: 'Gate' | 'Security' | 'Block' | 'PJU' | 'CCTV' | 'Hydrant' | 'Trash' | 'APAR' | 'AssemblyPoint' | 'EvacuationRoute' | 'Facility' | 'Other';
  x: number;
  y: number;
  icon: string;
  facilityInfo?: string; // NEW: Jadwal/Info Fasilitas
  cctvUrl?: string; // Link Stream CCTV
  cctvStreamType?: 'HLS' | 'iFrame' | 'RTSP' | 'MP4'; // Tipe protokol stream
  cctvStatus?: 'Online' | 'Maintenance' | 'Offline'; // Status kamera
  cctvResolution?: '4K Ultra HD' | '1080P Full HD' | '720P HD'; // Resolusi lensa
  cctvLocationZone?: string; // Zona pengawasan (Pos Satpam, Gerbang Utama, dsb)
  cctvOperatorContact?: string; // Kontak penanggung jawab pos siskamling
}

export interface PatrolSession {
  id: string;
  officerName: string;
  startTime: string;
  endTime?: string;
  visitedCheckpoints: string[]; // Array of Checkpoint IDs
  status: 'Ongoing' | 'Completed';
  currentLocation?: { x: number; y: number }; // NEW for real-time tracking
}

export interface PanicAlert {
  id: string;
  houseId: string;
  residentName: string;
  location: string;
  locationCoords?: { x: number; y: number };
  timestamp: string;
  status: 'Active' | 'Responding' | 'Resolved' | 'Cancelled';
  responderName?: string;
  resolvedAt?: string;
}

export interface CashFlow {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'Income' | 'Expense';
  category: string;
  evidenceUrl?: string;
  payerReceiver?: string;
  method?: 'Tunai' | 'Transfer' | 'Lainnya';
  referenceNumber?: string;
}

export interface Official {
  id: string;
  role: string;
  name: string;
  houseId: string;
  phone: string;
  photo?: string;
  email?: string;
  termStart?: string;
  termEnd?: string;
  duties?: string[];
  socialMedia?: {
    platform: 'Instagram' | 'Facebook' | 'Twitter' | 'LinkedIn';
    url: string;
  }[];
}

export interface PdfConfig {
  logo: string;      // Base64 string
  stamp: string;     // Base64 string
  signature: string; // Base64 string
  rtName: string;
  rtAddress: string;
  rtChairman: string;
  rtPhone?: string;
  kelurahan?: string;
  kecamatan?: string;
  kota?: string;
  lastLetterNumber: number;
  whatsappGroupId?: string; // NEW: Group ID for WhatsApp Broadcast
  whatsappGroupName?: string; // NEW: Group Name for display
  letterTemplates?: {
    type: string;
    suggestion: string;
  }[];
  introText?: string;
  closingText?: string;
  visibleFields?: Record<string, boolean>;
  fieldLabels?: Record<string, string>;
}

export interface MaintenanceLog {
  id: string;
  date: string;
  description: string;
  cost?: number;
  performedBy?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  total: number;
  available: number;
  condition: 'Baik' | 'Perlu Perbaikan' | 'Rusak';
  category: 'Perlengkapan Acara' | 'Alat Kebersihan' | 'Keamanan' | 'Peralatan Tukang' | 'Lainnya';
  notes?: string;
  maintenanceHistory?: MaintenanceLog[];
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
  category?: 'Kebijakan RT' | 'Pemilihan Pengurus' | 'Fasilitas' | 'Kegiatan/Acara';
  isSecret?: boolean;
  maxChoices?: number;
  isBroadcast?: boolean;
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
  category?: 'layanan' | 'iuran' | 'keamanan' | 'lingkungan' | 'sosial';
  keywords?: string[];
  isPopular?: boolean;
}

export interface Document {
  id: string;
  title: string;
  category: 'SK RT' | 'Aturan' | 'Formulir' | 'Notulensi' | 'Lainnya';
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
  name?: string;
  phone?: string;
  isGenerated?: boolean;
  documentUrl?: string; // NEW: File attachment (SKPWNI, Surat Lahir, Surat Kematian)
  verificationStatus?: 'Pending' | 'Approved' | 'Rejected'; // NEW: Status verifikasi dokumen/bukti
  approvalNotes?: string; // NEW: Catatan verifikasi
  details?: {
    // Newcomer
    previousAddress?: string;
    reasonForMoving?: string;
    familyCount?: number;
    familyMembers?: { name: string; relationship: string; nik?: string }[];
    residenceType?: 'Tetap' | 'Sewa' | 'Rumah Keluarga';
    religion?: string;
    vulnerability?: string[];
    kkNumber?: string;
    jobCategory?: string;
    education?: string;
    ownerName?: string;
    ownerPhone?: string;
    
    // MovedOut
    newAddress?: string;
    
    // Birth
    fatherName?: string;
    motherName?: string;
    gender?: 'Laki-laki' | 'Perempuan';
    
    // Death
    causeOfDeath?: string;
    placeOfDeath?: string;
  };
}

export interface PopulationReport {
  id: string;
  month: string; // e.g., "2026-03"
  year: number;
  
  // Data Utama
  initialPopulation: number; // Penduduk Awal
  initialMaleCount?: number;   // Penduduk Awal Laki-laki
  initialFemaleCount?: number; // Penduduk Awal Perempuan
  birthCount: number;        // Lahir
  birthMaleCount?: number;     // Lahir Laki-laki
  birthFemaleCount?: number;   // Lahir Perempuan
  deathCount: number;        // Meninggal
  deathMaleCount?: number;     // Meninggal Laki-laki
  deathFemaleCount?: number;   // Meninggal Perempuan
  newcomerCount: number;     // Pendatang
  newcomerMaleCount?: number;  // Pendatang Laki-laki
  newcomerFemaleCount?: number; // Pendatang Perempuan
  movedOutCount: number;     // Pindah
  movedOutMaleCount?: number;  // Pindah Laki-laki
  movedOutFemaleCount?: number; // Pindah Perempuan
  
  // Data Demografi Akhir
  maleCount: number;         // Laki-laki
  femaleCount: number;       // Perempuan
  
  // Data Musiman
  seasonalCount: number;     // Total Musiman
  seasonalMaleCount: number; // Musiman Laki-laki
  seasonalFemaleCount: number; // Musiman Perempuan
  
  // Kelompok Rentan
  pregnantCount?: number;
  babyCount?: number;
  toddlerCount?: number;
  childCount?: number;
  teenagerCount?: number;
  adultCount?: number;
  elderlyCount?: number;
  widowCount?: number;
  disabilityCount?: number;
  orphanCount?: number;
  
  createdAt: string;
}

// Digital Guest Book & Presensi Kegiatan
export interface Activity {
  id: string;
  title: string;
  description: string;
  date: string; // ISO String
  location: string;
  type: 'Rapat' | 'Kerja Bakti' | 'Arisan' | 'Posyandu' | 'Lainnya';
  qrCode: string; // Activity ID or unique string
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  isMandatory?: boolean;
  compensationAmount?: number;
  compensationApplied?: boolean;
}

export interface Attendance {
  id: string;
  activityId: string;
  residentName: string;
  houseId: string;
  timestamp: string; // ISO String
  note?: string;
}

// Monitoring Kesehatan / Posyandu Digital
export interface HealthRecord {
  id: string;
  residentName: string;
  houseId: string;
  category: 'Bayi' | 'Balita' | 'Remaja' | 'Dewasa' | 'Ibu Hamil' | 'Lansia';
  date: string; // ISO String
  weight?: number; // kg
  height?: number; // cm
  headCircumference?: number; // cm (for babies)
  lila?: number; // Lingkar Lengan Atas (cm)
  bloodPressure?: string; // e.g., "120/80"
  bloodSugar?: number; // mg/dL (for elderly)
  cholesterol?: number; // mg/dL (for elderly)
  uricAcid?: number; // mg/dL (for elderly)
  heartRate?: number; // bpm
  temperature?: number; // Celsius
  immunizationType?: string; // e.g., "BCG", "DPT"
  vitaminA?: boolean; // Vitamin A status
  deworming?: boolean; // Obat Cacing status
  complaints?: string; // Keluhan (for elderly)
  notes?: string;
  officerName: string; // Who recorded the data
}

// Bank Sampah Digital
export interface WasteDeposit {
  id: string;
  houseId: string;
  residentName: string;
  date: string; // ISO String
  type: string; // Dynamic waste type
  weight: number; // kg or liter
  pricePerUnit: number;
  totalValue: number;
  status: 'Pending' | 'Confirmed' | 'Menunggu' | 'Disetujui' | 'Ditolak';
  officerName?: string;
}

export interface WasteBalance {
  houseId: string;
  totalBalance: number;
  lastUpdated: string;
}

export interface WastePrice {
  id: string;
  type: string;
  pricePerUnit: number;
  unit: 'kg' | 'liter';
}

export interface UMKMOrder {
  id: string;
  umkmId: string;
  umkmName?: string;
  customerName: string;
  customerPhone: string;
  houseId: string;
  customerAddress?: string;
  items: string | {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount?: number;
  totalPrice?: number;
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled';
  orderDate: string;
  createdAt?: string;
  pickupDate?: string;
  notes?: string;
}

// Musyawarah Digital (Forum Ide)
// Donasi Sosial & Kas Kematian
export interface DonationCampaign {
  id: string;
  title: string;
  description: string;
  targetAmount?: number;
  currentAmount: number;
  startDate: string;
  endDate?: string;
  status: 'Aktif' | 'Selesai';
  type: 'Kematian' | 'Musibah' | 'Sosial' | 'Pembangunan';
  beneficiaryName?: string;
}

export interface DonationRecord {
  id: string;
  campaignId: string;
  donorName: string;
  houseId: string;
  amount: number;
  date: string;
  note?: string;
  isAnonymous?: boolean;
}

export interface OfficialLetter {
  id: string;
  letterNumber: string;
  subject: string;
  date: string;
  content: string;
  recipient: string;
  type: 'Himbauan' | 'Undangan' | 'Pemberitahuan' | 'Lainnya';
  status: 'Draft' | 'Published';
  createdAt: string;
  updatedAt?: string;
  attachmentUrl?: string; // URL to uploaded file (PDF/Image)
  source?: 'Internal' | 'External';
}

export interface UpdateRequest {
  id: string;
  houseId: string;
  headOfFamily: string;
  gender?: 'Laki-laki' | 'Perempuan';
  birthPlace?: string;
  birthDate?: string;
  phone: string;
  occupants: number;
  residenceType?: 'Tetap' | 'Sewa' | 'Rumah Keluarga';
  nik?: string;
  kkNumber?: string;
  maritalStatus?: 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';
  religion?: string;
  education?: string;
  job?: string;
  jobCategory?: string;
  bloodType?: 'A' | 'B' | 'AB' | 'O' | '-';
  nationality?: string;
  addressKtp?: string;
  bpjsStatus?: 'PPU' | 'PBPU' | 'PBI' | 'Tidak Ada';
  vehicleCount?: number;
  
  // Social Assistance
  isPKH?: boolean;
  isBLT?: boolean;
  isBPNT?: boolean;
  isBansosLain?: boolean;
  bansosLainName?: string;
  economicStatus?: 'Pra-Sejahtera' | 'Sejahtera' | 'Mampu';

  // Demographic Counts
  pregnantCount?: number;
  babyCount?: number;
  toddlerCount?: number;
  teenagerCount?: number;
  adultCount?: number;
  elderlyCount?: number;
  widowCount?: number;
  childCount?: number;

  familyMembers?: {
    name: string;
    nik?: string;
    gender?: 'Laki-laki' | 'Perempuan';
    relation: 'Suami' | 'Istri' | 'Anak' | 'Menantu' | 'Cucu' | 'Orang Tua' | 'Mertua' | 'Saudara' | 'Keponakan' | 'Kakek/Nenek' | 'Pembantu' | 'Famili Lain';
    birthDate?: string;
    job?: string;
  }[];
  reason: string;
  documentUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Menunggu' | 'Disetujui' | 'Ditolak';
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  synopsis: string;
  status: 'Tersedia' | 'Dipinjam' | 'Digital Only';
  ownerName: string;
  ownerHouseId?: string;
  digitalUrl?: string; // If present, it can be read digitally
  coverUrl?: string; // Optional cover image URL
  rating?: number;
  reviews?: {
    reviewerName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  createdAt: string;
}

export interface BookExchangeRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  requesterName: string;
  requesterHouseId: string;
  requesterPhone: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak' | 'Selesai';
  requestType: 'Pinjam Fisik' | 'Donasi Buku';
  requestDate: string;
  notes?: string;
}

export interface ForumComment {
  id: string;
  authorName: string;
  authorHouseId: string;
  content: string;
  date: string;
}

export interface ForumIdea {
  id: string;
  title: string;
  description: string;
  category: 'Fasilitas' | 'Kegiatan' | 'Keamanan' | 'Sosial' | 'Ide Kreatif' | 'Lainnya';
  authorName: string;
  authorHouseId: string;
  date: string;
  upvotes: string[]; // List of house IDs (or voter identifiers)
  downvotes: string[]; // List of house IDs
  status: 'Aspirasi' | 'Ditinjau' | 'Disetujui' | 'Direalisasikan' | 'Ditolak';
  comments: ForumComment[];
  adminNotes?: string;
  createdAt?: string;
}

export interface ResidentVehicle {
  id: string;
  houseId: string;
  plateNumber: string; // Misal: B 1234 ABC
  vehicleType: 'Mobil' | 'Motor' | 'Sepeda Listrik' | 'Lainnya';
  brandModel: string; // Misal: Toyota Avanza, Honda Vario
  color: string; // Misal: Hitam Metalik
  ownerName: string;
  stickerNumber?: string; // Misal: STK-RT02-045
  status: 'Terverifikasi' | 'Menunggu' | 'Ditolak';
  createdAt: string;
}

export interface AssetBorrowRequest {
  id: string;
  houseId: string;
  borrowerName: string;
  borrowerPhone: string;
  itemName: string;
  quantity: number;
  borrowDate: string;
  returnDate: string;
  purpose: string;
  status: 'Menunggu' | 'Disetujui' | 'Dipinjam' | 'Dikembalikan' | 'Ditolak';
  notes?: string;
  createdAt: string;
}

export interface IncomingMail {
  id: string;
  mailNumber: string;         // Nomor Surat Asli Pihak Luar
  agendaNumber: string;       // Nomor Agenda Internal RT
  sender: string;             // Pengirim (misal: Kelurahan Tondo, PLN, Polsek)
  subject: string;            // Perihal Surat
  receivedDate: string;       // Tanggal Diterima (YYYY-MM-DD)
  letterDate: string;         // Tanggal Surat Diterbitkan (YYYY-MM-DD)
  category: 'Undangan' | 'Edaran' | 'Pemberitahuan' | 'Himbauan' | 'Tagihan/Instansi' | 'Lainnya';
  dispositionNotes?: string;  // Catatan Disposisi Ketua RT
  fileUrl?: string;           // URL Lampiran PDF / Foto Surat
  fileType?: 'pdf' | 'image';
  status: 'Menunggu Disposisi' | 'Sudah Ditindaklanjuti' | 'Diarsipkan';
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityWorkTask {
  id: string;
  title: string;          // Misal: Bersihkan Selokan Blok C, Potong Ranting Jalan Utama
  zone: string;           // Misal: Blok A-B, Blok C-D, Lapangan Fasum
  picName: string;        // Penanggung Jawab Zona
  targetHouses?: string[]; // Blok rumah yang ditugaskan
  isDone: boolean;
}

export interface CommunityWorkAttendance {
  houseId: string;
  headOfFamily: string;
  attendedBy: string;    // Nama warga yang hadir mewakili rumah
  status: 'Hadir' | 'Izin / Diwakilkan' | 'Kompensasi' | 'Alpha';
  checkInTime?: string;
  notes?: string;
}

export interface CommunityWork {
  id: string;
  title: string;          // Misal: Kerja Bakti Akbar Menyambut Bulan Ramadan
  description: string;
  date: string;           // YYYY-MM-DD
  startTime: string;      // 07:30
  endTime: string;        // 11:00
  assemblyPoint: string;  // Titik Kumpul (misal: Pos Ronda RT 02)
  toolsNeeded: string[];  // Cangkul, Sabit, Karung Sampah, Sapu Lidi
  snackPIC?: string;      // Seksi Konsumsi
  status: 'Direncanakan' | 'Berlangsung' | 'Selesai' | 'Dibatalkan';
  tasks: CommunityWorkTask[];
  attendances: CommunityWorkAttendance[];
  photoUrls?: string[];
  createdAt: string;
}



