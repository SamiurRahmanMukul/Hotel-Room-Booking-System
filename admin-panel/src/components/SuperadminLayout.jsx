/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline */
import { DashboardOutlined, HomeOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, Tooltip } from 'antd';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const { Header, Content, Footer, Sider } = Layout;

const ITEMS = [
  { key: '/superadmin/dashboard', label: 'Dashboard', icon: <DashboardOutlined /> },
  { key: '/superadmin/hotels', label: 'Hotels', icon: <HomeOutlined /> },
  { key: '/superadmin/profile', label: 'My account', icon: <UserOutlined /> }
];

function SuperadminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const me = (() => {
    try { return JSON.parse(localStorage.getItem('superadmin_user') || '{}'); } catch { return {}; }
  })();

  const logout = () => {
    localStorage.removeItem('superadmin_token');
    localStorage.removeItem('superadmin_user');
    navigate('/superadmin/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme='dark' width={240} style={{ position: 'fixed', height: '100vh', left: 0 }}>
        <div style={{ padding: 24, color: '#fff' }}>
          <div style={{ fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: 1 }}>Super Admin</div>
          <div style={{ fontSize: 16, marginTop: 4 }}>{me.fullName || 'Account'}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{me.email}</div>
        </div>
        <Menu
          theme='dark'
          mode='inline'
          selectedKeys={[location.pathname]}
          items={ITEMS}
          onClick={(e) => navigate(e.key)}
        />
        <div style={{ position: 'absolute', bottom: 16, width: '100%', padding: '0 16px' }}>
          <Button danger block icon={<LogoutOutlined />} onClick={logout}>Sign out</Button>
        </div>
      </Sider>
      <Layout style={{ marginLeft: 240 }}>
        <Header style={{ background: '#fff', borderBottom: '1px solid #f0f0f0', padding: '0 24px' }}>
          <Tooltip title='Platform overview'>
            <h2 style={{ margin: 0, lineHeight: '64px' }}>{(ITEMS.find((i) => i.key === location.pathname) || {}).label || 'Super Admin'}</h2>
          </Tooltip>
        </Header>
        <Content style={{ padding: 24, background: '#f0f2f5' }}>
          {children}
        </Content>
        <Footer style={{ textAlign: 'center', background: '#f0f2f5', color: '#8c8c8c', fontSize: 12 }}>
          Platform · Super Admin
        </Footer>
      </Layout>
    </Layout>
  );
}

export default SuperadminLayout;
