import React from 'react';

const AdminHeader = ({ children, isSidebarOpen = false }) => (
  // keep header z very low so overlay (body-portal) always covers it;
  // disable pointer events while mobile sidebar is open to avoid interaction with header under the overlay
  <header
    className={`bg-grayDash fixed top-0 right-0 left-0 md:left-[240px] w-full md:w-[calc(100%-240px)] h-16 border-b border-b-gray4 ${
      isSidebarOpen ? 'pointer-events-none z-10' : 'z-20'
    }`}
  >
    {children}
  </header>
);

export default AdminHeader;

