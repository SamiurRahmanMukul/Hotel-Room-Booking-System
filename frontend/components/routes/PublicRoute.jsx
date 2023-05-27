/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { getSessionToken, getSessionUser } from '../../utils/authentication';
import Loading from '../shared/Loading';

function PublicRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const user = getSessionUser();
  const token = getSessionToken();
  const router = useRouter();

  useEffect(() => {
    if (user && token) {
      router.push('/profile?tab=my-profile');
    } else {
      setLoading(false);
    }
  }, [user, token]);

  return loading ? <Loading /> : children;
}

export default PublicRoute;
