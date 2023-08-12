/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { Button, Modal, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

function RoomStatusUpdateModal({ statusUpdateModal, setStatusUpdateModal, setFetchAgain }) {
  const [roomStatus, setRoomStatus] = useState([
    { value: 'approved', label: 'Approved', disabled: false },
    { value: 'rejected', label: 'Rejected', disabled: false },
    { value: 'in-reviews', label: 'In Reviews', disabled: true }
  ]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (statusUpdateModal?.status === 'approved') {
      setRoomStatus([
        { value: 'approved', label: 'Approved', disabled: true },
        { value: 'rejected', label: 'Rejected', disabled: true },
        { value: 'in-reviews', label: 'In Reviews', disabled: false }
      ]);
    }
  }, [statusUpdateModal]);

  // function to handle update room status
  const handleUpdateStatus = () => {
    if (!status) {
      notificationWithIcon('error', 'ERROR', 'Please select an status first to update room status');
    } else {
      setLoading(true);
      ApiService.put(
        `/api/v1/updated-booking-order/${statusUpdateModal?.roomId}`,
        { booking_status: status }
      )
        .then((res) => {
          setLoading(false);
          if (res?.result_code === 0) {
            notificationWithIcon('success', 'SUCCESS', res?.result?.message || 'Room status update successful');
            setStatusUpdateModal((prevState) => ({ ...prevState, open: false, status: null }));
            setFetchAgain((prevState) => !prevState);
          } else {
            notificationWithIcon('error', 'ERROR', 'Sorry! Something went wrong. App server error');
          }
        })
        .catch((err) => {
          setLoading(false);
          notificationWithIcon('error', 'ERROR', err?.response?.data?.result?.error?.message || err?.response?.data?.result?.error || 'Sorry! Something went wrong. App server error');
        });
    }
  };

  return (
    <Modal
      title='Update Room Status:'
      open={statusUpdateModal?.open}
      onOk={() => setStatusUpdateModal(
        (prevState) => ({ ...prevState, open: false, status: null })
      )}
      onCancel={() => setStatusUpdateModal(
        (prevState) => ({ ...prevState, open: false, status: null })
      )}
      footer={[
        <Button
          onClick={() => setStatusUpdateModal(
            (prevState) => ({ ...prevState, open: false, status: null })
          )}
          key='back'
        >
          Cancel
        </Button>,
        <Button
          onClick={handleUpdateStatus}
          type='primary'
          key='submit'
          disabled={loading}
          loading={loading}
        >
          Ok
        </Button>
      ]}
    >
      <Select
        className='w-full my-5'
        placeholder='-- select room status --'
        optionFilterProp='children'
        options={roomStatus}
        size='large'
        allowClear
        value={status}
        onChange={(value) => setStatus(value)}
      />
    </Modal>
  );
}

export default RoomStatusUpdateModal;
