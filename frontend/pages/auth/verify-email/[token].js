/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { Result } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import MainLayout from '../../../components/layout';
import PrivateRoute from '../../../components/routes/PrivateRoute';
import Loading from '../../../components/shared/Loading';
import ApiService from '../../../utils/apiService';
import { setSessionUserKeyAgainstValue } from '../../../utils/authentication';
import notificationWithIcon from '../../../utils/notification';

function VerifyEmail() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (router.query.token) {
      setLoading(true);
      ApiService.post(`/api/v1/auth/verify-email/${router.query.token}`)
        .then((res) => {
          if (res?.result_code === 0) {
            notificationWithIcon('success', 'SUCCESS', res?.result?.message || 'Verification link send successful');
            setSessionUserKeyAgainstValue('verified', true);
            router.push('/profile?tab=my-profile');
            setLoading(false);
          } else {
            notificationWithIcon('error', 'ERROR', 'Sorry! Something went wrong. App server error');
            setError('Sorry! Something went wrong. App server error');
            setLoading(false);
          }
        })
        .catch((err) => {
          notificationWithIcon('error', 'ERROR', err?.response?.data?.result?.error?.message || err?.response?.data?.result?.error || 'Sorry! Something went wrong. App server error');
          setError(err?.response?.data?.result?.error?.message || err?.response?.data?.result?.error || 'Sorry! Something went wrong. App server error');
          setLoading(false);
        });
    }
  }, [router.query.token]);

  return (
    <PrivateRoute>
      <MainLayout title='Beach Resort ― Verify Email'>
        <div style={{ width: '400px', height: 'calc(100vh - 205px)', margin: '0 auto' }}>
          {/* loader showing */}
          {loading && (<Loading />)}

          {/* error showing */}
          {error && (
            <Result
              status='500'
              title='Error'
              subTitle={error}
              extra={(
                <Link className='btn-primary' href='/'>
                  Back to home
                </Link>
              )}
            />
          )}
        </div>
      </MainLayout>
    </PrivateRoute>
  );
}

export default VerifyEmail;
