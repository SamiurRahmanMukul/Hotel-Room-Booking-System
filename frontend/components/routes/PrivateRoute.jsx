import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { getSessionToken, getSessionUser } from '../../utils/authentication';
import Loading from '../shared/Loading';

function PrivateRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const user = getSessionUser();
  const token = getSessionToken();
  const router = useRouter();

  useEffect(() => {
    if (!user && !token) {
      router.push('/auth/login');
    } else {
      setLoading(false);
    }
  }, [user, token]);

  return loading ? <Loading /> : children;
}

export default PrivateRoute;
