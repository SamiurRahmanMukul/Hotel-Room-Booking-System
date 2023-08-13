/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import {
  Button, Form, Input, Modal, Rate
} from 'antd';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

const { TextArea } = Input;

function ReviewAddModal({ addReviewModal, setAddReviewModal, setFetchAgain }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // function to handle submit reviews
  const onFinish = (values) => {
    setLoading(true);
    ApiService.post(`/api/v1/room-review-add/${addReviewModal?.bookingId}`, values)
      .then((response) => {
        setLoading(false);
        if (response?.result_code === 0) {
          notificationWithIcon('success', 'SUCCESS', response?.result?.message || 'Your review placed successful');
          form.resetFields();
          setFetchAgain((prevState) => !prevState);
          setAddReviewModal((prevState) => ({ ...prevState, open: false, bookingId: null }));
        } else {
          notificationWithIcon('error', 'ERROR', 'Sorry! Something went wrong. App server error');
        }
      })
      .catch((err) => {
        setLoading(false);
        notificationWithIcon('error', 'ERROR', err?.response?.data?.result?.error?.message || err?.response?.data?.result?.error || 'Sorry! Something went wrong. App server error');
      });
  };

  return (
    <Modal
      title='To Placed Review Your Room Booking Order:'
      open={addReviewModal.open}
      onOk={() => setAddReviewModal(
        (prevState) => ({ ...prevState, open: false, bookingId: null })
      )}
      onCancel={() => setAddReviewModal(
        (prevState) => ({ ...prevState, open: false, bookingId: null })
      )}
      closable={false}
      centered
      footer={[]}
    >
      <Form
        form={form}
        className='login-form'
        name='create-new-user'
        onFinish={onFinish}
        layout='vertical'
      >
        <Form.Item
          label='Rating'
          name='rating'
          rules={[{
            required: true,
            message: 'Please input your Rating!'
          }]}
        >
          <Rate count={5} />
        </Form.Item>

        <Form.Item
          label='Message'
          name='message'
          rules={[{
            required: true,
            message: 'Please input your Message!'
          }]}
        >
          <TextArea
            style={{ height: 100, resize: 'none' }}
            placeholder='Type here your message'
            maxLength={100}
            showCount
          />
        </Form.Item>

        <Form.Item style={{ paddingTop: '10px' }}>
          <Button
            className='login-form-button'
            htmlType='submit'
            type='primary'
            size='large'
            loading={loading}
            disabled={loading}
          >
            Submit Review
          </Button>

          <Button
            className='login-form-button'
            style={{ marginLeft: '10px' }}
            type='default'
            size='large'
            danger
            onClick={() => setAddReviewModal(
              (prevState) => ({ ...prevState, open: false, bookingId: null })
            )}
          >
            Closed
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

ReviewAddModal.defaultProps = {
  addReviewModal: { open: false, bookingId: null }
};

ReviewAddModal.propTypes = {
  addReviewModal: PropTypes.object
};

export default ReviewAddModal;
