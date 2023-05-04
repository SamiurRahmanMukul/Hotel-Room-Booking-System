import { Button } from 'antd';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { FaAlignRight } from 'react-icons/fa';
import { getSessionToken, getSessionUser } from '../../utils/authentication';
import UserPopover from './popover';

function Navbar() {
  const [isOpen, setIsOpen] = useState();
  const user = getSessionUser();
  const token = getSessionToken();
  const router = useRouter();

  return (
    <nav className='navbar'>
      <div className='nav-center'>
        <div className='nav-header'>
          {/* app logo */}
          <Link href='/'>
            <img src='/images//svg/logo.svg' alt='Reach Resort' />
          </Link>

          {/* navbar toggle button */}
          <button
            className='nav-btn'
            onClick={() => setIsOpen(!isOpen)}
            type='button'
          >
            <FaAlignRight className='nav-icon' />
          </button>

        </div>

        {/* navbar login button */}
        {user?.id && token ? (<UserPopover />) : (
          <Button
            style={{ position: 'absolute', right: '100px', top: '20px' }}
            onClick={() => router.push('/auth/login')}
            type='primary'
            size='large'
          >
            Log In
          </Button>
        )}

        {/* navbar link */}
        <ul className={isOpen ? 'nav-links show-nav' : 'nav-links'}>
          <li>
            <Link href='/'>Home</Link>
          </li>
          <li>
            <Link href='/rooms'>Rooms</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
