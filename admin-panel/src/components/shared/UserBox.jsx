/* eslint-disable object-property-newline, object-curly-newline, react/jsx-one-expression-per-line, react/jsx-max-props-per-line */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionUser } from '../../utils/authentication';

function UserBox() {
  const user = getSessionUser();
  const navigate = useNavigate();
  const initial = (user?.fullName || user?.email || '?').trim().charAt(0).toUpperCase();
  const avatar = user?.avatar && !user.avatar.endsWith('undefined') ? user.avatar : null;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      onClick={() => navigate('/main/profile')}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 14px',
        margin: 8,
        cursor: 'pointer',
        borderRadius: 8,
        background: 'rgba(255,255,255,0.04)',
        transition: 'background 0.15s'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
    >
      {avatar ? (
        <img
          src={avatar} alt={user?.fullName} crossOrigin='anonymous'
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      ) : (
        <div
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#853953', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 600, fontSize: 13, flexShrink: 0
          }}
        >
          {initial}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{
          color: 'rgba(255,255,255,0.95)', fontSize: 13, fontWeight: 500,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}
        >
          {user?.fullName || 'User'}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.45)', fontSize: 11,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}
        >
          {user?.email}
        </div>
      </div>
    </div>
  );
}

export default UserBox;
