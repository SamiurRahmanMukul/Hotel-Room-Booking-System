/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import {
  Avatar, Button, List, Rate, Result, Skeleton
} from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import useFetchData from '../../hooks/useFetchData';
import { getSessionUser } from '../../utils/authentication';
import ReviewEditModal from './ReviewEditModal';

function RoomReviewList({ roomId }) {
  const user = getSessionUser();
  const [fetchAgain, setFetchAgain] = useState(false);
  const [filter, setFilter] = useState({
    page: 1, limit: 10, sort: 'desc'
  });
  const [reviewEditModal, setReviewEditModal] = useState({
    open: false, reviewId: null, rating: null, message: null
  });

  // fetch user booking history API data
  const [loading, error, response] = useFetchData(`/api/v1/get-room-reviews-list/${roomId}?limit=${filter.limit}&page=${filter.page}&sort=${filter.sort}`, fetchAgain);

  return (
    <>
      {error ? (
        <Result
          title='Failed to fetch'
          subTitle={error}
          status='500'
          extra={(
            <Button
              onClick={() => setFetchAgain(!fetchAgain)}
              type='primary'
              size='large'
              loading={loading}
              disabled={loading}
            >
              Try to Again
            </Button>
          )}
        />
      ) : (
        <List
          className='demo-load-more-list'
          itemLayout='horizontal'
          header={<h2>Reviews & Rating:</h2>}
          loading={loading}
          dataSource={response?.data?.rows}
          loadMore={response?.data?.total_page > 1 ? (
            <div
              style={{
                textAlign: 'center',
                marginTop: 12,
                height: 32,
                lineHeight: '32px'
              }}
            >
              <Button
                type='default'
                size='large'
                onClick={() => setFilter((prevState) => (
                  { ...prevState, limit: filter.limit + 5 }
                ))}
              >
                Loading more...
              </Button>
            </div>
          ) : null}
          renderItem={(item) => (
            <List.Item
              actions={[
                <div key='edit-review'>
                  {user?.id === item?.reviews_by?.id && (
                    <Button
                      type='primary'
                      size='large'
                      onClick={() => setReviewEditModal((prevState) => ({
                        ...prevState, open: true, reviewId: item?.id, rating: item?.rating, message: item?.message
                      }))}
                    >
                      Edit Your Review & Rating
                    </Button>
                  )}
                </div>
              ]}
            >
              <Skeleton
                title={false}
                loading={loading}
                avatar
                active
              >
                <List.Item.Meta
                  avatar={(
                    <Avatar
                      src={item?.reviews_by?.avatar || 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg'}
                    />
                  )}
                  title={item?.reviews_by?.fullName || 'N/A'}
                  description={item?.message}
                />
                <div>
                  <Rate value={item?.rating} disabled />
                </div>
              </Skeleton>
            </List.Item>
          )}
        />
      )}

      {/* review & rating edit modal */}
      {reviewEditModal?.open && (
        <ReviewEditModal
          reviewEditModal={reviewEditModal}
          setReviewEditModal={setReviewEditModal}
          setFetchAgain={setFetchAgain}
        />
      )}
    </>
  );
}

RoomReviewList.defaultProps = {
  roomId: ''
};

RoomReviewList.propTypes = {
  roomId: PropTypes.string
};

export default RoomReviewList;
