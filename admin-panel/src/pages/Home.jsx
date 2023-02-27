import { SmileOutlined } from '@ant-design/icons';
import { Button, Result } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  window.document.title = 'Beach Resort — Home';

  return (
    <div className='h-screen flex flex-col items-center justify-center'>
      <Result
        title={(
          <h2 className='text-lg font-text-font font-medium md:text-3xl'>
            Welcome to Beach Resort Admin Panel!
          </h2>
        )}
        icon={<SmileOutlined />}
        extra={(
          <Link to='/main/dashboard'>
            <Button
              type='primary'
              shape='round'
              size='large'
            >
              Go to Dashboard
            </Button>
          </Link>
        )}
      />
    </div>
  );
}

export default Home;
