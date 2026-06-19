import type { Feedback, SummaryData, TrendDataItem } from '@/types';
import { clinics } from './clinics';

export const feedbacks: Feedback[] = [
  {
    id: 'f1',
    recordId: 'r7',
    recordType: 'reattach',
    recordDate: '2025-06-12',
    patientId: 'p3',
    patientName: '陈思远',
    fromDoctorId: 'admin',
    fromDoctorName: '质控主管',
    toDoctorId: 'd2',
    toDoctorName: '李雪婷',
    content: '该患者重粘次数达5次，远高于平均水平。请分析原因：1. 牙位描述是否准确？2. 照片缺少咬合面照，无法判断粘接质量。3. 重粘原因记录不够详细，请补充患者口腔卫生情况和饮食习惯评估。',
    status: 'pending',
    createdAt: '2025-06-15 10:30:00',
    deadline: '2025-06-18',
    clinicId: 'c1',
    clinicName: '北京朝阳分院',
  },
  {
    id: 'f2',
    recordId: 'r10',
    recordType: 'reattach',
    recordDate: '2025-06-22',
    patientId: 'p5',
    patientName: '刘子豪',
    fromDoctorId: 'admin',
    fromDoctorName: '质控主管',
    toDoctorId: 'd4',
    toDoctorName: '刘思琪',
    content: '下前牙区多个附件同时脱落，建议检查：1. 酸蚀时间是否充足；2. 粘接剂涂布是否均匀；3. 患者是否有夜磨牙习惯。另外照片角度不规范，缺少正面照。',
    status: 'processing',
    createdAt: '2025-06-23 14:20:00',
    deadline: '2025-06-26',
    reply: '已检查患者，酸蚀时间正常。患者确有夜磨牙情况，已建议佩戴咬颌垫。照片问题已反馈给护士，下次注意拍摄角度。',
    replyAt: '2025-06-24 09:15:00',
    clinicId: 'c2',
    clinicName: '北京海淀分院',
  },
  {
    id: 'f3',
    recordId: 'r12',
    recordType: 'reattach',
    recordDate: '2025-05-15',
    patientId: 'p9',
    patientName: '郑嘉豪',
    fromDoctorId: 'admin',
    fromDoctorName: '质控主管',
    toDoctorId: 'd7',
    toDoctorName: '黄志强',
    content: '该患者重粘率偏高，且四个象限前磨牙同时脱落，怀疑是咬合干扰导致。请检查咬合关系，必要时调整附件位置。另外附件形态记录不完整，请标注每颗牙的具体附件类型。',
    status: 'pending',
    createdAt: '2025-06-18 11:00:00',
    deadline: '2025-06-21',
    clinicId: 'c4',
    clinicName: '广州天河分院',
  },
  {
    id: 'f4',
    recordId: 'r2',
    recordType: 'reattach',
    recordDate: '2025-07-02',
    patientId: 'p1',
    patientName: '王小明',
    fromDoctorId: 'admin',
    fromDoctorName: '质控主管',
    toDoctorId: 'd1',
    toDoctorName: '张明远',
    content: '附件脱落原因记录为"患者反馈咀嚼硬物导致"，但未记录医生的专业判断。请补充：脱落面形态、粘接剂残留情况、是否存在釉质异常等临床观察。',
    status: 'completed',
    createdAt: '2025-07-03 16:45:00',
    deadline: '2025-07-06',
    reply: '已补充记录：脱落面可见粘接剂部分残留于牙面，釉质正常。考虑为患者进食硬物导致的机械性脱落。已再次强调饮食注意事项。',
    replyAt: '2025-07-04 10:30:00',
    clinicId: 'c1',
    clinicName: '北京朝阳分院',
  },
  {
    id: 'f5',
    recordId: 'r4',
    recordType: 'initial',
    recordDate: '2025-06-18',
    patientId: 'p2',
    patientName: '李雨桐',
    fromDoctorId: 'admin',
    fromDoctorName: '质控主管',
    toDoctorId: 'd1',
    toDoctorName: '张明远',
    content: '初粘记录缺少侧面咬合照，无法评估附件的颊舌向位置是否准确。请补拍或在后续复诊中注意拍摄标准角度照片。',
    status: 'completed',
    createdAt: '2025-06-20 09:00:00',
    deadline: '2025-06-23',
    reply: '已在复诊时补拍标准照片，已存入病历系统。',
    replyAt: '2025-06-22 15:00:00',
    clinicId: 'c1',
    clinicName: '北京朝阳分院',
  },
  {
    id: 'f6',
    recordId: 'r6',
    recordType: 'reattach',
    recordDate: '2025-05-25',
    patientId: 'p3',
    patientName: '陈思远',
    fromDoctorId: 'admin',
    fromDoctorName: '质控主管',
    toDoctorId: 'd2',
    toDoctorName: '李雪婷',
    content: '重粘记录中牙位描述"后牙区多颗"不够精确，请明确具体牙位号。另照片模糊，建议检查摄影设备。',
    status: 'rejected',
    createdAt: '2025-05-28 10:00:00',
    deadline: '2025-05-31',
    reply: '牙位已补充为16、26、36。照片清晰度问题是由于当时患者口水较多，已重新拍摄存档。',
    replyAt: '2025-05-29 14:00:00',
    clinicId: 'c1',
    clinicName: '北京朝阳分院',
  },
];

export const generateSummaryData = (date: string = '2025-06-20'): SummaryData[] => {
  return clinics.map((clinic, index) => {
    const patientCount = 8 + index * 2 + Math.floor(Math.random() * 5);
    const totalAttachments = patientCount * (18 + Math.floor(Math.random() * 6));
    const reattachCount = Math.floor(patientCount * (0.15 + Math.random() * 0.2));
    const missingRecords = Math.floor(Math.random() * 3);
    const reattachRate = (reattachCount / totalAttachments) * 100;
    const isAbnormal = reattachRate > 4 || missingRecords >= 2;

    return {
      date,
      clinicId: clinic.id,
      clinicName: clinic.name,
      patientCount,
      totalAttachments,
      reattachCount,
      missingRecords,
      reattachRate: Math.round(reattachRate * 100) / 100,
      isAbnormal,
    };
  });
};

export const generateTrendData = (days: number = 7): TrendDataItem[] => {
  const data: TrendDataItem[] = [];
  const today = new Date('2025-06-20');

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const patientCount = 35 + Math.floor(Math.random() * 20);
    const totalAttachments = patientCount * (18 + Math.floor(Math.random() * 6));
    const reattachCount = Math.floor(totalAttachments * (0.02 + Math.random() * 0.03));
    const reattachRate = Math.round((reattachCount / totalAttachments) * 10000) / 100;

    data.push({ date: dateStr, patientCount, totalAttachments, reattachRate });
  }

  return data;
};

export const getFeedbacksByStatus = (status?: string): Feedback[] => {
  if (!status || status === 'all') return feedbacks;
  return feedbacks.filter(f => f.status === status);
};
