/**
 * Route guard for super-admin pages.
 * Redirects to /superadmin/login if no valid token exists.
 */

import { Navigate } from 'react-router-dom';

function SuperadminPrivateRoute({ children }) {
  const token = localStorage.getItem('superadmin_token');
  const user = localStorage.getItem('superadmin_user');

  if (!token || !user) {
    return <Navigate to='/superadmin/login' replace />;
  }
  return children;
}

export default SuperadminPrivateRoute;
