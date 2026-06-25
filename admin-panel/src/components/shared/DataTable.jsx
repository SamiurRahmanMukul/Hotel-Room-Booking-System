/**
 * Shared data-table primitives used by RoomsList, UsersList, and Orders.
 * Provides consistent styling for counter chips, status pills, filter bars,
 * and the custom <table> wrapper without forcing Ant Design Table.
 */

/* eslint-disable object-property-newline, object-curly-newline, global-require */

import React from 'react';
import { Input, Select } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

/* ── CounterChip ─────────────────────────────────────────────────── */
export function CounterChip({ label, value, color }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(44,44,44,0.08)',
      borderRadius: 10,
      padding: '14px 18px',
      flex: 1,
      minWidth: 140,
      display: 'flex',
      flexDirection: 'column',
      gap: 2
    }}
    >
      <div style={{
        color: '#6B6B6B',
        fontSize: 11,
        fontWeight: 500,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}
      >
        {label}
      </div>
      <div style={{
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: '-0.02em',
        color: color || '#2C2C2C'
      }}
      >
        {value}
      </div>
    </div>
  );
}

/* ── StatusPill ───────────────────────────────────────────────────── */
export function StatusPill({ status, mapping }) {
  const meta = (mapping || {})[status] || { color: '#2C2C2C', bg: '#F3F4F4' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '2px 10px',
      borderRadius: 999,
      background: meta.bg,
      color: meta.color,
      fontWeight: 600,
      fontSize: 11,
      letterSpacing: '0.02em',
      textTransform: 'uppercase'
    }}
    >
      {status}
    </span>
  );
}

/* ── FilterBar ────────────────────────────────────────────────────── */
export function FilterBar({ children, style }) {
  return (
    <div style={{
      marginTop: 20,
      padding: '12px 14px',
      background: '#fff',
      border: '1px solid rgba(44,44,44,0.08)',
      borderRadius: 10,
      display: 'flex',
      gap: 10,
      flexWrap: 'wrap',
      alignItems: 'center',
      ...style
    }}
    >
      {children}
    </div>
  );
}

/* ── SearchInput (pre-wired with SearchOutlined) ──────────────────── */
export function SearchInput({ value, onChange, placeholder, style }) {
  return (
    <Input
      allowClear
      prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
      placeholder={placeholder || 'Search…'}
      value={value}
      onChange={onChange}
      style={{ flex: 1, minWidth: 240, ...style }}
    />
  );
}

/* ── SortSelect ───────────────────────────────────────────────────── */
export function SortSelect({ value, onChange, style }) {
  return (
    <Select
      value={value}
      onChange={onChange}
      style={{ width: 170, ...style }}
      options={[
        { value: 'desc', label: 'Newest first' },
        { value: 'asce', label: 'Oldest first' }
      ]}
    />
  );
}

/* ── RowsPerPageSelect ────────────────────────────────────────────── */
export function RowsPerPageSelect({ value, onChange, options, style }) {
  const opts = options || [10, 20, 50, 100];
  return (
    <Select
      value={value}
      onChange={onChange}
      style={{ width: 110, ...style }}
      options={opts.map((n) => ({ value: n, label: `${n} rows` }))}
    />
  );
}

/* ── DataTable (the custom <table> wrapper) ───────────────────────── */
export function DataTable({ columns, dataSource, rowKey, onRow, emptyText, style }) {
  if (!dataSource || dataSource.length === 0) {
    const { Empty } = require('antd');
    return <Empty style={{ padding: 40 }} description={emptyText || 'No data'} />;
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, ...style }}>
      <thead>
        <tr style={{
          background: '#fafafa',
          color: '#6B6B6B',
          textTransform: 'uppercase',
          fontSize: 10,
          letterSpacing: '0.06em',
          fontWeight: 600
        }}
        >
          {columns.map((col) => (
            <th
              key={col.key || col.dataIndex}
              style={{
                padding: '10px 16px',
                textAlign: col.align || 'left',
                borderBottom: '1px solid rgba(44,44,44,0.06)',
                width: col.width,
                ...col.headerStyle
              }}
            >
              {col.title}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {dataSource.map((row, idx) => (
          <tr
            key={rowKey ? row[rowKey] : idx}
            style={{ borderBottom: '1px solid rgba(44,44,44,0.04)', transition: 'background 0.1s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(133,57,83,0.03)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            {...(onRow ? onRow(row) : {})}
          >
            {columns.map((col) => (
              <td
                key={col.key || col.dataIndex}
                style={{
                  padding: '10px 16px',
                  textAlign: col.align || 'left',
                  ...col.cellStyle
                }}
              >
                {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── TableContainer (the white card wrapper) ──────────────────────── */
export function TableContainer({ children, style }) {
  return (
    <div style={{
      marginTop: 16,
      background: '#fff',
      border: '1px solid rgba(44,44,44,0.08)',
      borderRadius: 10,
      overflow: 'hidden',
      ...style
    }}
    >
      {children}
    </div>
  );
}
