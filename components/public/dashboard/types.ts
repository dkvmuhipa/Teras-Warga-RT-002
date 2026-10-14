import { 
  House, 
  GuestReport, 
  UpdateRequest, 
  Report, 
  LetterRequest, 
  CommunitySkill, 
  UtilityOutage, 
  WaterMeterReading, 
  WaterUtilitySettings, 
  STBMRecord 
} from '../../../types';

export type DashboardActiveTab = 
  | 'eid' 
  | 'water' 
  | 'points' 
  | 'skills' 
  | 'outages' 
  | 'letters' 
  | 'update' 
  | 'guests' 
  | 'reports' 
  | 'stbm';

export interface CitizenTier {
  name: string;
  color: string;
  badge: string;
}

export interface SkillFormData {
  category: CommunitySkill['category'];
  title: string;
  description: string;
  phone: string;
  rateInfo: string;
}

export interface ReportFormData {
  title: string;
  category: Report['category'];
  description: string;
  photoUrl: string;
  isUrgent: boolean;
}
