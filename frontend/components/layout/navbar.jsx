import Link from 'next/link';
import React, { useState } from 'react';
import { FaAlignRight } from 'react-icons/fa';

function Navbar() {
  const [isOpen, setIsOpen] = useState();

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
