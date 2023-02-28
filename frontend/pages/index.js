import React from 'react';
import MainLayout from '../components/main-layout';

function Home() {
  return (
    <MainLayout title='Beach Resort - Home'>
      <h2 style={{ textAlign: 'center', marginTop: '20px', marginBottom: 'calc(100vh - 270px)' }}>
        Welcome to Beach Resort
      </h2>
    </MainLayout>
  );
}

export default Home;
