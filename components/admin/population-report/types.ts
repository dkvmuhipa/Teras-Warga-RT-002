import { PopulationReport, PopulationChangeLog, House, PdfConfig } from '../../../types';

export interface PopulationLiveStats {
  totalSoul: number;
  totalMale: number;
  totalFemale: number;
  totalTetap: number;
  tetapMale: number;
  tetapFemale: number;
  totalMusiman: number;
  musimanMale: number;
  musimanFemale: number;
  housesTetap: number;
  housesMusiman: number;
  housesFemaleHoF: number;
  housesMaleHoF: number;
  vulnerableTotal: number;
  totalPregnant: number;
  totalBaby: number;
  totalToddler: number;
  totalChild: number;
  totalTeenager: number;
  totalAdult: number;
  totalElderly: number;
  totalWidow: number;
  totalDisability: number;
  totalOrphan: number;
}

export interface PopulationReportFormData extends Omit<PopulationReport, 'id' | 'createdAt'> {}

export interface PopulationLogFormData {
  type: PopulationChangeLog['type'];
  name: string;
  phone: string;
  houseId: string;
  date: string;
  description: string;
  documentUrl: string;
  verificationStatus: 'Pending' | 'Approved' | 'Rejected';
  approvalNotes: string;
  details: {
    previousAddress: string;
    reasonForMoving: string;
    familyCount: number;
    familyMembers: { name: string; relationship: string; nik?: string }[];
    residenceType: 'Tetap' | 'Sewa' | 'Rumah Keluarga';
    religion: string;
    vulnerability: string[];
    kkNumber: string;
    jobCategory: string;
    education: string;
    ownerName: string;
    ownerPhone: string;
    newAddress: string;
    fatherName: string;
    motherName: string;
    gender: 'Laki-laki' | 'Perempuan';
    causeOfDeath: string;
    placeOfDeath: string;
  };
}
