import React from 'react';

const AdminHeader = ({ children }) => (
  <header className="bg-gray4 fixed top-0 right-0 left-[240px] w-[calc(100%-240px)] z-40">
    {children}
  </header>
);

export default AdminHeader;
