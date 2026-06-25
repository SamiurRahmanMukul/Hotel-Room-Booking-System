/* eslint-disable max-len */
/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline, operator-linebreak */
/* eslint-disable jsx-quotes, no-confusing-arrow, no-underscore-dangle */
/* eslint-disable react/no-unstable-nested-components, react/jsx-max-props-per-line */
/* eslint-disable react/jsx-curly-newline, react/jsx-first-prop-new-line */
/* eslint-disable react/jsx-closing-tag-location, object-property-newline, react/jsx-closing-bracket-location */
/* eslint-disable react/no-array-index-key, prefer-destructuring */
/* eslint-disable no-unneeded-ternary, no-nested-ternary, jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import { DeleteOutlined, ExclamationCircleFilled, UserAddOutlined } from '@ant-design/icons';
import {
  Button, Modal, Pagination, Popconfirm, Result, Select, Skeleton, Tooltip, Typography, message
} from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ApiService from '../../utils/apiService';
import {
  CounterChip, StatusPill, FilterBar, SearchInput, SortSelect,
  RowsPerPageSelect, DataTable, TableContainer
} from '../shared/DataTable';

const ROLE_PILL = {
  admin: { color: '#853953', bg: '#F8E8EE' },
  user: { color: '#612D53', bg: '#F5EDF1' }
};
const STATUS_PILL = {
  login: { color: '#3F7D58', bg: '#EAF6EE' },
  logout: { color: '#6B6B6B', bg: '#F1F1F1' },
  register: { color: '#C8923A', bg: '#FFF7E6' },
  blocked: { color: '#A4243B', bg: '#FFEBEE' }
};

function UsersList({ add }) {
  const [query, setQuery] = useState({ search: '', sort: 'desc', page: 1, rows: 20 });
  const [roleFilter, setRoleFilter] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ApiService.get(
        `/api/v1/all-users-list?keyword=${encodeURIComponent(query.search)}&limit=${query.rows}&page=${query.page}&sort=${query.sort}`
      );
      setData(res?.result?.data || null);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.result?.error || err.message);
    } finally { setLoading(false); }
  }, [query, refreshKey]);

  useEffect(() => { refresh(); }, [refresh]);

  const allRows = data?.rows || [];
  const filteredRows = useMemo(() => (
    roleFilter === 'all' ? allRows : allRows.filter((u) => u.role === roleFilter)
  ), [allRows, roleFilter]);

  const counts = useMemo(() => ({
    total: allRows.length,
    admins: allRows.filter((u) => u.role === 'admin').length,
    users: allRows.filter((u) => u.role === 'user').length,
    verified: allRows.filter((u) => u.verified).length,
    blocked: allRows.filter((u) => u.status === 'blocked').length
  }), [allRows]);

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete this user?',
      icon: <ExclamationCircleFilled />,
      content: 'This action cannot be undone. The user’s bookings stay in the system but become unattributed.',
      okText: 'Delete',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await ApiService.delete(`/api/v1/delete-user/${id}`);
          message.success('User deleted');
          setRefreshKey((k) => k + 1);
        } catch (err) {
          message.error(err?.response?.data?.result?.error || 'Could not delete');
        }
      }
    });
  };

  const stripBaseUrl = (avatar) => {
    if (!avatar || avatar.endsWith('undefined')) return null;
    return avatar;
  };

  return (
    <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <Typography.Title level={2} style={{ marginTop: 0, marginBottom: 4, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Users
          </Typography.Title>
          <Typography.Text type='secondary'>
            Click an avatar to view & edit. Click the trash icon to delete.
          </Typography.Text>
        </div>
        <Button type='primary' icon={<UserAddOutlined />} onClick={() => add()}>Add user</Button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
        <CounterChip label='Total users' value={counts.total} />
        <CounterChip label='Admins' value={counts.admins} color='#853953' />
        <CounterChip label='Customers' value={counts.users} color='#612D53' />
        <CounterChip label='Verified' value={counts.verified} color='#3F7D58' />
        <CounterChip label='Blocked' value={counts.blocked} color='#A4243B' />
      </div>

      <FilterBar>
        <SearchInput
          placeholder='Search name, email…'
          value={query.search}
          onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value, page: 1 }))}
        />
        <Select
          value={roleFilter}
          onChange={setRoleFilter}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: 'All roles' },
            { value: 'admin', label: 'Admins' },
            { value: 'user', label: 'Customers' }
          ]}
        />
        <SortSelect
          value={query.sort}
          onChange={(v) => setQuery((q) => ({ ...q, sort: v }))}
        />
        <RowsPerPageSelect
          value={query.rows}
          onChange={(v) => setQuery((q) => ({ ...q, rows: v, page: 1 }))}
        />
      </FilterBar>

      <TableContainer>
        {error ? (
          <Result status='error' title='Failed to fetch' subTitle={error} />
        ) : loading ? (
          <div style={{ padding: 24 }}><Skeleton active paragraph={{ rows: 6 }} /></div>
        ) : (
          <DataTable
            emptyText='No users match the current filters.'
            dataSource={filteredRows}
            rowKey='id'
            columns={[
              {
                title: 'User', dataIndex: 'fullName',
                render: (name, u) => {
                  const avatar = stripBaseUrl(u.avatar);
                  const initial = (name || u.email || '?').trim().charAt(0).toUpperCase();
                  return (
                    <Tooltip title='Click to view & edit'>
                      <span
                        role='button'
                        tabIndex={0}
                        onClick={() => add(u.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                      >
                        {avatar ? (
                          <img
                            src={avatar} alt={name} crossOrigin='anonymous'
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: '#853953', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 600, flexShrink: 0
                          }}
                          >
                            {initial}
                          </div>
                        )}
                        <span style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 500, color: '#2C2C2C' }}>{name}</div>
                          <div style={{ color: '#9CA3AF', fontSize: 11 }}>@{u.userName}</div>
                        </span>
                      </span>
                    </Tooltip>
                  );
                }
              },
              { title: 'Email', dataIndex: 'email', render: (v) => <span style={{ color: '#6B6B6B' }}>{v}</span> },
              { title: 'Phone', dataIndex: 'phone', render: (v) => <span style={{ color: '#6B6B6B' }}>{v || '—'}</span> },
              { title: 'Role', dataIndex: 'role', render: (v) => <StatusPill status={v} mapping={ROLE_PILL} /> },
              { title: 'Status', dataIndex: 'status', render: (v) => <StatusPill status={v} mapping={STATUS_PILL} /> },
              { title: 'Verified', dataIndex: 'verified', render: (v) => <span style={{ color: v ? '#3F7D58' : '#9CA3AF' }}>{v ? 'Yes' : 'No'}</span> },
              {
                title: '', dataIndex: 'id', align: 'right', width: 60,
                render: (id, u) => (
                  <Popconfirm
                    title={`Delete ${u.fullName}?`}
                    description='This cannot be undone.'
                    okText='Delete'
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(id)}
                  >
                    <Button size='small' type='text' icon={<DeleteOutlined />} style={{ color: '#9CA3AF' }} />
                  </Popconfirm>
                )
              }
            ]}
          />
        )}
      </TableContainer>

      {data?.total_page > 1 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            current={data.current_page}
            total={data.total_page * 10}
            onChange={(p) => setQuery((q) => ({ ...q, page: p }))}
          />
        </div>
      )}
    </div>
  );
}

export default UsersList;
