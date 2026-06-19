import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Tabs,
  Table,
  Tag,
  Button,
  Avatar,
  Space,
  Modal,
  Form,
  Input,
  message,
  Row,
  Col,
} from 'antd';
import {
  UserOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  CalendarOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { Feedback, FeedbackStatus } from '@/types';
import { useFeedbackStore } from '@/store/feedbackStore';
import styles from './Feedback.module.css';
import dayjs from 'dayjs';

const { TextArea } = Input;

const statusConfig: Record<FeedbackStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待处理', color: 'orange', icon: <ClockCircleOutlined /> },
  processing: { label: '处理中', color: 'blue', icon: <SyncOutlined spin /> },
  completed: { label: '已完成', color: 'green', icon: <CheckCircleOutlined /> },
  rejected: { label: '已驳回', color: 'red', icon: <CloseCircleOutlined /> },
};

const FeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const feedbacksList = useFeedbackStore((s) => s.feedbacks);
  const updateFeedbackStatus = useFeedbackStore((s) => s.updateFeedbackStatus);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [replyForm] = Form.useForm();

  const pendingCount = feedbacksList.filter((f) => f.status === 'pending').length;
  const processingCount = feedbacksList.filter((f) => f.status === 'processing').length;
  const completedCount = feedbacksList.filter((f) => f.status === 'completed').length;

  const tabItems = [
    { key: 'all', label: `全部 (${feedbacksList.length})` },
    { key: 'pending', label: `待处理 (${pendingCount})` },
    { key: 'processing', label: `处理中 (${processingCount})` },
    { key: 'completed', label: `已完成 (${completedCount})` },
    { key: 'rejected', label: '已驳回' },
  ];

  const filteredFeedbacks =
    activeTab === 'all' ? feedbacksList : feedbacksList.filter((f) => f.status === activeTab);

  const columns = [
    {
      title: '患者信息',
      dataIndex: 'patientName',
      key: 'patientName',
      width: 180,
      render: (_: unknown, record: Feedback) => (
        <div className={styles.patientCell}>
          <Avatar size={36} icon={<UserOutlined />} className={styles.patientAvatar} />
          <div className={styles.patientInfo}>
            <div className={styles.patientName}>{record.patientName}</div>
            <div className={styles.clinicName}>{record.clinicName}</div>
          </div>
        </div>
      ),
    },
    {
      title: '反馈内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      render: (text: string) => <span className={styles.contentText}>{text}</span>,
    },
    {
      title: '分派给',
      dataIndex: 'toDoctorName',
      key: 'toDoctorName',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: FeedbackStatus) => {
        const config = statusConfig[status];
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.label}
          </Tag>
        );
      },
    },
    {
      title: '发起时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time: string) => (
        <span className={styles.timeText}>
          <CalendarOutlined /> {time}
        </span>
      ),
    },
    {
      title: '截止日期',
      dataIndex: 'deadline',
      key: 'deadline',
      width: 120,
      render: (deadline: string | undefined, record: Feedback) => {
        if (!deadline) return '-';
        const isOverdue = record.status !== 'completed' && record.status !== 'rejected' && dayjs(deadline).isBefore(dayjs());
        return (
          <span className={isOverdue ? styles.overdueText : ''}>
            {deadline}
            {isOverdue && ' (已逾期)'}
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: unknown, record: Feedback) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/case/${record.patientId}`)}
          >
            病例
          </Button>
        </Space>
      ),
    },
  ];

  const handleViewDetail = (record: Feedback) => {
    setSelectedFeedback(record);
    setDetailVisible(true);
  };

  const handleReply = () => {
    if (!selectedFeedback) return;
    replyForm.validateFields().then((values) => {
      updateFeedbackStatus(selectedFeedback.id, 'processing', values.reply);
      message.success('回复已提交');
      setDetailVisible(false);
      replyForm.resetFields();
      setSelectedFeedback(null);
    });
  };

  const handleApprove = () => {
    if (!selectedFeedback) return;
    updateFeedbackStatus(selectedFeedback.id, 'completed');
    message.success('已确认完成');
    setDetailVisible(false);
    setSelectedFeedback(null);
  };

  const handleReject = () => {
    if (!selectedFeedback) return;
    Modal.confirm({
      title: '驳回补正',
      content: '确定要驳回这次补正吗？医生需要重新处理。',
      okText: '确认驳回',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        updateFeedbackStatus(selectedFeedback.id, 'rejected');
        message.success('已驳回');
        setDetailVisible(false);
        setSelectedFeedback(null);
      },
    });
  };

  const currentFeedback = selectedFeedback
    ? feedbacksList.find((f) => f.id === selectedFeedback.id) || selectedFeedback
    : null;

  return (
    <div className={styles.feedback}>
      <Row gutter={16} className={styles.statsRow}>
        <Col span={6}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #FF7D00, #FF9A2E)' }}>
                <ClockCircleOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>待处理</div>
                <div className={styles.statValue} style={{ color: '#FF7D00' }}>{pendingCount}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #165DFF, #4080FF)' }}>
                <SyncOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>处理中</div>
                <div className={styles.statValue} style={{ color: '#165DFF' }}>{processingCount}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #00B42A, #23C343)' }}>
                <CheckCircleOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>已完成</div>
                <div className={styles.statValue} style={{ color: '#00B42A' }}>{completedCount}</div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className={styles.statCard} bordered={false}>
            <div className={styles.statContent}>
              <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #86909C, #C9CDD4)' }}>
                <MessageOutlined />
              </div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>反馈总数</div>
                <div className={styles.statValue}>{feedbacksList.length}</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card className={styles.listCard} bordered={false}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className={styles.tabs} />
        <Table
          columns={columns}
          dataSource={filteredFeedbacks}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条反馈`,
          }}
          size="middle"
          className={styles.table}
        />
      </Card>

      <Modal
        title="反馈详情"
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setSelectedFeedback(null);
        }}
        footer={null}
        width={720}
        destroyOnClose
        className={styles.detailModal}
      >
        {currentFeedback && (
          <div className={styles.detailContent}>
            <div className={styles.detailHeader}>
              <div className={styles.detailPatient}>
                <Avatar size={48} icon={<UserOutlined />} className={styles.detailAvatar} />
                <div>
                  <h3 className={styles.detailName}>{currentFeedback.patientName}</h3>
                  <div className={styles.detailMeta}>
                    {currentFeedback.clinicName} · {currentFeedback.toDoctorName}
                  </div>
                </div>
              </div>
              <Tag color={statusConfig[currentFeedback.status].color} className={styles.statusTag}>
                {statusConfig[currentFeedback.status].icon}
                {statusConfig[currentFeedback.status].label}
              </Tag>
            </div>

            <div className={styles.detailBody}>
              <div className={styles.feedbackBlock}>
                <div className={styles.blockHeader}>
                  <Avatar size={32} icon={<UserOutlined />} />
                  <div className={styles.blockInfo}>
                    <span className={styles.blockName}>{currentFeedback.fromDoctorName}</span>
                    <span className={styles.blockTime}>{currentFeedback.createdAt}</span>
                  </div>
                  <Tag color="blue">主管反馈</Tag>
                </div>
                <div className={styles.blockContent}>{currentFeedback.content}</div>
              </div>

              {currentFeedback.reply && (
                <div className={styles.replyBlock}>
                  <div className={styles.blockHeader}>
                    <Avatar size={32} icon={<UserOutlined />} className={styles.replyAvatar} />
                    <div className={styles.blockInfo}>
                      <span className={styles.blockName}>{currentFeedback.toDoctorName}</span>
                      <span className={styles.blockTime}>{currentFeedback.replyAt}</span>
                    </div>
                    <Tag color="green">医生补正</Tag>
                  </div>
                  <div className={styles.blockContent}>{currentFeedback.reply}</div>
                </div>
              )}

              {(currentFeedback.status === 'pending' || currentFeedback.status === 'processing') && (
                <div className={styles.replySection}>
                  <div className={styles.replyTitle}>
                    <SendOutlined /> 回复补正
                  </div>
                  <Form form={replyForm} layout="vertical">
                    <Form.Item name="reply" rules={[{ required: true, message: '请输入回复内容' }]}>
                      <TextArea rows={4} placeholder="请输入补正说明或补充信息..." />
                    </Form.Item>
                    <div className={styles.replyActions}>
                      <Button type="primary" onClick={handleReply}>
                        提交补正
                      </Button>
                      <Button onClick={() => setDetailVisible(false)}>取消</Button>
                    </div>
                  </Form>
                </div>
              )}

              {currentFeedback.status === 'processing' && (
                <div className={styles.approvalActions}>
                  <Button type="primary" onClick={handleApprove}>
                    <CheckCircleOutlined /> 确认完成
                  </Button>
                  <Button danger onClick={handleReject}>
                    <CloseCircleOutlined /> 驳回补正
                  </Button>
                </div>
              )}
            </div>

            <div className={styles.detailFooter}>
              <Button
                type="link"
                icon={<FileTextOutlined />}
                onClick={() => {
                  setDetailVisible(false);
                  navigate(`/case/${currentFeedback.patientId}`);
                }}
              >
                查看完整病例 <ArrowRightOutlined />
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FeedbackPage;
