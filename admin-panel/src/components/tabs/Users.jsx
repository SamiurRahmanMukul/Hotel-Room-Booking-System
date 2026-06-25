/* eslint-disable react/jsx-one-expression-per-line, object-curly-newline */
import { Modal } from 'antd';
import React, { useState } from 'react';
import CreateUser from '../users/CreateUser';
import UserDetails from '../users/UserDetails';
import UsersList from '../users/UsersList';

function Users() {
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsId, setDetailsId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // List calls add() — with id → open details modal; without → open create modal.
  const onAdd = (id) => {
    if (id) {
      setDetailsId(id);
    } else {
      setCreateOpen(true);
    }
  };

  return (
    <>
      <UsersList key={refreshKey} add={onAdd} />

      <Modal
        title='Add user'
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        footer={null}
        destroyOnClose
        width={720}
      >
        <CreateUser
          onSaved={() => {
            setCreateOpen(false);
            setRefreshKey((k) => k + 1);
          }}
        />
      </Modal>

      <Modal
        title='User details'
        open={!!detailsId}
        onCancel={() => setDetailsId(null)}
        footer={null}
        destroyOnClose
        width={780}
      >
        {detailsId && <UserDetails id={detailsId} />}
      </Modal>
    </>
  );
}

export default React.memo(Users);
