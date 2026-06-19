import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Tag,
  Button,
  Image,
  Row,
  Col,
  Table,
  Modal,
  Form,
  Input,
  Select,
  message,
  Timeline,
  Divider,
  Avatar,
  Space,
  Tooltip,
} from 'antd';
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  FileTextOutlined,
  CameraOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  EyeOutlined,
  SmileOutlined,
} from '@ant-design/icons';
import type { BondingRecord, Patient, BondingType, Feedback } from '@/types';
import { getPatientById, stageLabels } from '@/mock/patients';
import { getRecordsByPatientId } from '@/mock/records';
import { doctors, getDoctorById } from '@/mock/doctors';
import { clinics } from '@/mock/clinics';
import { useFeedbackStore } from '@/store/feedbackStore';
import dayjs from 'dayjs';
import styles from './CaseDetail.module.css';

const { Option } = Select;
const { TextArea } = Input;

const typeLabels: Record<BondingType, string> = {
  initial: '初次粘接',
  reattach: '重新粘接',
  checkup: '复诊检查',
};

const typeColors: Record<BondingType, string> = {
  initial: 'blue',
  reattach: 'orange',
  checkup: 'green',
};

const typeIcons: Record<BondingType, React.ReactNode> = {
  initial: <SmileOutlined />,
  reattach: <ReloadOutlined />,
  checkup: <CheckCircleOutlined />,
};

const photoAngleLabels: Record<string, string> = {
  front: '正面像',
  lateral: '侧面像',
  occlusal: '咬合面',
  other: '其他',
};

const CaseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const addFeedback = useFeedbackStore((s) => s.addFeedback);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<BondingRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<BondingRecord | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (id) {
      const p = getPatientById(id);
      if (p) {
        setPatient(p);
        const r = getRecordsByPatientId(id);
        setRecords(r);
        const highlightId = searchParams.get('highlightRecordId');
        if (highlightId) {
          const highlighted = r.find((rec) => rec.id === highlightId);
          if (highlighted) {
            setSelectedRecord(highlighted);
            return;
          }
        }
        if (r.length > 0) {
          setSelectedRecord(r[0]);
        }
      }
    }
  }, [id, searchParams]);

  const handleSubmitFeedback = () => {
    form.validateFields().then((values) => {
      const toDoctor = getDoctorById(values.toDoctorId);
      if (!toDoctor || !patient || !selectedRecord) return;

      const deadlineDays = values.deadline ? parseInt(values.deadline, 10) : 7;
      const feedback: Feedback = {
        id: `f-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        recordId: selectedRecord.id,
        recordType: selectedRecord.type,
        recordDate: selectedRecord.date,
        patientId: patient.id,
        patientName: patient.name,
        fromDoctorId: 'admin',
        fromDoctorName: '质控主管',
        toDoctorId: values.toDoctorId,
        toDoctorName: toDoctor.name,
        content: values.content,
        status: 'pending',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        deadline: dayjs().add(deadlineDays, 'day').format('YYYY-MM-DD'),
        clinicId: patient.clinicId,
        clinicName: patient.clinicName,
      };

      addFeedback(feedback);
      message.success('反馈已发送');
      setFeedbackModalVisible(false);
      form.resetFields();
    });
  };

  const itemColumns = [
    {
      title: '牙位',
      dataIndex: 'toothPosition',
      key: 'toothPosition',
      width: 100,
      render: (val: string) => <span className={styles.toothPosition}>{val}</span>,
    },
    {
      title: '附件形态',
      dataIndex: 'attachmentShape',
      key: 'attachmentShape',
      width: 120,
    },
    {
      title: '是否重粘',
      dataIndex: 'isReattach',
      key: 'isReattach',
      width: 100,
      render: (val: boolean) =>
        val ? <Tag color="orange">是</Tag> : <Tag color="green">否</Tag>,
    },
    {
      title: '重粘原因',
      dataIndex: 'reason',
      key: 'reason',
      render: (val: string) => val || '-',
    },
  ];

  if (!patient) {
    return (
      <div className={styles.loading}>
        <p>加载中...</p>
      </div>
    );
  }

  const handleBack = useCallback(() => {
    const from = searchParams.get('from');
    if (from === 'feedback') {
      const params = new URLSearchParams();
      const tab = searchParams.get('tab');
      const page = searchParams.get('page');
      const pageSize = searchParams.get('pageSize');
      if (tab) params.set('tab', tab);
      if (page) params.set('page', page);
      if (pageSize) params.set('pageSize', pageSize);
      navigate(`/feedback${params.toString() ? `?${params.toString()}` : ''}`);
    } else if (from === 'review') {
      const params = new URLSearchParams();
      ['clinic', 'doctor', 'stage', 'dateStart', 'dateEnd', 'reviewed'].forEach((key) => {
        const val = searchParams.get(key);
        if (val) params.set(key, val);
      });
      navigate(`/review${params.toString() ? `?${params.toString()}` : ''}`);
    } else {
      navigate(-1);
    }
  }, [navigate, searchParams]);

  return (
    <div className={styles.caseDetail}>
      <div className={styles.pageHeader}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className={styles.backBtn}
        >
          返回列表
        </Button>
      </div>

      <Card className={styles.patientCard} bordered={false}>
        <div className={styles.patientInfo}>
          <Avatar size={64} icon={<UserOutlined />} className={styles.patientAvatar} />
          <div className={styles.patientMain}>
            <div className={styles.patientNameRow}>
              <h2 className={styles.patientName}>{patient.name}</h2>
              <Tag color="blue" className={styles.patientNo}>
                {patient.patientNo}
              </Tag>
              <Tag color={typeColors[patient.stage as BondingType]}>
                {stageLabels[patient.stage]}
              </Tag>
            </div>
            <div className={styles.patientMeta}>
              <Space split={<Divider type="vertical" />} size={0}>
                <span className={styles.metaItem}>
                  <UserOutlined /> {patient.age}岁
                </span>
                <span className={styles.metaItem}>
                  <TeamOutlined /> {patient.doctorName}
                </span>
                <span className={styles.metaItem}>
                  <FileTextOutlined /> {patient.clinicName}
                </span>
                <span className={styles.metaItem}>
                  累计附件 <b>{patient.totalAttachments}</b> 颗
                </span>
                <span className={`${styles.metaItem} ${patient.reattachCount > 2 ? styles.warningText : ''}`}>
                  重粘 <b>{patient.reattachCount}</b> 次
                </span>
              </Space>
            </div>
          </div>
          <div className={styles.patientActions}>
            <Button type="primary" icon={<MessageOutlined />} onClick={() => setFeedbackModalVisible(true)}>
              发起质控反馈
            </Button>
          </div>
        </div>
      </Card>

      <div className={styles.contentWrapper}>
        <div className={styles.timelineSection}>
          <Card className={styles.timelineCard} bordered={false} title="粘接时间线">
            <Timeline
              mode="left"
              className={styles.timeline}
              items={records.map((record) => ({
                color: typeColors[record.type],
                dot: typeIcons[record.type],
                children: (
                  <div
                    className={`${styles.timelineItem} ${selectedRecord?.id === record.id ? styles.activeItem : ''}`}
                    onClick={() => setSelectedRecord(record)}
                  >
                    <div className={styles.timelineHeader}>
                      <Tag color={typeColors[record.type]} className={styles.typeTag}>
                        {typeLabels[record.type]}
                      </Tag>
                      <span className={styles.timelineDate}>
                        <CalendarOutlined /> {record.date}
                      </span>
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineDoctor}>操作医生：{record.doctorName}</div>
                      {record.totalCount > 0 && (
                        <div className={styles.timelineStat}>
                          {record.type === 'reattach' ? (
                            <span>重粘 {record.reattachCount} 颗</span>
                          ) : (
                            <span>粘接 {record.totalCount} 颗附件</span>
                          )}
                        </div>
                      )}
                      {record.remark && (
                        <div className={styles.timelineRemark}>
                          {record.remark.length > 40 ? record.remark.slice(0, 40) + '...' : record.remark}
                        </div>
                      )}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </div>

        <div className={styles.detailSection}>
          {selectedRecord ? (
            <>
              <Card
                className={styles.detailCard}
                bordered={false}
                title={
                  <div className={styles.detailTitle}>
                    <Tag color={typeColors[selectedRecord.type]}>
                      {typeLabels[selectedRecord.type]}
                    </Tag>
                    <span>{selectedRecord.date}</span>
                  </div>
                }
                extra={
                  <Button
                    type="link"
                    icon={<MessageOutlined />}
                    onClick={() => setFeedbackModalVisible(true)}
                  >
                    发起反馈
                  </Button>
                }
              >
                <Row gutter={24}>
                  <Col span={12}>
                    <div className={styles.infoBlock}>
                      <h4 className={styles.infoTitle}>基本信息</h4>
                      <div className={styles.infoList}>
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>操作医生</span>
                          <span className={styles.infoValue}>{selectedRecord.doctorName}</span>
                        </div>
                        {selectedRecord.assistant && (
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>助手</span>
                            <span className={styles.infoValue}>{selectedRecord.assistant}</span>
                          </div>
                        )}
                        <div className={styles.infoItem}>
                          <span className={styles.infoLabel}>附件数量</span>
                          <span className={styles.infoValue}>{selectedRecord.totalCount} 颗</span>
                        </div>
                        {selectedRecord.reattachCount > 0 && (
                          <div className={styles.infoItem}>
                            <span className={styles.infoLabel}>重粘数量</span>
                            <span className={`${styles.infoValue} ${styles.warningText}`}>
                              {selectedRecord.reattachCount} 颗
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className={styles.infoBlock}>
                      <h4 className={styles.infoTitle}>备注说明</h4>
                      <div className={styles.remarkBox}>
                        {selectedRecord.remark || '暂无备注'}
                      </div>
                    </div>
                  </Col>
                </Row>

                <Divider />

                {selectedRecord.items.length > 0 && (
                  <>
                    <h4 className={styles.sectionTitle}>
                      <SmileOutlined /> 牙位与附件明细
                    </h4>
                    <Table
                      columns={itemColumns}
                      dataSource={selectedRecord.items}
                      rowKey="id"
                      size="small"
                      pagination={false}
                      className={styles.itemsTable}
                    />
                    <Divider />
                  </>
                )}

                <h4 className={styles.sectionTitle}>
                  <CameraOutlined /> 口内照片
                </h4>
                <div className={styles.photoGrid}>
                  {selectedRecord.photos.map((photo) => (
                    <div key={photo.id} className={styles.photoItem}>
                      <div className={styles.photoWrapper}>
                        <Image
                          src={photo.url}
                          alt={photoAngleLabels[photo.angleType]}
                          preview
                          className={styles.photo}
                        />
                      </div>
                      <div className={styles.photoLabel}>
                        {photoAngleLabels[photo.angleType]}
                        <Tooltip title={photo.remark || '暂无备注'}>
                          <EyeOutlined className={styles.photoEye} />
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          ) : (
            <Card className={styles.detailCard} bordered={false}>
              <div className={styles.emptyState}>
                <FileTextOutlined className={styles.emptyIcon} />
                <p>请选择左侧时间线查看记录详情</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Modal
        title="发起质控反馈"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        onOk={handleSubmitFeedback}
        okText="发送反馈"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ toDoctorId: patient?.doctorId }}>
          <Form.Item
            name="toDoctorId"
            label="分派给医生"
            rules={[{ required: true, message: '请选择医生' }]}
          >
            <Select placeholder="请选择需要补正的医生">
              {doctors
                .filter((d) => d.id !== 'admin')
                .map((doctor) => (
                  <Option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.title} ({clinics.find((c) => c.id === doctor.clinicId)?.name || ''})
                  </Option>
                ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="content"
            label="反馈内容"
            rules={[{ required: true, message: '请填写反馈内容' }]}
          >
            <TextArea
              rows={5}
              placeholder="请描述发现的问题，例如：牙位描述不清、照片缺少咬合面、重粘原因未说明等"
            />
          </Form.Item>
          <Form.Item name="deadline" label="要求完成期限" initialValue="3">
            <Select placeholder="请选择">
              <Option value="1">1天内</Option>
              <Option value="3">3天内</Option>
              <Option value="7">7天内</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CaseDetail;
