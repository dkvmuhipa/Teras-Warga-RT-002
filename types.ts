
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
  paymentStatus: PaymentStatus;
  phone?: string;
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
  type: 'Pengantar KTP' | 'Pengantar KK' | 'Domisili' | 'Kematian' | 'Kelahiran' | 'Surat Keterangan Usaha (SKU)';
  applicantName: string;
  houseId: string; // Alamat Domisili di RT (Blok)
  
  // Data Tambahan Sesuai PDF
  nik: string;
  birthPlace: string;
  birthDate: string;
  religion: string;
  gender: 'LAKI-LAKI' | 'PEREMPUAN';
  job: string;
  maritalStatus: 'KAWIN' | 'BELUM KAWIN' | 'CERAI HIDUP' | 'CERAI MATI';
  addressKtp: string; // Alamat sesuai KTP (bisa beda dengan domisili)
  
  status: 'Pending' | 'Approved' | 'Rejected';
  date: string;
}

// New Types
export interface RondaSchedule {
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