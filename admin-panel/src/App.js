/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/middleware/PrivateRoute';
import PublicRoute from './components/middleware/PublicRoute';
import SuperadminPrivateRoute from './components/middleware/SuperadminPrivateRoute';
import NotFound from './pages/Error';
import Home from './pages/Home';
import Login from './pages/Login';
import Main from './pages/Main';
import SetPassword from './pages/SetPassword';
import ChangePassword from './pages/ChangePassword';
import HotelDetail from './pages/Superadmin/HotelDetail';
import SuperadminDashboard from './pages/Superadmin/Dashboard';
import SuperadminHotels from './pages/Superadmin/Hotels';
import SuperadminLogin from './pages/Superadmin/Login';
import SuperadminProfile from './pages/Superadmin/Profile';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* HOME ROUTE */}
        <Route path='/' element={<Home />} />

        {/* DASHBOARD ROUTE */}
        <Route path='/main/:tab' element={(<PrivateRoute><Main /></PrivateRoute>)} />

        {/* LOGIN ROUTE */}
        <Route path='/auth/login' element={(<PublicRoute><Login /></PublicRoute>)} />

        {/* SUPER-ADMIN ROUTES (separate from hotel-admin login) */}
        <Route path='/superadmin' element={<SuperadminPrivateRoute><SuperadminDashboard /></SuperadminPrivateRoute>} />
        <Route path='/superadmin/login' element={<SuperadminLogin />} />
        <Route path='/superadmin/dashboard' element={<SuperadminPrivateRoute><SuperadminDashboard /></SuperadminPrivateRoute>} />
        <Route path='/superadmin/hotels' element={<SuperadminPrivateRoute><SuperadminHotels /></SuperadminPrivateRoute>} />
        <Route path='/superadmin/hotels/:slug' element={<SuperadminPrivateRoute><HotelDetail /></SuperadminPrivateRoute>} />
        <Route path='/superadmin/profile' element={<SuperadminPrivateRoute><SuperadminProfile /></SuperadminPrivateRoute>} />

        {/* MAGIC-LINK SET-PASSWORD (first-login flow for hotel admins) */}
        <Route path='/auth/set-password' element={<SetPassword />} />

        {/* CHANGE PASSWORD (forced after first login when mustChangePassword=true) */}
        <Route path='/auth/change-password' element={(<PrivateRoute><ChangePassword /></PrivateRoute>)} />

        {/* ERROR ROUTE */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
