export type BondingType = 'initial' | 'reattach' | 'checkup';

export type FeedbackStatus = 'pending' | 'processing' | 'completed' | 'rejected';

export type PatientStage = 'initial' | 'middle' | 'late' | 'finishing';

export type PhotoAngleType = 'front' | 'lateral' | 'occlusal' | 'other';

export interface Clinic {
  id: string;
  name: string;
  address: string;
}

export interface Doctor {
  id: string;
  name: string;
  clinicId: string;
  title: string;
}

export interface Patient {
  id: string;
  name: string;
  patientNo: string;
  age: number;
  doctorId: string;
  doctorName: string;
  stage: PatientStage;
  clinicId: string;
  clinicName: string;
  totalAttachments: number;
  reattachCount: number;
}

export interface BondingItem {
  id: string;
  toothPosition: string;
  attachmentShape: string;
  isReattach: boolean;
  reason?: string;
}

export interface BondingPhoto {
  id: string;
  angleType: PhotoAngleType;
  url: string;
  remark?: string;
}

export interface BondingRecord {
  id: string;
  patientId: string;
  patientName: string;
  type: BondingType;
  date: string;
  doctorId: string;
  doctorName: string;
  assistant?: string;
  remark?: string;
  totalCount: number;
  reattachCount: number;
  items: BondingItem[];
  photos: BondingPhoto[];
}

export interface Feedback {
  id: string;
  recordId: string;
  recordType: BondingType;
  recordDate: string;
  patientId: string;
  patientName: string;
  fromDoctorId: string;
  fromDoctorName: string;
  toDoctorId: string;
  toDoctorName: string;
  content: string;
  status: FeedbackStatus;
  createdAt: string;
  deadline?: string;
  reply?: string;
  replyAt?: string;
  clinicId: string;
  clinicName: string;
}

export interface SummaryData {
  date: string;
  clinicId: string;
  clinicName: string;
  patientCount: number;
  totalAttachments: number;
  reattachCount: number;
  missingRecords: number;
  reattachRate: number;
  isAbnormal?: boolean;
}

export interface TrendDataItem {
  date: string;
  patientCount: number;
  totalAttachments: number;
  reattachRate: number;
}
