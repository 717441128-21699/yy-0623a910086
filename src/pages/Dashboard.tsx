import { useState, useMemo, useCallback, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Divider,
  Modal,
  Drawer,
  message,
} from 'antd';
import {
  UserOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  CopyOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { SummaryData, TrendDataItem, PatientStage, BondingRecord } from '@/types';
import { clinics } from '@/mock/clinics';
import { doctors } from '@/mock/doctors';
import { patients } from '@/mock/patients';
import { bondingRecords } from '@/mock/records';
import { useFeedbackStore } from '@/store/feedbackStore';
import styles from './Dashboard.module.css';

const { RangePicker } = DatePicker;

const stageOptions: { value: PatientStage; label: string }[] = [
  { value: 'initial', label: '初期排齐' },
  { value: 'middle', label: '中期调整' },
  { value: 'late', label: '后期精细' },
  { value: 'finishing', label: '精调结束' },
];

const typeLabels: Record<string, string> = {
  initial: '初次粘接',
  reattach: '重新粘接',
  checkup: '复诊检查',
};

const computeSummary = (
  filteredPatients: typeof patients,
  filteredRecords: typeof bondingRecords
): SummaryData[] => {
  return clinics.map((clinic) => {
    const clinicPatients = filteredPatients.filter((p) => p.clinicId === clinic.id);
    const clinicRecords = filteredRecords.filter((r) =>
      clinicPatients.some((p) => p.id === r.patientId)
    );
    const activePatientIds = new Set(clinicRecords.map((r) => r.patientId));
    const patientCount = activePatientIds.size;
    const totalAttachments = clinicRecords.reduce((s, r) => s + r.totalCount, 0);
    const reattachCount = clinicRecords.reduce((s, r) => s + r.reattachCount, 0);
    const missingRecords = patientCount > 0 ? Math.floor(Math.random() * 2) : 0;
    const reattachRate =
      totalAttachments > 0
        ? Math.round((reattachCount / totalAttachments) * 10000) / 100
        : 0;
    const isAbnormal = reattachRate > 4 || missingRecords >= 2;
    return {
      date: dayjs().format('YYYY-MM-DD'),
      clinicId: clinic.id,
      clinicName: clinic.name,
      patientCount,
      totalAttachments,
      reattachCount,
      missingRecords,
      reattachRate,
      isAbnormal,
    };
  }).filter((s) => s.patientCount > 0 || s.totalAttachments > 0);
};

const computeTrend = (
  filteredRecords: typeof bondingRecords,
  dateStart: string,
  dateEnd: string
): TrendDataItem[] => {
  const data: TrendDataItem[] = [];
  let start: dayjs.Dayjs;
  let end: dayjs.Dayjs;

  if (dateStart && dateEnd) {
    start = dayjs(dateStart);
    end = dayjs(dateEnd);
  } else {
    end = dayjs('2025-06-20');
    start = end.subtract(29, 'day');
  }

  const totalDays = end.diff(start, 'day') + 1;
  for (let i = 0; i < totalDays; i++) {
    const date = start.add(i, 'day').format('YYYY-MM-DD');
    const dayRecords = filteredRecords.filter((r) => r.date === date);
    const patientCount = new Set(dayRecords.map((r) => r.patientId)).size;
    const totalAttachments = dayRecords.reduce((s, r) => s + r.totalCount, 0);
    const reattachCount = dayRecords.reduce((s, r) => s + r.reattachCount, 0);
    const reattachRate =
      totalAttachments > 0
        ? Math.round((reattachCount / totalAttachments) * 10000) / 100
        : 0;
    data.push({ date, patientCount, totalAttachments, reattachRate });
  }

  return data;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const feedbacksList = useFeedbackStore((s) => s.feedbacks);
  const chartRef = useRef<any>(null);
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<{
    clinic: string;
    doctor: string;
    stage: string;
    dateStart: string;
    dateEnd: string;
  }>({ clinic: '', doctor: '', stage: '', dateStart: '', dateEnd: '' });
  const [dayDrawerVisible, setDayDrawerVisible] = useState(false);
  const [dayDrawerData, setDayDrawerData] = useState<{
    date: string;
    records: BondingRecord[];
  }>({ date: '', records: [] });
  const [reportVisible, setReportVisible] = useState(false);

  const filteredPatients = useMemo(() => {
    let result = [...patients];
    const { clinic, doctor, stage } = appliedFilters;
    if (clinic) result = result.filter((p) => p.clinicId === clinic);
    if (doctor) result = result.filter((p) => p.doctorId === doctor);
    if (stage) result = result.filter((p) => p.stage === stage);
    return result;
  }, [appliedFilters]);

  const filteredRecords = useMemo(() => {
    let result = [...bondingRecords];
    const { dateStart, dateEnd } = appliedFilters;
    const filteredPatientIds = filteredPatients.map((p) => p.id);
    result = result.filter((r) => filteredPatientIds.includes(r.patientId));
    if (dateStart) result = result.filter((r) => r.date >= dateStart);
    if (dateEnd) result = result.filter((r) => r.date <= dateEnd);
    return result;
  }, [appliedFilters, filteredPatients]);

  const summaryData = useMemo(
    () => computeSummary(filteredPatients, filteredRecords),
    [filteredPatients, filteredRecords]
  );

  const trendData = useMemo(
    () => computeTrend(filteredRecords, appliedFilters.dateStart, appliedFilters.dateEnd),
    [filteredRecords, appliedFilters.dateStart, appliedFilters.dateEnd]
  );

  const totalPatients = summaryData.reduce((sum, item) => sum + item.patientCount, 0);
  const totalAttachments = summaryData.reduce((sum, item) => sum + item.totalAttachments, 0);
  const totalReattach = summaryData.reduce((sum, item) => sum + item.reattachCount, 0);
  const totalMissing = summaryData.reduce((sum, item) => sum + item.missingRecords, 0);
  const overallReattachRate =
    totalAttachments > 0
      ? Math.round((totalReattach / totalAttachments) * 10000) / 100
      : 0;

  const filteredDoctors = useMemo(() => {
    if (selectedClinic) {
      return doctors.filter((d) => d.clinicId === selectedClinic && d.id !== 'admin');
    }
    return doctors.filter((d) => d.id !== 'admin');
  }, [selectedClinic]);

  const handleQuery = useCallback(() => {
    setAppliedFilters({
      clinic: selectedClinic,
      doctor: selectedDoctor,
      stage: selectedStage,
      dateStart: dateRange?.[0] ? dateRange[0].format('YYYY-MM-DD') : '',
      dateEnd: dateRange?.[1] ? dateRange[1].format('YYYY-MM-DD') : '',
    });
  }, [selectedClinic, selectedDoctor, selectedStage, dateRange]);

  const handleReset = useCallback(() => {
    setSelectedClinic('');
    setSelectedDoctor('');
    setSelectedStage('');
    setDateRange(null);
    setAppliedFilters({ clinic: '', doctor: '', stage: '', dateStart: '', dateEnd: '' });
  }, []);

  const handleClinicChange = (val: string) => {
    setSelectedClinic(val);
    if (val) {
      const clinicDoctorIds = doctors
        .filter((d) => d.clinicId === val && d.id !== 'admin')
        .map((d) => d.id);
      if (selectedDoctor && !clinicDoctorIds.includes(selectedDoctor)) {
        setSelectedDoctor('');
      }
    }
  };

  const handleChartClick = useCallback((params: any) => {
    if (params.componentType === 'series' && params.seriesType === 'bar') {
      const dataIndex = params.dataIndex;
      const trendItem = trendData[dataIndex];
      if (trendItem) {
        const dayRecords = filteredRecords.filter((r) => r.date === trendItem.date);
        setDayDrawerData({ date: trendItem.date, records: dayRecords });
        setDayDrawerVisible(true);
      }
    }
  }, [trendData, filteredRecords]);

  const getTargetPatientForClinic = useCallback((clinicId: string) => {
    const clinicPatients = filteredPatients.filter((p) => p.clinicId === clinicId);
    const clinicRecords = filteredRecords.filter((r) =>
      clinicPatients.some((p) => p.id === r.patientId)
    );
    const recordsByPatient: Record<string, { count: number; reattach: number; latestRecord?: BondingRecord }> = {};
    for (const r of clinicRecords) {
      if (!recordsByPatient[r.patientId]) {
        recordsByPatient[r.patientId] = { count: 0, reattach: 0 };
      }
      recordsByPatient[r.patientId].count++;
      recordsByPatient[r.patientId].reattach += r.reattachCount;
      if (!recordsByPatient[r.patientId].latestRecord || r.date > recordsByPatient[r.patientId].latestRecord!.date) {
        recordsByPatient[r.patientId].latestRecord = r;
      }
    }
    const sorted = clinicPatients
      .map((p) => ({
        patient: p,
        stats: recordsByPatient[p.id] || { count: 0, reattach: 0, latestRecord: undefined },
      }))
      .sort((a, b) => {
        if (b.stats.reattach !== a.stats.reattach) return b.stats.reattach - a.stats.reattach;
        return b.stats.count - a.stats.count;
      });
    return sorted.length > 0 ? sorted[0] : null;
  }, [filteredPatients, filteredRecords]);

  const columns = [
    {
      title: '门诊名称',
      dataIndex: 'clinicName',
      key: 'clinicName',
      width: 160,
      render: (text: string, record: SummaryData) => (
        <span className={record.isAbnormal ? styles.abnormalClinic : ''}>{text}</span>
      ),
    },
    {
      title: '粘接人数',
      dataIndex: 'patientCount',
      key: 'patientCount',
      width: 100,
      sorter: (a: SummaryData, b: SummaryData) => a.patientCount - b.patientCount,
      render: (val: number) => <span className={styles.numCell}>{val}</span>,
    },
    {
      title: '附件颗数',
      dataIndex: 'totalAttachments',
      key: 'totalAttachments',
      width: 100,
      sorter: (a: SummaryData, b: SummaryData) => a.totalAttachments - b.totalAttachments,
      render: (val: number) => <span className={styles.numCell}>{val}</span>,
    },
    {
      title: '重粘次数',
      dataIndex: 'reattachCount',
      key: 'reattachCount',
      width: 100,
      sorter: (a: SummaryData, b: SummaryData) => a.reattachCount - b.reattachCount,
      render: (val: number, record: SummaryData) => (
        <span className={`${styles.numCell} ${record.reattachRate > 4 ? styles.abnormalNum : ''}`}>
          {val}
        </span>
      ),
    },
    {
      title: '重粘率',
      dataIndex: 'reattachRate',
      key: 'reattachRate',
      width: 100,
      sorter: (a: SummaryData, b: SummaryData) => a.reattachRate - b.reattachRate,
      render: (val: number) => {
        const isHigh = val > 4;
        return (
          <Tag color={isHigh ? 'red' : 'green'} className={styles.rateTag}>
            {val}%
          </Tag>
        );
      },
    },
    {
      title: '缺失记录',
      dataIndex: 'missingRecords',
      key: 'missingRecords',
      width: 100,
      sorter: (a: SummaryData, b: SummaryData) => a.missingRecords - b.missingRecords,
      render: (val: number) => (
        <span className={`${styles.numCell} ${val >= 2 ? styles.abnormalNum : ''}`}>
          {val > 0 && <WarningOutlined className={styles.warningIcon} />}
          {val}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: SummaryData) => {
        const target = getTargetPatientForClinic(record.clinicId);
        const highlightRecordId = target?.stats.latestRecord?.id;
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                if (target) {
                  const params = new URLSearchParams();
                  if (highlightRecordId) params.set('highlightRecordId', highlightRecordId);
                  navigate(`/case/${target.patient.id}?${params.toString()}`);
                }
              }}
              disabled={!target}
            >
              查看病例
            </Button>
          </Space>
        );
      },
    },
  ];

  const getTrendOption = () => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
    },
    legend: {
      data: ['粘接人数', '重粘率'],
      right: 20,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: trendData.map((item) => item.date.slice(5)),
      axisLine: { lineStyle: { color: '#C9CDD4' } },
      axisLabel: { color: '#4E5969' },
    },
    yAxis: [
      {
        type: 'value',
        name: '人数',
        position: 'left',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#4E5969' },
        splitLine: { lineStyle: { color: '#F2F3F5' } },
      },
      {
        type: 'value',
        name: '重粘率(%)',
        position: 'right',
        min: 0,
        max: 6,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#4E5969', formatter: '{value}%' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '粘接人数',
        type: 'bar',
        data: trendData.map((item) => item.patientCount),
        itemStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#165DFF' },
              { offset: 1, color: '#4080FF' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: trendData.length > 15 ? 12 : 24,
      },
      {
        name: '重粘率',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map((item) => item.reattachRate),
        smooth: true,
        symbol: 'circle',
        symbolSize: trendData.length > 15 ? 4 : 8,
        lineStyle: { color: '#F53F3F', width: 2 },
        itemStyle: { color: '#F53F3F' },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(245, 63, 63, 0.2)' },
              { offset: 1, color: 'rgba(245, 63, 63, 0)' },
            ],
          },
        },
      },
    ],
  });

  const hasActiveFilter =
    appliedFilters.clinic || appliedFilters.doctor || appliedFilters.stage || appliedFilters.dateStart || appliedFilters.dateEnd;

  const pendingFeedbacks = feedbacksList.filter((f) => f.status === 'pending').length;

  const generateReport = useCallback(() => {
    const { clinic, doctor, stage, dateStart, dateEnd } = appliedFilters;
    const dateDesc = dateStart && dateEnd ? `${dateStart} ~ ${dateEnd}` : '近30天';
    const clinicDesc = clinic ? clinics.find((c) => c.id === clinic)?.name || '' : '全部门诊';
    const doctorDesc = doctor ? doctors.find((d) => d.id === doctor)?.name || '' : '全部医生';
    const stageDesc = stage ? stageOptions.find((s) => s.value === stage)?.label || '' : '全部阶段';

    let report = `正畸质控周报\n`;
    report += `${'='.repeat(40)}\n`;
    report += `生成时间：${dayjs().format('YYYY-MM-DD HH:mm')}\n`;
    report += `筛选范围：${dateDesc} | ${clinicDesc} | ${doctorDesc} | ${stageDesc}\n\n`;

    report += `一、总览数据\n${'-'.repeat(30)}\n`;
    report += `  粘接人数：${totalPatients} 人\n`;
    report += `  附件颗数：${totalAttachments} 颗\n`;
    report += `  重粘次数：${totalReattach} 次\n`;
    report += `  整体重粘率：${overallReattachRate}%\n`;
    report += `  缺失记录：${totalMissing} 条\n`;
    report += `  待处理反馈：${pendingFeedbacks} 条\n\n`;

    report += `二、分院明细\n${'-'.repeat(30)}\n`;
    for (const row of summaryData) {
      const flag = row.isAbnormal ? ' ⚠️ 异常' : '';
      report += `  ${row.clinicName}${flag}\n`;
      report += `    人数:${row.patientCount}  附件:${row.totalAttachments}  重粘:${row.reattachCount}  重粘率:${row.reattachRate}%  缺失:${row.missingRecords}\n`;
    }
    report += '\n';

    report += `三、高风险病例\n${'-'.repeat(30)}\n`;
    const highRiskPatients = filteredPatients.filter((p) => p.reattachCount > 2);
    if (highRiskPatients.length === 0) {
      report += `  当前筛选范围内无高风险病例\n`;
    } else {
      for (const p of highRiskPatients) {
        report += `  ${p.name}（${p.patientNo}）- ${p.clinicName} - ${p.doctorName}\n`;
        report += `    阶段:${stageOptions.find((s) => s.value === p.stage)?.label}  累计附件:${p.totalAttachments}  重粘:${p.reattachCount}次\n`;
      }
    }
    report += '\n';

    report += `四、待处理质控反馈\n${'-'.repeat(30)}\n`;
    const pendingFbs = feedbacksList.filter((f) => f.status === 'pending');
    if (pendingFbs.length === 0) {
      report += `  无待处理反馈\n`;
    } else {
      for (const fb of pendingFbs) {
        report += `  [${fb.clinicName}] ${fb.patientName} → ${fb.toDoctorName}\n`;
        report += `    ${fb.content.slice(0, 60)}${fb.content.length > 60 ? '...' : ''}\n`;
        report += `    截止：${fb.deadline || '未设定'}\n`;
      }
    }

    return report;
  }, [appliedFilters, totalPatients, totalAttachments, totalReattach, totalMissing, overallReattachRate, summaryData, filteredPatients, feedbacksList, pendingFeedbacks]);

  const handleCopyReport = useCallback(() => {
    const report = generateReport();
    navigator.clipboard.writeText(report).then(() => {
      message.success('周报已复制到剪贴板');
    });
  }, [generateReport]);

  const handleDownloadReport = useCallback(() => {
    const report = generateReport();
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `正畸质控周报_${dayjs().format('YYYYMMDD')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('周报已下载');
  }, [generateReport]);

  const dayDrawerColumns = [
    {
      title: '患者',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 100,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color={type === 'initial' ? 'blue' : type === 'reattach' ? 'orange' : 'green'}>{typeLabels[type]}</Tag>,
    },
    {
      title: '操作医生',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 100,
    },
    {
      title: '附件数',
      dataIndex: 'totalCount',
      key: 'totalCount',
      width: 80,
    },
    {
      title: '重粘数',
      dataIndex: 'reattachCount',
      key: 'reattachCount',
      width: 80,
      render: (val: number) => val > 0 ? <span style={{ color: '#F53F3F', fontWeight: 600 }}>{val}</span> : val,
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_: unknown, record: BondingRecord) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setDayDrawerVisible(false);
            const params = new URLSearchParams();
            params.set('highlightRecordId', record.id);
            navigate(`/case/${record.patientId}?${params.toString()}`);
          }}
        >
          查看
        </Button>
      ),
    },
  ];

  const trendDateLabel = appliedFilters.dateStart && appliedFilters.dateEnd
    ? `${appliedFilters.dateStart} ~ ${appliedFilters.dateEnd}`
    : '近30天';

  return (
    <div className={styles.dashboard}>
      <Card className={styles.filterCard} bordered={false}>
        <Row gutter={16} align="middle">
          <Col span={7}>
            <div className={styles.filterLabel}>日期范围</div>
            <RangePicker
              value={dateRange as [dayjs.Dayjs, dayjs.Dayjs] | null}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null] | null)}
              style={{ width: '100%' }}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col span={4}>
            <div className={styles.filterLabel}>分院</div>
            <Select
              placeholder="全部门诊"
              value={selectedClinic || undefined}
              onChange={handleClinicChange}
              allowClear
              style={{ width: '100%' }}
            >
              {clinics.map((clinic) => (
                <Select.Option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <div className={styles.filterLabel}>医生</div>
            <Select
              placeholder="全部医生"
              value={selectedDoctor || undefined}
              onChange={setSelectedDoctor}
              allowClear
              showSearch
              style={{ width: '100%' }}
            >
              {filteredDoctors.map((doctor) => (
                <Select.Option key={doctor.id} value={doctor.id}>
                  {doctor.name} - {doctor.title}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={4}>
            <div className={styles.filterLabel}>病例阶段</div>
            <Select
              placeholder="全部阶段"
              value={selectedStage || undefined}
              onChange={setSelectedStage}
              allowClear
              style={{ width: '100%' }}
            >
              {stageOptions.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col span={5} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleQuery}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
            {hasActiveFilter && (
              <Tag icon={<FilterOutlined />} color="blue" className={styles.filterTag}>
                已筛选
              </Tag>
            )}
          </Col>
        </Row>
      </Card>

      <Row gutter={16} className={styles.statsRow}>
        <Col span={6}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #165DFF, #4080FF)' }}>
                <UserOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>粘接人数</div>
                <div className={styles.statValue}>{totalPatients}</div>
                <div className={styles.statTrend}>
                  <ArrowUpOutlined className={styles.trendUp} />
                  <span>共 {filteredPatients.length} 名患者</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #00B42A, #23C343)' }}>
                <AppstoreOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>附件颗数</div>
                <div className={styles.statValue}>{totalAttachments}</div>
                <div className={styles.statTrend}>
                  <span>来自 {filteredRecords.length} 条记录</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #FF7D00, #FF9A2E)' }}>
                <ReloadOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>重粘次数</div>
                <div className={`${styles.statValue} ${totalReattach > 20 ? styles.abnormalValue : ''}`}>
                  {totalReattach}
                </div>
                <div className={styles.statTrend}>
                  <ArrowDownOutlined className={styles.trendDown} />
                  <span>重粘率 {overallReattachRate}%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #F53F3F, #FF7D00)' }}>
                <WarningOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>缺失记录</div>
                <div className={`${styles.statValue} ${totalMissing > 5 ? styles.abnormalValue : ''}`}>
                  {totalMissing}
                </div>
                <div className={styles.statTrend}>
                  <span className={styles.missingHint}>需关注</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} className={styles.contentRow}>
        <Col span={16}>
          <Card
            title="门诊数据明细"
            className={styles.tableCard}
            bordered={false}
            extra={
              <Button icon={<BarChartOutlined />} onClick={() => setReportVisible(true)}>
                质控周报
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={summaryData}
              rowKey="clinicId"
              pagination={false}
              size="middle"
              rowClassName={(record) => (record.isAbnormal ? styles.abnormalRow : '')}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card title={`粘接趋势 (${trendDateLabel})`} className={styles.chartCard} bordered={false}>
            <ReactECharts
              ref={chartRef}
              option={getTrendOption()}
              style={{ height: 320 }}
              onEvents={{ click: handleChartClick }}
            />
            <Divider style={{ margin: '16px 0' }} />
            <div className={styles.legendInfo}>
              <div className={styles.legendItem}>
                <span className={styles.legendDotBlue}></span>
                <span>日均粘接</span>
                <span className={styles.legendValue}>
                  {trendData.length > 0
                    ? Math.round(
                        trendData.reduce((s, d) => s + d.patientCount, 0) / trendData.length
                      )
                    : 0}
                  人/天
                </span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDotRed}></span>
                <span>平均重粘率</span>
                <span className={`${styles.legendValue} ${styles.textRed}`}>
                  {overallReattachRate}%
                </span>
              </div>
              <div className={styles.chartHint}>
                点击柱状图可查看当日详情
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Drawer
        title={`${dayDrawerData.date} 粘接记录明细`}
        open={dayDrawerVisible}
        onClose={() => setDayDrawerVisible(false)}
        width={680}
      >
        {dayDrawerData.records.length > 0 ? (
          <>
            <div className={styles.drawerSummary}>
              <Space size={24}>
                <span>涉及患者：<b>{new Set(dayDrawerData.records.map((r) => r.patientId)).size}</b> 人</span>
                <span>粘接记录：<b>{dayDrawerData.records.length}</b> 条</span>
                <span>附件总数：<b>{dayDrawerData.records.reduce((s, r) => s + r.totalCount, 0)}</b> 颗</span>
                <span>重粘：<b style={{ color: '#F53F3F' }}>{dayDrawerData.records.reduce((s, r) => s + r.reattachCount, 0)}</b> 次</span>
              </Space>
            </div>
            <Table
              columns={dayDrawerColumns}
              dataSource={dayDrawerData.records}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </>
        ) : (
          <div className={styles.drawerEmpty}>当日无粘接记录</div>
        )}
      </Drawer>

      <Modal
        title="质控周报"
        open={reportVisible}
        onCancel={() => setReportVisible(false)}
        width={680}
        footer={
          <Space>
            <Button icon={<CopyOutlined />} onClick={handleCopyReport}>
              复制文本
            </Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadReport}>
              下载文件
            </Button>
            <Button onClick={() => setReportVisible(false)}>关闭</Button>
          </Space>
        }
      >
        <pre className={styles.reportPreview}>{generateReport()}</pre>
      </Modal>
    </div>
  );
};

export default Dashboard;
