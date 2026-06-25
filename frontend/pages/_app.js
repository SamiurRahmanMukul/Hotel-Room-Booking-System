/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { ConfigProvider } from 'antd';
import { DefaultSeo } from 'next-seo';
import Head from 'next/head';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import ErrorBoundary from '../components/shared/ErrorBoundary';
import { HotelProvider } from '../context/HotelContext';
import SEO from '../next-seo.config';
import { persistor, store } from '../store';

import 'antd/dist/reset.css';
import '../styles/global.css';

const FONT_FAMILY = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';

function LoadApp({ Component, pageProps }) {
  const { theme } = useSelector((state) => state.app);

  return (
    <>
      <DefaultSeo {...SEO} />
      <Head>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link rel='preconnect' href='https://fonts.gstatic.com' crossOrigin='anonymous' />
        <link
          href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@400;500;600&display=swap'
          rel='stylesheet'
        />
        <style>{`html, body { font-family: ${FONT_FAMILY}; }`}</style>
      </Head>
      <ConfigProvider theme={{ token: { ...(theme || {}), fontFamily: FONT_FAMILY } }}>
        <ErrorBoundary>
          <HotelProvider>
            <Component {...pageProps} />
          </HotelProvider>
        </ErrorBoundary>
      </ConfigProvider>
    </>
  );
}

function MyApp({ Component, pageProps }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <LoadApp Component={Component} pageProps={pageProps} />
      </PersistGate>
    </Provider>
  );
}

export default MyApp;
