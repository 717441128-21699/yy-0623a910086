import type { BondingRecord } from '@/types';

const toothPositions = [
  '11', '12', '13', '14', '15', '16', '17',
  '21', '22', '23', '24', '25', '26', '27',
  '31', '32', '33', '34', '35', '36', '37',
  '41', '42', '43', '44', '45', '46', '47',
];

const attachmentShapes = ['矩形', '椭圆', '三角形', '箭头', '水平矩形', '垂直矩形'];

const generateItems = (count: number, reattachCount: number = 0) => {
  const items = [];
  const selectedTeeth = [...toothPositions].sort(() => Math.random() - 0.5).slice(0, count);
  
  for (let i = 0; i < count; i++) {
    const isReattach = i < reattachCount;
    items.push({
      id: `item-${i}-${Date.now()}-${Math.random()}`,
      toothPosition: selectedTeeth[i],
      attachmentShape: attachmentShapes[Math.floor(Math.random() * attachmentShapes.length)],
      isReattach,
      reason: isReattach ? ['脱落', '位置偏移', '形态调整'][Math.floor(Math.random() * 3)] : undefined,
    });
  }
  return items;
};

const generatePhotos = () => {
  const angles: Array<'front' | 'lateral' | 'occlusal' | 'other'> = ['front', 'lateral', 'occlusal'];
  return angles.map((angle, index) => ({
    id: `photo-${index}-${Date.now()}`,
    angleType: angle,
    url: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(`口腔正畸口内照片，${angle === 'front' ? '正面咬合面' : angle === 'lateral' ? '侧面咬合像' : '咬合面观'}，牙齿整齐，专业牙科摄影风格，临床真实感`)}&image_size=square`,
    remark: '',
  }));
};

export const bondingRecords: BondingRecord[] = [
  {
    id: 'r1',
    patientId: 'p1',
    patientName: '王小明',
    type: 'initial',
    date: '2025-06-15',
    doctorId: 'd1',
    doctorName: '张明远',
    assistant: '护士小王',
    remark: '初粘，患者配合度良好，上下颌各12颗附件',
    totalCount: 24,
    reattachCount: 0,
    items: generateItems(24, 0),
    photos: generatePhotos(),
  },
  {
    id: 'r2',
    patientId: 'p1',
    patientName: '王小明',
    type: 'reattach',
    date: '2025-07-02',
    doctorId: 'd1',
    doctorName: '张明远',
    assistant: '护士小李',
    remark: '14号牙附件脱落重粘，患者反馈咀嚼硬物导致',
    totalCount: 2,
    reattachCount: 2,
    items: [
      { id: 'item-r2-1', toothPosition: '14', attachmentShape: '矩形', isReattach: true, reason: '脱落' },
      { id: 'item-r2-2', toothPosition: '25', attachmentShape: '椭圆', isReattach: true, reason: '脱落' },
    ],
    photos: generatePhotos(),
  },
  {
    id: 'r3',
    patientId: 'p1',
    patientName: '王小明',
    type: 'checkup',
    date: '2025-07-20',
    doctorId: 'd2',
    doctorName: '李雪婷',
    remark: '复诊检查，附件固位良好，无脱落，牙移动符合预期',
    totalCount: 0,
    reattachCount: 0,
    items: [],
    photos: generatePhotos(),
  },
  {
    id: 'r4',
    patientId: 'p2',
    patientName: '李雨桐',
    type: 'initial',
    date: '2025-06-18',
    doctorId: 'd1',
    doctorName: '张明远',
    assistant: '护士小王',
    remark: '初粘，患者口腔卫生良好',
    totalCount: 20,
    reattachCount: 0,
    items: generateItems(20, 0),
    photos: generatePhotos(),
  },
  {
    id: 'r5',
    patientId: 'p3',
    patientName: '陈思远',
    type: 'initial',
    date: '2025-05-10',
    doctorId: 'd2',
    doctorName: '李雪婷',
    assistant: '护士小张',
    remark: '初粘，深覆合病例，附件设计较复杂',
    totalCount: 18,
    reattachCount: 0,
    items: generateItems(18, 0),
    photos: generatePhotos(),
  },
  {
    id: 'r6',
    patientId: 'p3',
    patientName: '陈思远',
    type: 'reattach',
    date: '2025-05-25',
    doctorId: 'd2',
    doctorName: '李雪婷',
    remark: '多个附件脱落重粘，可能与咬合干扰有关',
    totalCount: 3,
    reattachCount: 3,
    items: [
      { id: 'item-r6-1', toothPosition: '16', attachmentShape: '矩形', isReattach: true, reason: '脱落' },
      { id: 'item-r6-2', toothPosition: '26', attachmentShape: '矩形', isReattach: true, reason: '脱落' },
      { id: 'item-r6-3', toothPosition: '36', attachmentShape: '椭圆', isReattach: true, reason: '位置偏移' },
    ],
    photos: generatePhotos(),
  },
  {
    id: 'r7',
    patientId: 'p3',
    patientName: '陈思远',
    type: 'reattach',
    date: '2025-06-12',
    doctorId: 'd2',
    doctorName: '李雪婷',
    remark: '再次重粘，建议患者注意饮食',
    totalCount: 2,
    reattachCount: 2,
    items: [
      { id: 'item-r7-1', toothPosition: '46', attachmentShape: '矩形', isReattach: true, reason: '脱落' },
      { id: 'item-r7-2', toothPosition: '15', attachmentShape: '箭头', isReattach: true, reason: '脱落' },
    ],
    photos: generatePhotos(),
  },
  {
    id: 'r8',
    patientId: 'p4',
    patientName: '赵欣怡',
    type: 'initial',
    date: '2025-06-05',
    doctorId: 'd3',
    doctorName: '王建国',
    assistant: '护士小刘',
    remark: '初粘顺利',
    totalCount: 22,
    reattachCount: 0,
    items: generateItems(22, 0),
    photos: generatePhotos(),
  },
  {
    id: 'r9',
    patientId: 'p5',
    patientName: '刘子豪',
    type: 'initial',
    date: '2025-06-08',
    doctorId: 'd3',
    doctorName: '王建国',
    assistant: '护士小陈',
    remark: '初粘，患者张口度一般，操作时间较长',
    totalCount: 24,
    reattachCount: 0,
    items: generateItems(24, 0),
    photos: generatePhotos(),
  },
  {
    id: 'r10',
    patientId: 'p5',
    patientName: '刘子豪',
    type: 'reattach',
    date: '2025-06-22',
    doctorId: 'd4',
    doctorName: '刘思琪',
    remark: '下前牙区3个附件脱落重粘',
    totalCount: 3,
    reattachCount: 3,
    items: [
      { id: 'item-r10-1', toothPosition: '31', attachmentShape: '矩形', isReattach: true, reason: '脱落' },
      { id: 'item-r10-2', toothPosition: '32', attachmentShape: '矩形', isReattach: true, reason: '脱落' },
      { id: 'item-r10-3', toothPosition: '41', attachmentShape: '矩形', isReattach: true, reason: '脱落' },
    ],
    photos: generatePhotos(),
  },
  {
    id: 'r11',
    patientId: 'p9',
    patientName: '郑嘉豪',
    type: 'initial',
    date: '2025-04-20',
    doctorId: 'd7',
    doctorName: '黄志强',
    assistant: '护士小周',
    remark: '初粘，拔牙病例',
    totalCount: 16,
    reattachCount: 0,
    items: generateItems(16, 0),
    photos: generatePhotos(),
  },
  {
    id: 'r12',
    patientId: 'p9',
    patientName: '郑嘉豪',
    type: 'reattach',
    date: '2025-05-15',
    doctorId: 'd7',
    doctorName: '黄志强',
    remark: '重粘，患者经常吃硬东西',
    totalCount: 4,
    reattachCount: 4,
    items: [
      { id: 'item-r12-1', toothPosition: '14', attachmentShape: '椭圆', isReattach: true, reason: '脱落' },
      { id: 'item-r12-2', toothPosition: '24', attachmentShape: '椭圆', isReattach: true, reason: '脱落' },
      { id: 'item-r12-3', toothPosition: '34', attachmentShape: '矩形', isReattach: true, reason: '脱落' },
      { id: 'item-r12-4', toothPosition: '44', attachmentShape: '矩形', isReattach: true, reason: '脱落' },
    ],
    photos: generatePhotos(),
  },
];

export const getRecordsByPatientId = (patientId: string): BondingRecord[] => {
  return bondingRecords
    .filter(r => r.patientId === patientId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getRecordById = (id: string): BondingRecord | undefined => {
  return bondingRecords.find(r => r.id === id);
};
