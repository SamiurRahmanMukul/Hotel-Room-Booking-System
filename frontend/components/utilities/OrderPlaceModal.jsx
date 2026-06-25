import { ExclamationCircleOutlined } from '@ant-design/icons';
import { Button, Modal, message } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useHotel } from '../../context/HotelContext';
import ApiService from '../../utils/apiService';
import notificationWithIcon from '../../utils/notification';
import BookingCalendar from './BookingCalendar';

const { confirm } = Modal;

function OrderPlaceModal({ bookingModal, setBookingModal }) {
  const [selection, setSelection] = useState({
    from: null, to: null, nights: 0, total: 0
  });
  const router = useRouter();
  const { hotelId } = useHotel();

  const handlePlacedOrder = () => {
    if (!selection.from || !selection.to) {
      notificationWithIcon('error', 'Select dates', 'Please pick check-in and check-out dates.');
      return;
    }
    if (selection.nights < 1) {
      notificationWithIcon('error', 'Invalid range', 'Stay must be at least 1 night.');
      return;
    }

    const dates = [];
    const cursor = new Date(selection.from);
    while (cursor < selection.to) {
      dates.push(dayjs(cursor).format('YYYY-MM-DD'));
      cursor.setDate(cursor.getDate() + 1);
    }

    confirm({
      title: `Confirm booking for ${selection.nights} night${selection.nights !== 1 ? 's' : ''}?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Confirm',
      cancelText: 'Cancel',
      onOk() {
        return new Promise((resolve, reject) => {
          ApiService.post(`/api/v1/placed-booking-order/${bookingModal?.roomId}`, {
            booking_dates: dates
          })
            .then((res) => {
              resolve();
              if (res?.result_code === 0) {
                notificationWithIcon('success', 'Booked', res?.result?.message || 'Your booking is confirmed.');
                setBookingModal((prev) => ({ ...prev, open: false, roomId: null }));
                router.push('/profile?tab=booking-history');
                setSelection({
                  from: null, to: null, nights: 0, total: 0
                });
              } else {
                notificationWithIcon('error', 'Error', 'Sorry — something went wrong. Please try again.');
              }
            })
            .catch((err) => {
              notificationWithIcon('error', 'Error', err?.response?.data?.result?.error?.message || err?.message || 'Server error');
              reject();
            });
        }).catch((err) => message.error(err?.message || 'Oops!'));
      }
    });
  };

  const close = () => setBookingModal((prev) => ({ ...prev, open: false, roomId: null }));

  return (
    <Modal
      title='Choose your dates'
      open={bookingModal.open}
      onCancel={close}
      closable={false}
      centered
      width={760}
      footer={[
        <Button key='cancel' onClick={close}>Cancel</Button>,
        <Button
          key='book'
          type='primary'
          onClick={handlePlacedOrder}
          disabled={!selection.from || !selection.to}
        >
          {selection.total ? `Book — €${selection.total}` : 'Book'}
        </Button>
      ]}
    >
      <BookingCalendar
        hotelId={bookingModal?.hotelId || hotelId}
        roomTypeId={bookingModal?.roomTypeId || ''}
        basePrice={Number(bookingModal?.pricePerNight) || 0}
        currency='EUR'
        onChange={setSelection}
      />
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
