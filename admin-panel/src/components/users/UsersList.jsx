import {
  Avatar, Button, Empty, Pagination, Result, Skeleton, Tag
} from 'antd';
import React, { useEffect, useState } from 'react';
import { v4 as uniqueId } from 'uuid';
import useFetchData from '../../hooks/useFetchData';
import { userStatusAsResponse } from '../../utils/responseAsStatus';
import QueryOptions from '../shared/QueryOptions';

function UsersList({ add }) {
  const [query, setQuery] = useState({
    search: '', sort: 'asce', page: '1', rows: '10'
  });

  // fetch user-list API data
  const [loading, error, response] = useFetchData(`/api/v1/all-users-list?keyword=${query.search}&limit=${query.rows}&page=${query.page}&sort=${query.sort}`);

  // reset query options
  useEffect(() => {
    setQuery((prevState) => ({ ...prevState, page: '1' }));
  }, [query.rows, query.search]);

  return (
    <div>
      {/* user list ― query section */}
      <QueryOptions query={query} setQuery={setQuery} />

      {/* user list ― content section */}
      <div className='w-full flex flex-row flex-wrap items-center justify-center gap-2'>
        {error ? (
          <Result
            title='Failed to fetch'
            subTitle={error}
            status='error'
          />
        ) : (
          <Skeleton loading={loading} paragraph={{ rows: 10 }} active>
            {response?.data?.rows?.length === 0 ? (
              <Empty
                className='mt-10'
                description={(<span>Sorry! Any data was not found.</span>)}
              />
            ) : (
              <div className='table-layout'>
                <div className='table-layout-container'>
                  <table className='data-table'>
                    {/* data table ― head */}
                    <thead className='data-table-head'>
                      <tr className='data-table-head-tr'>
                        <th className='data-table-head-tr-th' scope='col'>
                          Avatar
                        </th>
                        <th className='data-table-head-tr-th' scope='col'>
                          Full Name
                        </th>
                        <th className='data-table-head-tr-th' scope='col'>
                          Username
                        </th>
                        <th className='data-table-head-tr-th' scope='col'>
                          Email
                        </th>
                        <th className='data-table-head-tr-th' scope='col'>
                          Phone
                        </th>
                        <th className='data-table-head-tr-th text-center' scope='col'>
                          Role
                        </th>
                        <th className='data-table-head-tr-th text-center' scope='col'>
                          Status
                        </th>
                        <th className='data-table-head-tr-th text-center' scope='col'>
                          Verified
                        </th>
                        <th className='data-table-head-tr-th text-center' scope='col'>
                          Action
                        </th>
                      </tr>
                    </thead>

                    {/* data table ― body */}
                    <tbody>
                      {response?.data?.rows?.map((data) => (
                        <tr className='data-table-body-tr' key={uniqueId()}>
                          <td className='data-table-body-tr-td text-center'>
                            <Avatar src={data?.avatar} crossOrigin='anonymous' />
                          </td>
                          <td className='data-table-body-tr-td'>
                            {data?.fullName}
                          </td>
                          <td className='data-table-body-tr-td'>
                            {data?.userName}
                          </td>
                          <td className='data-table-body-tr-td !lowercase'>
                            {data?.email}
                          </td>
                          <td className='data-table-body-tr-td'>
                            {data?.phone}
                          </td>
                          <td className='data-table-body-tr-td text-center'>
                            <Tag
                              className='w-[60px] text-center uppercase'
                              color={data?.role === 'admin' ? 'magenta' : 'purple'}
                            >
                              {data?.role}
                            </Tag>
                          </td>
                          <td className='data-table-body-tr-td text-center'>
                            <Tag
                              className='w-[70px] text-center uppercase'
                              color={userStatusAsResponse(data?.status).color}
                            >
                              {userStatusAsResponse(data?.status).level}
                            </Tag>
                          </td>
                          <td className='data-table-body-tr-td text-center'>
                            <Tag
                              className='w-[50px] text-center uppercase'
                              color={data?.verified ? 'success' : 'error'}
                            >
                              {data?.verified ? 'Yes' : 'No'}
                            </Tag>
                          </td>
                          <td className='data-table-body-tr-td !px-0 text-center'>
                            <Button
                              className='inline-flex items-center !px-2'
                              onClick={() => add(data?.id)}
                              type='link'
                            >
                              VIEW DETAILS
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </Skeleton>
        )}
      </div>

      {/* user list ― pagination */}
      {response?.data?.total_page > 1 && (
        <Pagination
          className='my-5'
          onChange={(e) => setQuery((prevState) => ({ ...prevState, page: e }))}
          total={response?.data?.total_page * 10}
          current={response?.data?.current_page}
        />
      )}
    </div>
  );
}

export default React.memo(UsersList);
