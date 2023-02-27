import { Result } from 'antd';
import React from 'react';
import useFetchData from '../../hooks/useFetchData';
import UsersCard from '../dashboard/UsersCard';

function Dashboard() {
  // fetch dashboard API data
  const [loading, error, response] = useFetchData('/api/v1/dashboard');

  return (
    <div>
      <h2 className='text-[20px] text-center font-text-font font-medium py-4'>
        Welcome to Beach Resort — Dashboard
      </h2>

      {error ? (
        <Result
          title='Failed to fetch'
          subTitle={error}
          status='error'
        />
      ) : (
        <UsersCard
          loading={loading}
          data={response?.data?.users_info}
        />
      )}
    </div>
  );
}

export default React.memo(Dashboard);
