/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import {
  ApartmentOutlined, AppstoreOutlined, BankOutlined, CalendarOutlined, DashboardOutlined, DollarOutlined, FileProtectOutlined, FullscreenExitOutlined, FullscreenOutlined, GlobalOutlined, HomeOutlined, LogoutOutlined, SettingOutlined, TagsOutlined, TeamOutlined, UserOutlined
} from '@ant-design/icons';
import {
  Button, Layout, Menu, Tooltip
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Logo from '../assets/images/logo.svg';
import UserBox from '../components/shared/UserBox';
import Dashboard from '../components/tabs/Dashboard';
import MyProfile from '../components/tabs/MyProfile';
import Orders from '../components/tabs/Orders';
import TapeChart from '../components/tabs/TapeChart';
import BookingSitePreview from '../components/tabs/BookingSitePreview';
import HotelSettings from '../components/tabs/HotelSettings';
import Attributes from '../components/tabs/Attributes';
import PriceList from '../components/tabs/PriceList';
import Property from '../components/tabs/Property';
import Rooms from '../components/tabs/Rooms';
import RoomTypes from '../components/tabs/RoomTypes';
import Users from '../components/tabs/Users';
import useFullScreen from '../hooks/useFullScreen';
import ApiService from '../utils/apiService';
import { removeSessionAndLogoutUser } from '../utils/authentication';
import notificationWithIcon from '../utils/notification';

const {
  Header, Content, Footer, Sider
} = Layout;

function Main() {
  window.document.title = 'Beach Resort — Main';
  const { isFullscreen, toggleFullScreen } = useFullScreen();
  const [selectedKeys, setSelectedKeys] = useState('1');
  const navigate = useNavigate();
  const { tab } = useParams();

  // setup gate — has the hotel property been captured yet?
  const [propertyComplete, setPropertyComplete] = useState(null);
  const refreshSetupStatus = useCallback(async () => {
    try {
      const res = await ApiService.get('/api/v1/onboarding/status');
      setPropertyComplete(!!res?.propertyComplete);
    } catch (e) {
      setPropertyComplete(true); // fail open — never lock the admin out on a fetch error
    }
  }, []);
  useEffect(() => { refreshSetupStatus(); }, [refreshSetupStatus]);
  // until the property is captured, the only places to go are the dashboard (which shows the
  // "create property" task), the property form, and profile/logout.
  useEffect(() => {
    const allowed = ['property', 'dashboard', 'profile', 'logout'];
    if (propertyComplete === false && tab && !allowed.includes(tab)) {
      navigate('/main/dashboard');
    }
  }, [propertyComplete, tab, navigate]);

  // function to handle user logout
  const userLogout = async () => {
    try {
      const response = await ApiService.post('/api/v1/auth/logout');
      if (response?.result_code === 0) {
        removeSessionAndLogoutUser();
      } else {
        notificationWithIcon('error', 'ERROR', 'Sorry! Something went wrong. App server error');
        removeSessionAndLogoutUser();
      }
    } catch (error) {
      notificationWithIcon('error', 'ERROR', error?.response?.data?.result?.error || 'Sorry! Something went wrong. App server error');
      removeSessionAndLogoutUser();
    }
  };

  const handleTabChange = (key) => {
    switch (key) {
      case '11': {
        navigate('/main/property');
        break;
      }
      case '1': {
        navigate('/main/dashboard');
        break;
      }
      case '2': {
        navigate('/main/users');
        break;
      }
      case '3': {
        navigate('/main/hotel-rooms');
        break;
      }
      case '10': {
        navigate('/main/room-types');
        break;
      }
      case '12': {
        navigate('/main/attributes');
        break;
      }
      case '13': {
        navigate('/main/price-list');
        break;
      }
      case '9': {
        navigate('/main/tape-chart');
        break;
      }
      case '4': {
        navigate('/main/booking-orders');
        break;
      }
      case '5': {
        navigate('/main/profile');
        break;
      }
      case '7': {
        navigate('/main/channels');
        break;
      }
      case '8': {
        navigate('/main/hotel-settings');
        break;
      }
      case '6': {
        userLogout();
        break;
      }
      default: {
        navigate('/main/dashboard');
      }
    }
  };

  useEffect(() => {
    if (tab) {
      switch (tab) {
        case 'property': {
          setSelectedKeys('11');
          break;
        }
        case 'dashboard': {
          setSelectedKeys('1');
          break;
        }
        case 'users': {
          setSelectedKeys('2');
          break;
        }
        case 'hotel-rooms': {
          setSelectedKeys('3');
          break;
        }
        case 'room-types': {
          setSelectedKeys('10');
          break;
        }
        case 'attributes': {
          setSelectedKeys('12');
          break;
        }
        case 'price-list': {
          setSelectedKeys('13');
          break;
        }
        case 'tape-chart': {
          setSelectedKeys('9');
          break;
        }
        case 'booking-orders': {
          setSelectedKeys('4');
          break;
        }
        case 'profile': {
          setSelectedKeys('5');
          break;
        }
        case 'channels': {
          setSelectedKeys('7');
          break;
        }
        case 'hotel-settings': {
          setSelectedKeys('8');
          break;
        }
        case 'logout': {
          setSelectedKeys('6');
          break;
        }
        default: {
          navigate('/not-found');
        }
      }
    }
  }, [tab, navigate]);

  useEffect(() => {
    switch (selectedKeys) {
      case '11': {
        window.document.title = 'Beach Resort — Property';
        break;
      }
      case '1': {
        window.document.title = 'Beach Resort — Dashboard';
        break;
      }
      case '2': {
        window.document.title = 'Beach Resort — Users';
        break;
      }
      case '3': {
        window.document.title = 'Beach Resort — Hotel Rooms';
        break;
      }
      case '10': {
        window.document.title = 'Beach Resort — Room Types';
        break;
      }
      case '9': {
        window.document.title = 'Beach Resort — Room rack';
        break;
      }
      case '4': {
        window.document.title = 'Beach Resort — Booking Orders';
        break;
      }
      case '5': {
        window.document.title = 'Beach Resort — Profile';
        break;
      }
      case '7': {
        window.document.title = 'Beach Resort — Channels';
        break;
      }
      case '8': {
        window.document.title = 'Beach Resort — Hotel Settings';
        break;
      }
      case '12': {
        window.document.title = 'Beach Resort — Attributes';
        break;
      }
      case '13': {
        window.document.title = 'Beach Resort — Price list';
        break;
      }
      case '6': {
        window.document.title = 'Beach Resort — Logout';
        break;
      }
      default: {
        window.document.title = 'Beach Resort — Dashboard';
      }
    }
  }, [selectedKeys]);

  const setupSubmenu = {
    key: 'sub-setup',
    icon: <ApartmentOutlined />,
    label: 'Hotel & units setup',
    children: [
      { key: '8', icon: <SettingOutlined />, label: 'Hotel specifics' },
      { key: '10', icon: <AppstoreOutlined />, label: 'Room Types' },
      { key: '12', icon: <TagsOutlined />, label: 'Attributes' },
      { key: '3', icon: <HomeOutlined />, label: 'Rooms' }
    ]
  };
  const fullMenu = [
    { key: '11', icon: <BankOutlined />, label: 'Property' },
    { key: '1', icon: <DashboardOutlined />, label: 'Dashboard' },
    setupSubmenu,
    { key: '9', icon: <CalendarOutlined />, label: 'Room rack' },
    { key: '13', icon: <DollarOutlined />, label: 'Price list' },
    { key: '4', icon: <FileProtectOutlined />, label: 'Booking Orders' },
    { key: '2', icon: <TeamOutlined />, label: 'Users' },
    { key: '7', icon: <GlobalOutlined />, label: 'Channels' },
    { key: '5', icon: <UserOutlined />, label: 'My Profile' },
    { key: '6', icon: <LogoutOutlined />, label: 'Logout' }
  ];
  const minimalMenu = [
    { key: '11', icon: <BankOutlined />, label: 'Property' },
    { key: '1', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '5', icon: <UserOutlined />, label: 'My Profile' },
    { key: '6', icon: <LogoutOutlined />, label: 'Logout' }
  ];
  const menuItems = propertyComplete === false ? minimalMenu : fullMenu;

  return (
    <Layout className='w-full h-screen'>
      <Sider width={250} breakpoint='lg' collapsedWidth='0'>
        <UserBox />

        <Menu
          theme='dark'
          mode='inline'
          selectedKeys={[selectedKeys]}
          defaultOpenKeys={['sub-setup']}
          onClick={(e) => {
            handleTabChange(e.key);
          }}
          items={menuItems}
        />
      </Sider>

      <Layout>
        <Header className='p-0 !bg-bg-white'>
          <Link to='/'>
            <img
              className='w-[280px] h-[65px] mx-auto'
              alt='beach-resort-logo'
              src={Logo}
            />
          </Link>

          {/* full screen toggle button */}
          <Tooltip title='Click to toggle Full Screen' placement='left'>
            <Button
              className='absolute right-5 top-5'
              icon={isFullscreen ?
                (<FullscreenExitOutlined className='pb-12' />) :
                (<FullscreenOutlined className='pb-12' />)}
              onClick={toggleFullScreen}
              shape='default'
              type='default'
              size='middle'
            />
          </Tooltip>
        </Header>

        <Content className='bg-bg-white overflow-y-scroll m-2 p-2'>
          {selectedKeys === '11' && (<Property onSaved={refreshSetupStatus} />)}
          {selectedKeys === '1' && (
            <Dashboard
              propertyComplete={propertyComplete}
              goTo={(t) => navigate(`/main/${t}`)}
            />
          )}
          {selectedKeys === '2' && (<Users />)}
          {selectedKeys === '3' && (<Rooms />)}
          {selectedKeys === '10' && (<RoomTypes />)}
          {selectedKeys === '12' && (<Attributes />)}
          {selectedKeys === '13' && (<PriceList />)}
          {selectedKeys === '4' && (<Orders />)}
          {selectedKeys === '9' && (<TapeChart />)}
          {selectedKeys === '5' && (<MyProfile />)}
          {selectedKeys === '7' && (<BookingSitePreview />)}
          {selectedKeys === '8' && (<HotelSettings />)}
        </Content>

        <Footer className='text-center font-text-font font-medium '>
          ©2023 Beach Resort — Developed By
          {' '}
          <a
            className='text-color-primary hover:text-color-secondary'
            href='https://srmukul.com'
            target='_blank'
            rel='noreferrer'
          >
            Md. Samiur Rahman (Mukul)
          </a>
        </Footer>
      </Layout>
    </Layout>
  );
}

export default React.memo(Main);
