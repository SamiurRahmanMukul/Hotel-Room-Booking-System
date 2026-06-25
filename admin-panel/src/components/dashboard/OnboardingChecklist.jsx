/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak, jsx-quotes, no-confusing-arrow */
import {
  CheckCircleFilled, ReloadOutlined, RightOutlined, RocketOutlined
} from '@ant-design/icons';
import {
  Alert, Button, Card, List, Modal, Progress, Tag, Typography, message
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ApiService from '../../utils/apiService';

function OnboardingChecklist() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiService.get('/api/v1/onboarding/checklist');
      setData(res);
    } catch (err) {
      // silent — non-critical
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onPublish = async () => {
    setPublishing(true);
    try {
      const res = await ApiService.post('/api/v1/onboarding/publish');
      if (res?.error) {
        message.error(`Cannot publish: ${(res.reasons || []).join(', ') || res.error}`);
      } else {
        message.success('Hotel published — your booking site is live');
      }
      setConfirmOpen(false);
      refresh();
    } catch (err) {
      message.error(err?.response?.data?.error || err?.message || 'Could not publish');
    } finally { setPublishing(false); }
  };

  if (loading || !data) return null;
  if (data.percent === 100 && data.hotel?.status === 'active') return null;

  const isPublished = data.hotel?.status === 'active';

  return (
    <>
      <Card
        size='small'
        style={{ marginBottom: 16, border: '1px solid #91caff', background: '#f0f9ff' }}
        title={(
          <span>
            <RocketOutlined style={{ marginRight: 8 }} />
            Getting started
            {' '}
            <Tag color='blue' style={{ marginLeft: 8 }}>{data.doneCount} of {data.total} done</Tag>
            {isPublished && <Tag color='green' style={{ marginLeft: 4 }}>Published</Tag>}
          </span>
        )}
        extra={(
          <Button size='small' type='text' icon={<ReloadOutlined />} onClick={refresh}>Refresh</Button>
        )}
      >
        <Progress percent={data.percent} status={isPublished ? 'success' : 'active'} style={{ marginBottom: 12 }} />
        <List
          size='small'
          dataSource={data.items}
          renderItem={(item) => {
            const isPublishItem = item.id === 'publish';
            const action = (() => {
              if (isPublishItem) {
                if (item.done) return <Tag color='green'>Live</Tag>;
                return (
                  <Button
                    type='primary'
                    size='small'
                    icon={<RocketOutlined />}
                    disabled={!data.canPublish}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Publish now
                  </Button>
                );
              }
              if (item.done) return <CheckCircleFilled style={{ color: '#52c41a', fontSize: 18 }} />;
              if (item.linkTo) {
                return (
                  <Link to={item.linkTo}>
                    <Button size='small' type='link'>Do this <RightOutlined /></Button>
                  </Link>
                );
              }
              return null;
            })();

            return (
              <List.Item style={{ padding: '8px 4px' }}>
                <Typography.Text
                  delete={item.done}
                  style={{ flex: 1, color: item.done ? '#8c8c8c' : '#000' }}
                >
                  {item.label}
                </Typography.Text>
                {action}
              </List.Item>
            );
          }}
        />
        {!data.canPublish && !isPublished && (
          <Alert
            type='info'
            showIcon
            style={{ marginTop: 8 }}
            message="Complete the address, at least one priced room, and policies — then you can publish."
          />
        )}
      </Card>

      <Modal
        open={confirmOpen}
        title='Publish your booking site?'
        okText='Yes, publish'
        confirmLoading={publishing}
        onOk={onPublish}
        onCancel={() => setConfirmOpen(false)}
      >
        <Typography.Paragraph>
          Your public booking site will go live at:
        </Typography.Paragraph>
        <Typography.Paragraph>
          <code>{`https://${data.hotel?.slug}.book.platform.com`}</code>
        </Typography.Paragraph>
        <Typography.Paragraph type='secondary'>
          You can keep editing rooms, photos, prices, and channels at any time after publishing.
        </Typography.Paragraph>
      </Modal>
    </>
  );
}

export default OnboardingChecklist;
