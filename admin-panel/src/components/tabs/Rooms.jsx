/**
 * @name Hotel Room Booking System
 * @author Md. Samiur Rahman (Mukul)
 * @description Hotel Room Booking and Management System Software ~ Developed By Md. Samiur Rahman (Mukul)
 * @copyright ©2023 ― Md. Samiur Rahman (Mukul). All rights reserved.
 * @version v0.0.1
 *
 */

import { AppstoreAddOutlined } from '@ant-design/icons';
import { Button, Tabs } from 'antd';
import React, { useRef, useState } from 'react';
import CreateRoom from '../rooms/CreateRoom';
import RoomDetails from '../rooms/RoomDetails';
import RoomsList from '../rooms/RoomsList';

function Rooms() {
  // function to create new tab pane for room details
  const add = (id) => {
    const newActiveKey = `NewTab1${newTabIndex.current++}`;
    setItems([
      ...items,
      {
        key: newActiveKey,
        label: 'Room Details',
        children: <RoomDetails id={id} />
      }
    ]);
    setActiveKey(newActiveKey);
  };

  // function to create new tab pane create new room
  const add2 = () => {
    const newActiveKey = `NewTab2${newTabIndex.current++}`;
    setItems([
      ...items,
      {
        key: newActiveKey,
        label: 'Create Room',
        children: <CreateRoom />
      }
    ]);
    setActiveKey(newActiveKey);
  };

  // default tab pane and component
  const defaultPanes = new Array(1).fill(null).map((_, index) => ({
    key: String(index + 1),
    label: 'Rooms List',
    children: <RoomsList add={add} />,
    closable: false
  }));

  const [activeKey, setActiveKey] = useState(defaultPanes[0].key);
  const [items, setItems] = useState(defaultPanes);
  const newTabIndex = useRef(0);

  // function to removed a tab pane
  const remove = (targetKey) => {
    const targetIndex = items.findIndex((pane) => pane.key === targetKey);
    const newPanes = items.filter((pane) => pane.key !== targetKey);
    if (newPanes.length && targetKey === activeKey) {
      const { key } = newPanes[targetIndex === newPanes.length ? targetIndex - 1 : targetIndex];
      setActiveKey(key);
    }
    setItems(newPanes);
  };

  // function to edit tab components
  const onEdit = (targetKey, action) => {
    if (action === 'add') {
      add();
    } else {
      remove(targetKey);
    }
  };

  return (
    <Tabs
      onChange={(key) => setActiveKey(key)}
      tabBarExtraContent={(
        <Button
          className='inline-flex items-center'
          icon={<AppstoreAddOutlined />}
          onClick={add2}
          type='primary'
          size='large'
        >
          Create Room
        </Button>
      )}
      activeKey={activeKey}
      type='editable-card'
      onEdit={onEdit}
      items={items}
      size='large'
      hideAdd
    />
  );
}

export default Rooms;
