import React from 'react';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.reload();
};

const AdminSidebar = ({ children }) => (
  <aside className="bg-grayDash text-white2 p-6 w-[240px] min-h-screen  flex flex-col items-center fixed top-0 left-0 h-screen z-50 border-r border-gray4 ">
    {/* Logo and Title - rowed layout */}
    <div className="flex flex-row items-center justify-center gap-4 mb-8 w-full">
      <div className="w-14 h-14 rounded-full bg-pink2 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-2xl">A</span>
      </div>
      <div className="flex flex-col justify-center">
        <span className="font-radioCanada text-lg text-white font-semibold tracking-wide">Admin</span>
        <span className="text-white2 text-xs mt-1">Control Panel</span>
      </div>
    </div>
    {/* Navigation (children) */}
    <nav className="w-full">{children}</nav>
    {/* Divider */}
    <div className="w-full border-t border-gray4 my-6"></div>
    {/* Logout button */}
    <div className="w-full flex flex-col gap-3 mt-auto">
      <button
        className="bg-gray4 text-white2 rounded-lg py-2 px-4 font-radioCanada hover:bg-black transition-colors"
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
    {/* Footer */}
    <div className="text-xs text-white2 opacity-60 font-radioCanada mt-[10px]">
      &copy; {new Date().getFullYear()} Admin Dashboard
    </div>
  </aside>
);

export default AdminSidebar;

