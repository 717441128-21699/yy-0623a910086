import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd';
import {
  BarChartOutlined,
  FileTextOutlined,
  MessageOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  SmileOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import styles from './index.module.css';

const { Sider, Header, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    key: '/dashboard',
    icon: <BarChartOutlined />,
    label: '总览看板',
  },
  {
    key: '/review',
    icon: <AlertOutlined />,
    label: '病例复盘',
  },
  {
    key: '/feedback',
    icon: <MessageOutlined />,
    label: '反馈列表',
    badge: 3,
  },
];

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const getSelectedKey = () => {
    if (location.pathname.startsWith('/case')) return '/dashboard';
    return location.pathname === '/' ? '/dashboard' : location.pathname;
  };

  const getPageTitle = () => {
    const key = getSelectedKey();
    if (key === '/dashboard') return '总览看板';
    if (key === '/review') return '病例复盘';
    if (key === '/feedback') return '反馈列表';
    return '正畸质控看板';
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserOutlined />, label: '个人中心' },
    { key: 'settings', icon: <SettingOutlined />, label: '系统设置' },
    { type: 'divider' as const },
    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
  ];

  return (
    <Layout className={styles.layout}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className={styles.sider}
        width={232}
      >
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <SmileOutlined />
          </div>
          {!collapsed && <span className={styles.logoText}>正畸质控看板</span>}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.icon,
            label: item.badge ? (
              <div className={styles.menuItemWithBadge}>
                <span>{item.label}</span>
                <Badge count={item.badge} size="small" />
              </div>
            ) : (
              item.label
            ),
          }))}
          onClick={({ key }) => navigate(key)}
          className={styles.menu}
        />
      </Sider>
      <Layout>
        <Header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.pageTitle}>
              {getPageTitle()}
            </span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.notification}>
              <Badge count={5} size="small">
                <BellOutlined className={styles.headerIcon} />
              </Badge>
            </div>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className={styles.userInfo}>
                <Avatar size={32} icon={<UserOutlined />} className={styles.avatar} />
                <span className={styles.userName}>质控主管</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className={styles.content}>{children}</Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
