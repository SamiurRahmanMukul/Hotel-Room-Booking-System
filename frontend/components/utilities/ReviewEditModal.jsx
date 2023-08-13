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

function ReviewEditModal({ reviewEditModal, setReviewEditModal, setFetchAgain }) {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // function to update reviews
  const onFinish = (values) => {
    setLoading(true);
    ApiService.put(`/api/v1/edit-room-review/${reviewEditModal?.reviewId}`, values)
      .then((response) => {
        setLoading(false);
        if (response?.result_code === 0) {
          notificationWithIcon('success', 'SUCCESS', response?.result?.message || 'Your reviews updating successful');
          form.resetFields();
          setFetchAgain((prevState) => !prevState);
          setReviewEditModal((prevState) => ({
            ...prevState, open: false, reviewId: null, rating: null, message: null
          }));
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
      title='Edit Your Placed Review & Rating:'
      open={reviewEditModal.open}
      onOk={() => setReviewEditModal((prevState) => ({
        ...prevState, open: false, reviewId: null, rating: null, message: null
      }))}
      onCancel={() => setReviewEditModal((prevState) => ({
        ...prevState, open: false, reviewId: null, rating: null, message: null
      }))}
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
        initialValues={{
          rating: reviewEditModal?.rating || undefined,
          message: reviewEditModal?.message || undefined
        }}
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
            Update Reviews
          </Button>

          <Button
            className='login-form-button'
            style={{ marginLeft: '10px' }}
            type='default'
            size='large'
            danger
            onClick={() => setReviewEditModal((prevState) => ({
              ...prevState, open: false, reviewId: null, rating: null, message: null
            }))}
          >
            Closed
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}

ReviewEditModal.defaultProps = {
  reviewEditModal: {
    open: false, reviewId: null, rating: null, message: null
  }
};

ReviewEditModal.propTypes = {
  reviewEditModal: PropTypes.object
};

export default ReviewEditModal;
