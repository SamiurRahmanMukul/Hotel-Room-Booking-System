/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak */
/* eslint-disable jsx-quotes, no-confusing-arrow, no-underscore-dangle, prefer-destructuring */
import { ExportOutlined } from '@ant-design/icons';
import {
  Button, Space, Typography
} from 'antd';
import React from 'react';
import Channels from '../booking-site/Channels';

const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3034';

function BookingSitePreview() {
  let me = {};
  try { me = JSON.parse(localStorage.getItem('user') || '{}'); } catch { me = {}; }
  const slug = me.hotelSlug || 'default';
  const previewUrl = `${FRONTEND_URL}?slug=${encodeURIComponent(slug)}`;
  const publicUrl = `https://${slug}.book.platform.com`;

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Manage external platforms
          </Typography.Title>
          <Typography.Text type='secondary'>
            Connect Airbnb, Booking.com, Vrbo and others. Open your live booking site in a new tab.
          </Typography.Text>
        </div>
        <Space>
          <Button
            icon={<ExportOutlined />}
            onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}
          >
            Open booking site
          </Button>
          <Button
            type='link'
            onClick={() => { navigator.clipboard.writeText(publicUrl); }}
          >
            Copy public URL
          </Button>
        </Space>
      </div>

      <Channels />
    </div>
  );
}

export default BookingSitePreview;
