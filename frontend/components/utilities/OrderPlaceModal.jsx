/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Modal, message } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { Calendar } from 'react-multi-date-picker';
import DatePanel from 'react-multi-date-picker/plugins/date_panel';
import DatePickerHeader from 'react-multi-date-picker/plugins/date_picker_header';
import Toolbar from 'react-multi-date-picker/plugins/toolbar';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';

const { confirm } = Modal;

function OrderPlaceModal({ bookingModal, setBookingModal }) {
  const [selectedDates, setSelectedDates] = useState([]);
  const router = useRouter();

  // handle date change on date picker
  const handleDateChange = (dates) => {
    const formattedDates = dates.map((date) => dayjs(date).format('YYYY-MM-DD'));
    setSelectedDates(formattedDates);
  };

  // function to handle placed room booking order
  const handlePlacedOrder = () => {
    if (selectedDates.length === 0) {
      notificationWithIcon('error', 'ERROR', 'Minimum 1 date selection is required to placed room booking order.');
    } else {
      confirm({
        title: 'Are your selected dates booked this Room?',
        icon: <ExclamationCircleOutlined />,
        okText: 'Ok',
        cancelText: 'Cancel',
        onOk() {
          return new Promise((resolve, reject) => {
            ApiService.post(`/api/v1/placed-booking-order/${bookingModal?.roomId}`, {
              booking_dates: selectedDates
            })
              .then((res) => {
                resolve();
                if (res?.result_code === 0) {
                  notificationWithIcon('success', 'SUCCESS', (res?.result?.message || 'Your room booking order placed successful'));
                  setBookingModal((prevState) => ({ ...prevState, open: false, roomId: null }));
                  router.push('/profile?tab=booking-history');
                  setSelectedDates([]);
                } else {
                  notificationWithIcon('error', 'ERROR', 'Sorry! Something went wrong. App server error');
                }
              })
              .catch((err) => {
                notificationWithIcon('error', 'ERROR', (err?.response?.data?.result?.error?.message || err?.message || 'Sorry! Something went wrong. App server error'));
                reject();
              });
          }).catch((err) => message.error(err?.message || 'Oops errors!'));
        }
      });
    }
  };

  return (
    <Modal
      title='Select data which dates are you Booked Room:'
      open={bookingModal.open}
      onOk={() => setBookingModal((prevState) => (
        { ...prevState, open: false, roomId: null }
      ))}
      onCancel={() => setBookingModal((prevState) => (
        { ...prevState, open: false, roomId: null }
      ))}
      closable={false}
      centered
      footer={[
        <div key='custom-footer'>
          {/* button closed/hide modal */}
          <Button
            onClick={() => setBookingModal((prevState) => (
              { ...prevState, open: false, roomId: null }
            ))}
            type='default'
            size='middle'
          >
            Cancel
          </Button>

          {/* button to handle placed order */}
          <Button
            onClick={handlePlacedOrder}
            type='primary'
            size='middle'
          >
            Placed Order
          </Button>
        </div>
      ]}
    >
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Calendar
          style={{ width: '100%' }}
          plugins={[
            <DatePickerHeader
              key='date-picker-header'
              position='top'
              size='medium'
            />,
            <DatePanel
              style={{ width: '100%' }}
              key='date-panel'
              position='right'
              sort='date'
            />,
            <Toolbar
              key='toolbar'
              position='bottom'
            />
          ]}
          minDate={new Date(new Date()).setDate(new Date().getDate() + 1)}
          maxDate={new Date(new Date()).setDate(new Date().getDate() + 30)}
          onChange={handleDateChange}
          value={selectedDates}
          format='YYYY/MM/DD'
          highlightToday
          multiple
        />
      </div>
    </Modal>
  );
}

OrderPlaceModal.defaultProps = {
  bookingModal: { open: false, roomId: null }
};

OrderPlaceModal.propTypes = {
  bookingModal: PropTypes.object
};

export default OrderPlaceModal;
