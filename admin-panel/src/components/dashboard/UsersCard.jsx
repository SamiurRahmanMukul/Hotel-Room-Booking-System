import { Card, Statistic } from 'antd';
import React from 'react';
import CountUp from 'react-countup';
import { useNavigate } from 'react-router-dom';

const formatter = (value) => <CountUp end={value} separator=',' />;
const gridStyle = { width: '25%', textAlign: 'center' };

function UsersCard({ loading, data }) {
  const navigate = useNavigate();

  return (
    <Card
      className='w-full cursor-pointer md:w-1/2'
      onClick={() => navigate('/main/users')}
      title='Users Information'
      loading={loading}
    >
      <Card.Grid style={gridStyle}>
        <Statistic
          title='Total Users'
          formatter={formatter}
          value={data?.total_users || 0}
        />
      </Card.Grid>
      <Card.Grid style={gridStyle}>
        <Statistic
          title='Admin Users'
          formatter={formatter}
          value={data?.admin_role_user || 0}
        />
      </Card.Grid>
      <Card.Grid style={gridStyle}>
        <Statistic
          title='User Users'
          formatter={formatter}
          value={data?.user_role_user || 0}
        />
      </Card.Grid>

      <Card.Grid style={gridStyle}>
        <Statistic
          title='Register Users'
          formatter={formatter}
          value={data?.register_status_user || 0}
        />
      </Card.Grid>
      <Card.Grid style={gridStyle}>
        <Statistic
          title='Login Users'
          formatter={formatter}
          value={data?.login_status_user || 0}
        />
      </Card.Grid>
      <Card.Grid style={gridStyle}>
        <Statistic
          title='Logout Users'
          formatter={formatter}
          value={data?.logout_status_user || 0}
        />
      </Card.Grid>
      <Card.Grid style={gridStyle}>
        <Statistic
          title='Blocked Users'
          formatter={formatter}
          value={data?.blocked_status_user || 0}
        />
      </Card.Grid>

      <Card.Grid style={gridStyle}>
        <Statistic
          title='Verified Users'
          formatter={formatter}
          value={data?.verified_user || 0}
        />
      </Card.Grid>
    </Card>
  );
}

export default UsersCard;
