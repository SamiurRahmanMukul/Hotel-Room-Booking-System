/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import {
  Descriptions, Image, List, Result, Skeleton, Tag, Typography
} from 'antd';
import React from 'react';
import { v4 as uniqueId } from 'uuid';
import useFetchData from '../../hooks/useFetchData';
import { roomStatusAsResponse, roomTypeAsColor } from '../../utils/responseAsStatus';

function RoomDetails({ id }) {
  // fetch room-details API data
  const [loading, error, response] = useFetchData(`/api/v1/get-room-by-id-or-slug-name/${id}`);

  return (
    <Skeleton loading={loading} paragraph={{ rows: 10 }} active avatar>
      {error ? (
        <Result
          title='Failed to fetch'
          subTitle={error}
          status='error'
        />
      ) : (
        <Descriptions
          title='Room Information'
          bordered
        >
          <Descriptions.Item label='Images' span={3}>
            <Image.PreviewGroup>
              {response?.data?.room_images?.map((image) => (
                <Image
                  key={uniqueId()}
                  className='p-2'
                  src={image?.url}
                  crossOrigin='anonymous'
                  alt='user-image'
                  width={120}
                  height={100}
                />
              ))}
            </Image.PreviewGroup>
          </Descriptions.Item>

          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Name</span>}
          >
            {response?.data?.room_name}
          </Descriptions.Item>
          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Slug</span>}
            span={2}
          >
            {response?.data?.room_slug}
          </Descriptions.Item>

          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Descriptions</span>}
          >
            <Tag
              className='text-center uppercase'
              color={roomTypeAsColor(response?.data?.room_type)}
            >
              {response?.data?.room_type}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Price</span>}
            span={2}
          >
            {`$ ${response?.data?.room_price}`}
          </Descriptions.Item>

          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Size</span>}
          >
            {`${response?.data?.room_size} sq. ft.`}
          </Descriptions.Item>
          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Capacity</span>}
            span={2}
          >
            {`${response?.data?.room_capacity} Person`}
          </Descriptions.Item>

          <Descriptions.Item label={<span className='whitespace-nowrap'>Allow Pets</span>}>
            <Tag
              className='w-[60px] text-center uppercase'
              color={response?.data?.allow_pets ? 'success' : 'error'}
            >
              {response?.data?.allow_pets ? 'YES' : 'NO'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Provided Breakfast</span>}
            span={2}
          >
            <Tag
              className='w-[60px] text-center uppercase'
              color={response?.data?.provide_breakfast ? 'success' : 'error'}
            >
              {response?.data?.provide_breakfast ? 'YES' : 'NO'}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Featured Room</span>}
          >
            <Tag
              className='w-[60px] text-center uppercase'
              color={response?.data?.featured_room ? 'success' : 'error'}
            >
              {response?.data?.featured_room ? 'YES' : 'NO'}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Status</span>}
            span={2}
          >
            <Tag
              className='w-[80px] text-center uppercase'
              color={roomStatusAsResponse(response?.data?.room_status).color}
            >
              {roomStatusAsResponse(response?.data?.room_status).level}
            </Tag>
          </Descriptions.Item>

          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Last Update At</span>}
          >
            {response?.data?.updated_at?.split('T')[0]}
          </Descriptions.Item>
          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Created At</span>}
            span={2}
          >
            {response?.data?.created_at?.split('T')[0]}
          </Descriptions.Item>

          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Room Descriptions</span>}
            span={3}
          >
            {response?.data?.room_description}
          </Descriptions.Item>
          <Descriptions.Item
            label={<span className='whitespace-nowrap'>Extra Facilities</span>}
            span={3}
          >
            <List
              bordered
              dataSource={response?.data?.extra_facilities}
              renderItem={(item) => (
                <List.Item>
                  <Typography.Text>{item}</Typography.Text>
                </List.Item>
              )}
            />
          </Descriptions.Item>
        </Descriptions>
      )}
    </Skeleton>
  );
}

export default React.memo(RoomDetails);
