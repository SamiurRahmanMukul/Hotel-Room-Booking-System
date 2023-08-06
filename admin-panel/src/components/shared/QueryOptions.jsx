/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { SearchOutlined } from '@ant-design/icons';
import { Input, Select } from 'antd';
import React from 'react';

function QueryOptions({ query, setQuery, disabledSearch }) {
  return (
    <div className='flex flex-col items-center justify-between space-x-0 space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0'>
      <Input
        className='space-x-4'
        onChange={(e) => setQuery((prevState) => ({ ...prevState, search: e.target.value }))}
        placeholder='Start type here to Search...'
        prefix={<SearchOutlined />}
        disabled={disabledSearch}
        value={query.search}
        size='large'
        allowClear
      />

      <Select
        className='w-full sm:w-[240px]'
        onChange={(value) => setQuery((prevState) => ({ ...prevState, rows: value }))}
        placeholder='-- show rows --'
        defaultValue={query.rows}
        size='large'
      >
        <Select.Option value='05'>05 Rows</Select.Option>
        <Select.Option value='10'>10 Rows</Select.Option>
        <Select.Option value='20'>20 Rows</Select.Option>
        <Select.Option value='30'>30 Rows</Select.Option>
        <Select.Option value='40'>40 Rows</Select.Option>
        <Select.Option value='50'>50 Rows</Select.Option>
      </Select>

      <Select
        className='w-full sm:w-[240px]'
        onChange={(value) => setQuery((prevState) => ({ ...prevState, sort: value }))}
        placeholder='-- select type to sort --'
        defaultValue={query.sort}
        size='large'
      >
        <Select.Option value='asce'>Sort By Ascending Order</Select.Option>
        <Select.Option value='desc'>Sort By Descending Order</Select.Option>
      </Select>
    </div>
  );
}

export default React.memo(QueryOptions);
