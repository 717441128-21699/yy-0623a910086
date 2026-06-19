import { useState, useEffect } from 'react';
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
  Tooltip,
  Statistic,
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
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { SummaryData, TrendDataItem } from '@/types';
import { generateSummaryData, generateTrendData } from '@/mock/feedbacks';
import { clinics } from '@/mock/clinics';
import { doctors } from '@/mock/doctors';
import styles from './Dashboard.module.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState<SummaryData[]>([]);
  const [trendData, setTrendData] = useState<TrendDataItem[]>([]);
  const [selectedClinic, setSelectedClinic] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [dateRange, setDateRange] = useState<(dayjs.Dayjs | null)[] | null>([
    dayjs().subtract(6, 'day'),
    dayjs(),
  ]);
  const [trendDays, setTrendDays] = useState<number>(7);

  useEffect(() => {
    setSummaryData(generateSummaryData());
    setTrendData(generateTrendData(trendDays));
  }, [trendDays]);

  const totalPatients = summaryData.reduce((sum, item) => sum + item.patientCount, 0);
  const totalAttachments = summaryData.reduce((sum, item) => sum + item.totalAttachments, 0);
  const totalReattach = summaryData.reduce((sum, item) => sum + item.reattachCount, 0);
  const totalMissing = summaryData.reduce((sum, item) => sum + item.missingRecords, 0);
  const overallReattachRate = totalAttachments > 0
    ? Math.round((totalReattach / totalAttachments) * 10000) / 100
    : 0;

  const columns = [
    {
      title: '门诊名称',
      dataIndex: 'clinicName',
      key: 'clinicName',
      width: 160,
      render: (text: string, record: SummaryData) => (
        <span className={record.isAbnormal ? styles.abnormalClinic : ''}>
          {text}
        </span>
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
      render: () => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate('/case/p1')}
          >
            查看病例
          </Button>
        </Space>
      ),
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
      data: trendData.map(item => item.date.slice(5)),
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
        data: trendData.map(item => item.patientCount),
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
        data: trendData.map(item => item.reattachRate),
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

  return (
    <div className={styles.dashboard}>
      <Card className={styles.filterCard} bordered={false}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <div className={styles.filterLabel}>日期范围</div>
            <RangePicker
              value={dateRange as [dayjs.Dayjs, dayjs.Dayjs]}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs | null, dayjs.Dayjs | null])}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={5}>
            <div className={styles.filterLabel}>分院</div>
            <Select
              placeholder="全部门诊"
              value={selectedClinic || undefined}
              onChange={setSelectedClinic}
              allowClear
              style={{ width: '100%' }}
            >
              {clinics.map(clinic => (
                <Option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col span={5}>
            <div className={styles.filterLabel}>医生</div>
            <Select
              placeholder="全部医生"
              value={selectedDoctor || undefined}
              onChange={setSelectedDoctor}
              allowClear
              showSearch
              style={{ width: '100%' }}
            >
              {doctors
                .filter(d => d.id !== 'admin')
                .map(doctor => (
                  <Option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.title}
                  </Option>
                ))}
            </Select>
          </Col>
          <Col span={6} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <Button type="primary" icon={<SearchOutlined />}>
              查询
            </Button>
            <Button icon={<ReloadOutlined />}>重置</Button>
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
                  <span>较上周 +12%</span>
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
                  <ArrowUpOutlined className={styles.trendUp} />
                  <span>较上周 +8%</span>
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
                <Button size="small" type={trendDays === 7 ? 'primary' : 'default'} onClick={() => setTrendDays(7)}>
                  近7天
                </Button>
                <Button size="small" type={trendDays === 30 ? 'primary' : 'default'} onClick={() => setTrendDays(30)}>
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
              rowClassName={(record) => record.isAbnormal ? styles.abnormalRow : ''}
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
                <span className={styles.legendValue}>{Math.round(totalPatients / 7)}人/天</span>
              </div>
              <div className={styles.legendItem}>
                <span className={styles.legendDotRed}></span>
                <span>平均重粘率</span>
                <span className={`${styles.legendValue} ${styles.textRed}`}>{overallReattachRate}%</span>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
