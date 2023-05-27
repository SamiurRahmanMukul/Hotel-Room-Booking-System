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
import NotFound from './pages/Error';
import Home from './pages/Home';
import Login from './pages/Login';
import Main from './pages/Main';

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

        {/* ERROR ROUTE */}
        <Route path='*' element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
