import type { Doctor } from '@/types';

export const doctors: Doctor[] = [
  { id: 'd1', name: '张明远', clinicId: 'c1', title: '主任医师' },
  { id: 'd2', name: '李雪婷', clinicId: 'c1', title: '副主任医师' },
  { id: 'd3', name: '王建国', clinicId: 'c2', title: '主任医师' },
  { id: 'd4', name: '刘思琪', clinicId: 'c2', title: '主治医师' },
  { id: 'd5', name: '陈博文', clinicId: 'c3', title: '副主任医师' },
  { id: 'd6', name: '林雨萱', clinicId: 'c3', title: '主治医师' },
  { id: 'd7', name: '黄志强', clinicId: 'c4', title: '主任医师' },
  { id: 'd8', name: '郑雅琳', clinicId: 'c4', title: '副主任医师' },
  { id: 'd9', name: '吴俊峰', clinicId: 'c5', title: '副主任医师' },
  { id: 'd10', name: '赵晓蕾', clinicId: 'c5', title: '主治医师' },
  { id: 'admin', name: '质控主管', clinicId: '', title: '运营主管' },
];

export const getDoctorById = (id: string): Doctor | undefined => {
  return doctors.find(d => d.id === id);
};
