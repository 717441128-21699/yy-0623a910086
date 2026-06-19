import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import MainLayout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import CaseDetail from '@/pages/CaseDetail';
import Feedback from '@/pages/Feedback';

const themeConfig = {
  token: {
    colorPrimary: '#165DFF',
    borderRadius: 6,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  components: {
    Button: {
      borderRadius: 6,
    },
    Card: {
      borderRadius: 8,
    },
    Table: {
      borderRadius: 8,
    },
  },
};

function App() {
  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/case/:id" element={<CaseDetail />} />
              <Route path="/feedback" element={<Feedback />} />
            </Routes>
          </MainLayout>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
