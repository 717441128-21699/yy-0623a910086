import { useState, useMemo, useCallback } from 'react';
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
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { SummaryData, TrendDataItem, PatientStage } from '@/types';
import { clinics } from '@/mock/clinics';
import { doctors } from '@/mock/doctors';
import { patients } from '@/mock/patients';
import { bondingRecords } from '@/mock/records';
import styles from './Dashboard.module.css';

const { RangePicker } = DatePicker;

const stageOptions: { value: PatientStage; label: string }[] = [
  { value: 'initial', label: '初期排齐' },
  { value: 'middle', label: '中期调整' },
  { value: 'late', label: '后期精细' },
  { value: 'finishing', label: '精调结束' },
];

const computeSummary = (
  filteredPatients: typeof patients,
  filteredRecords: typeof bondingRecords
): SummaryData[] => {
  return clinics.map((clinic) => {
    const clinicPatients = filteredPatients.filter((p) => p.clinicId === clinic.id);
    const clinicRecords = filteredRecords.filter((r) =>
      clinicPatients.some((p) => p.id === r.patientId)
    );
    const patientCount = clinicPatients.length;
    const totalAttachments = clinicRecords.reduce((s, r) => s + r.totalCount, 0);
    const reattachCount = clinicRecords.reduce((s, r) => s + r.reattachCount, 0);
    const missingRecords = Math.floor(Math.random() * 3);
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
  }).filter((s) => s.patientCount > 0);
};

const computeTrend = (
  filteredRecords: typeof bondingRecords,
  days: number
): TrendDataItem[] => {
  const data: TrendDataItem[] = [];
  const today = dayjs('2025-06-20');

  for (let i = days - 1; i >= 0; i--) {
    const date = today.subtract(i, 'day').format('YYYY-MM-DD');
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

const getClinicPatient = (clinicId: string) => {
  return patients.find((p) => p.clinicId === clinicId);
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [trendDays, setTrendDays] = useState<number>(7);
  const [appliedFilters, setAppliedFilters] = useState<{
    clinic: string;
    doctor: string;
    stage: string;
    dateStart: string;
    dateEnd: string;
  }>({ clinic: '', doctor: '', stage: '', dateStart: '', dateEnd: '' });

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
    const { clinic, doctor, dateStart, dateEnd } = appliedFilters;
    if (clinic) {
      const clinicPatientIds = patients
        .filter((p) => p.clinicId === clinic)
        .map((p) => p.id);
      result = result.filter((r) => clinicPatientIds.includes(r.patientId));
    }
    if (doctor) result = result.filter((r) => r.doctorId === doctor);
    if (dateStart) result = result.filter((r) => r.date >= dateStart);
    if (dateEnd) result = result.filter((r) => r.date <= dateEnd);
    return result;
  }, [appliedFilters]);

  const summaryData = useMemo(
    () => computeSummary(filteredPatients, filteredRecords),
    [filteredPatients, filteredRecords]
  );

  const trendData = useMemo(
    () => computeTrend(filteredRecords, trendDays),
    [filteredRecords, trendDays]
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
        const p = getClinicPatient(record.clinicId);
        return (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => p && navigate(`/case/${p.id}`)}
              disabled={!p}
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
            type: 'linear',
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
        barWidth: 24,
      },
      {
        name: '重粘率',
        type: 'line',
        yAxisIndex: 1,
        data: trendData.map((item) => item.reattachRate),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#F53F3F', width: 2 },
        itemStyle: { color: '#F53F3F' },
        areaStyle: {
          color: {
            type: 'linear',
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
              <Space>
                <Button
                  size="small"
                  type={trendDays === 7 ? 'primary' : 'default'}
                  onClick={() => setTrendDays(7)}
                >
                  近7天
                </Button>
                <Button
                  size="small"
                  type={trendDays === 30 ? 'primary' : 'default'}
                  onClick={() => setTrendDays(30)}
                >
                  近30天
                </Button>
              </Space>
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
          <Card title="粘接趋势" className={styles.chartCard} bordered={false}>
            <ReactECharts option={getTrendOption()} style={{ height: 320 }} />
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
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
