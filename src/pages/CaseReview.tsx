import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Modal,
  Input,
  message,
  Empty,
} from 'antd';
import {
  UserOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ArrowRightOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CameraOutlined,
  EditOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { RiskPatient, PatientStage, BondingRecord } from '@/types';
import { clinics } from '@/mock/clinics';
import { doctors } from '@/mock/doctors';
import { patients } from '@/mock/patients';
import { bondingRecords } from '@/mock/records';
import { useFeedbackStore } from '@/store/feedbackStore';
import { useReviewStore } from '@/store/reviewStore';
import styles from './CaseReview.module.css';

const { TextArea } = Input;

const stageLabels: Record<PatientStage, string> = {
  initial: '初期排齐',
  middle: '中期调整',
  late: '后期精细',
  finishing: '精调结束',
};

const typeLabels: Record<string, string> = {
  initial: '初次粘接',
  reattach: '重新粘接',
  checkup: '复诊检查',
};

const computeRiskPatients = (
  filterClinic: string,
  filterDoctor: string,
  filterStage: string,
  dateStart: string,
  dateEnd: string,
  feedbacks: ReturnType<typeof useFeedbackStore.getState>['feedbacks']
): Array<Omit<RiskPatient, 'isReviewed' | 'reviewedAt'>> => {
  let filteredPatients = [...patients];
  if (filterClinic) filteredPatients = filteredPatients.filter((p) => p.clinicId === filterClinic);
  if (filterDoctor) filteredPatients = filteredPatients.filter((p) => p.doctorId === filterDoctor);
  if (filterStage) filteredPatients = filteredPatients.filter((p) => p.stage === filterStage);

  const filteredPatientIds = new Set(filteredPatients.map((p) => p.id));
  let filteredRecords = bondingRecords.filter((r) => filteredPatientIds.has(r.patientId));
  if (dateStart) filteredRecords = filteredRecords.filter((r) => r.date >= dateStart);
  if (dateEnd) filteredRecords = filteredRecords.filter((r) => r.date <= dateEnd);

  const pendingFeedbacks = feedbacks.filter(
    (f) => f.status === 'pending' && filteredPatientIds.has(f.patientId)
  );

  const recordsByPatient: Record<string, BondingRecord[]> = {};
  for (const r of filteredRecords) {
    if (!recordsByPatient[r.patientId]) recordsByPatient[r.patientId] = [];
    recordsByPatient[r.patientId].push(r);
  }

  const result: Array<Omit<RiskPatient, 'isReviewed' | 'reviewedAt'>> = [];
  for (const p of filteredPatients) {
    const pRecords = recordsByPatient[p.id] || [];
    if (pRecords.length === 0) continue;

    const reattachCount = pRecords.reduce((s, r) => s + r.reattachCount, 0);
    const totalAttachments = pRecords.reduce((s, r) => s + r.totalCount, 0);
    const pendingFeedbackCount = pendingFeedbacks.filter((f) => f.patientId === p.id).length;
    const hasPhotoRisk = pRecords.some((r) => r.photos.length === 0);
    const hasRemarkRisk = pRecords.some((r) => !r.remark || r.remark.trim().length < 5);

    const riskScore =
      (reattachCount > 2 ? 50 : reattachCount > 0 ? 20 : 0) +
      (pendingFeedbackCount > 0 ? 30 : 0) +
      (hasPhotoRisk ? 15 : 0) +
      (hasRemarkRisk ? 10 : 0);

    if (riskScore === 0) continue;

    const sortedRecords = [...pRecords].sort((a, b) => {
      const aScore = (b.reattachCount > 0 ? 100 : 0) + (b.photos.length === 0 ? 50 : 0);
      const bScore = (a.reattachCount > 0 ? 100 : 0) + (a.photos.length === 0 ? 50 : 0);
      return aScore - bScore;
    });

    result.push({
      patientId: p.id,
      patientName: p.name,
      patientNo: p.patientNo,
      clinicId: p.clinicId,
      clinicName: p.clinicName,
      doctorId: p.doctorId,
      doctorName: p.doctorName,
      stage: p.stage,
      reattachCount,
      totalAttachments,
      pendingFeedbackCount,
      hasPhotoRisk,
      hasRemarkRisk,
      riskScore,
      latestRecordId: sortedRecords[0]?.id,
    });
  }

  return result.sort((a, b) => b.riskScore - a.riskScore);
};

const CaseReview: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const feedbacksList = useFeedbackStore((s) => s.feedbacks);
  const { addReview, isReviewed, getReview } = useReviewStore();

  const filterClinic = searchParams.get('clinic') || '';
  const filterDoctor = searchParams.get('doctor') || '';
  const filterStage = searchParams.get('stage') || '';
  const dateStart = searchParams.get('dateStart') || '';
  const dateEnd = searchParams.get('dateEnd') || '';
  const filterReviewed = searchParams.get('reviewed') || 'all';

  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewPatient, setReviewPatient] = useState<RiskPatient | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const riskPatients = useMemo(() => {
    const base = computeRiskPatients(filterClinic, filterDoctor, filterStage, dateStart, dateEnd, feedbacksList);
    return base.map((p) => {
      const review = getReview(p.patientId);
      return {
        ...p,
        isReviewed: isReviewed(p.patientId),
        reviewedAt: review?.reviewedAt,
      };
    });
  }, [filterClinic, filterDoctor, filterStage, dateStart, dateEnd, feedbacksList, isReviewed, getReview]);

  const displayPatients = useMemo(() => {
    if (filterReviewed === 'pending') {
      return riskPatients.filter((p) => !p.isReviewed);
    }
    if (filterReviewed === 'done') {
      return riskPatients.filter((p) => p.isReviewed);
    }
    return riskPatients;
  }, [riskPatients, filterReviewed]);

  const pendingCount = riskPatients.filter((p) => !p.isReviewed).length;
  const doneCount = riskPatients.filter((p) => p.isReviewed).length;

  const clinicDesc = filterClinic ? clinics.find((c) => c.id === filterClinic)?.name || '' : '全部门诊';
  const doctorDesc = filterDoctor ? doctors.find((d) => d.id === filterDoctor)?.name || '' : '全部医生';
  const stageDesc = filterStage ? stageLabels[filterStage as PatientStage] || '' : '全部阶段';
  const dateDesc = dateStart && dateEnd ? `${dateStart} ~ ${dateEnd}` : '全部时间';

  const handleMarkReviewed = useCallback((patient: RiskPatient) => {
    setReviewPatient(patient);
    setReviewNote('');
    setReviewModalVisible(true);
  }, []);

  const handleConfirmReview = useCallback(() => {
    if (!reviewPatient) return;
    addReview({
      id: `review-${Date.now()}`,
      patientId: reviewPatient.patientId,
      patientName: reviewPatient.patientName,
      reviewedAt: dayjs().format('YYYY-MM-DD HH:mm'),
      reviewedBy: '质控主管',
      note: reviewNote || undefined,
    });
    message.success('已标记为已复盘');
    setReviewModalVisible(false);
    setReviewPatient(null);
  }, [reviewPatient, reviewNote, addReview]);

  const handleViewCase = useCallback((patient: RiskPatient) => {
    const params = new URLSearchParams();
    if (patient.latestRecordId) params.set('highlightRecordId', patient.latestRecordId);
    params.set('from', 'review');
    params.set('clinic', filterClinic);
    params.set('doctor', filterDoctor);
    params.set('stage', filterStage);
    params.set('dateStart', dateStart);
    params.set('dateEnd', dateEnd);
    params.set('reviewed', filterReviewed);
    navigate(`/case/${patient.patientId}?${params.toString()}`);
  }, [navigate, filterClinic, filterDoctor, filterStage, dateStart, dateEnd, filterReviewed]);

  const goToNextUnreviewed = useCallback(() => {
    const currentIdx = displayPatients.findIndex((p) => !p.isReviewed);
    if (currentIdx >= 0 && currentIdx < displayPatients.length) {
      handleViewCase(displayPatients[currentIdx]);
    } else {
      message.info('当前筛选范围内已无待复盘病例');
    }
  }, [displayPatients, handleViewCase]);

  const columns = [
    {
      title: '患者信息',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 180,
      render: (_: unknown, record: RiskPatient) => (
        <div className={styles.patientCell}>
          <div className={styles.patientName}>
            {record.patientName}
            {record.isReviewed && <CheckCircleOutlined className={styles.reviewedIcon} />}
          </div>
          <div className={styles.patientMeta}>{record.patientNo}</div>
        </div>
      ),
    },
    {
      title: '门诊',
      dataIndex: 'clinicName',
      key: 'clinicName',
      width: 120,
    },
    {
      title: '主治医生',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 100,
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      width: 100,
      render: (stage: PatientStage) => <Tag color="blue">{stageLabels[stage]}</Tag>,
    },
    {
      title: '风险因素',
      key: 'risks',
      width: 200,
      render: (_: unknown, record: RiskPatient) => (
        <Space size={4} wrap>
          {record.reattachCount > 0 && (
            <Tag color="orange" icon={<AlertOutlined />}>
              重粘{record.reattachCount}次
            </Tag>
          )}
          {record.pendingFeedbackCount > 0 && (
            <Tag color="red" icon={<ClockCircleOutlined />}>
              待处理反馈{record.pendingFeedbackCount}
            </Tag>
          )}
          {record.hasPhotoRisk && (
            <Tag color="gold" icon={<CameraOutlined />}>
              缺照片
            </Tag>
          )}
          {record.hasRemarkRisk && (
            <Tag color="gold" icon={<EditOutlined />}>
              备注不足
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: '风险评分',
      dataIndex: 'riskScore',
      key: 'riskScore',
      width: 100,
      render: (score: number) => (
        <span className={`${styles.riskScore} ${score >= 40 ? styles.highRisk : score >= 20 ? styles.medRisk : styles.lowRisk}`}>
          {score}
        </span>
      ),
    },
    {
      title: '复盘状态',
      key: 'status',
      width: 100,
      render: (_: unknown, record: RiskPatient) => (
        record.isReviewed ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>已复盘</Tag>
        ) : (
          <Tag color="orange" icon={<WarningOutlined />}>待复盘</Tag>
        )
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: RiskPatient) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewCase(record)}
          >
            查看病例
          </Button>
          {!record.isReviewed && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleMarkReviewed(record)}
            >
              标记复盘
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabItems = [
    { key: 'all', label: `全部 (${riskPatients.length})` },
    { key: 'pending', label: `待复盘 (${pendingCount})` },
    { key: 'done', label: `已复盘 (${doneCount})` },
  ];

  return (
    <div className={styles.reviewPage}>
      <Card className={styles.filterCard} bordered={false}>
        <div className={styles.filterSummary}>
          <div className={styles.filterTitle}>
            <FileTextOutlined className={styles.filterIcon} />
            病例复盘清单
          </div>
          <div className={styles.filterDesc}>
            筛选范围：{dateDesc} | {clinicDesc} | {doctorDesc} | {stageDesc}
          </div>
          <Space>
            <Button
              type="primary"
              icon={<ArrowRightOutlined />}
              onClick={goToNextUnreviewed}
              disabled={pendingCount === 0}
            >
              下一个待复盘
            </Button>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
            >
              返回
            </Button>
          </Space>
        </div>
        <div className={styles.tabRow}>
          {tabItems.map((tab) => (
            <Button
              key={tab.key}
              type={filterReviewed === tab.key ? 'primary' : 'default'}
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set('reviewed', tab.key);
                navigate(`/review?${params.toString()}`);
              }}
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </Card>

      <Row gutter={16} className={styles.statsRow}>
        <Col span={8}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #F53F3F, #FF7D00)' }}>
                <WarningOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>风险病例</div>
                <div className={styles.statValue}>{riskPatients.length}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #FF7D00, #FF9A2E)' }}>
                <ClockCircleOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>待复盘</div>
                <div className={styles.statValue} style={{ color: '#FF7D00' }}>{pendingCount}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #00B42A, #23C343)' }}>
                <CheckCircleOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>已完成</div>
                <div className={styles.statValue} style={{ color: '#00B42A' }}>{doneCount}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className={styles.listCard} bordered={false}>
        {displayPatients.length > 0 ? (
          <Table
            columns={columns}
            dataSource={displayPatients}
            rowKey="patientId"
            size="middle"
            pagination={{
              pageSize: 10,
              showTotal: (total) => `共 ${total} 条风险病例`,
            }}
            rowClassName={(record) => record.isReviewed ? styles.reviewedRow : ''}
          />
        ) : (
          <Empty description="当前筛选范围内暂无风险病例" />
        )}
      </Card>

      <Modal
        title="标记已复盘"
        open={reviewModalVisible}
        onOk={handleConfirmReview}
        onCancel={() => {
          setReviewModalVisible(false);
          setReviewPatient(null);
        }}
        okText="确认标记"
        cancelText="取消"
      >
        {reviewPatient && (
          <div className={styles.reviewModalContent}>
            <div className={styles.reviewPatient}>
              <div className={styles.reviewPatientName}>{reviewPatient.patientName}</div>
              <div className={styles.reviewPatientMeta}>
                {reviewPatient.patientNo} · {reviewPatient.clinicName} · {reviewPatient.doctorName}
              </div>
            </div>
            <div className={styles.formLabel}>复盘备注（可选）</div>
            <TextArea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="请输入复盘备注..."
              rows={4}
              maxLength={200}
              showCount
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CaseReview;
