import React from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';

const handleLogout = () => {
  localStorage.removeItem('token');
  window.location.reload();
};

const AdminSidebar = ({ children, isOpen = false, onClose = () => {} }) => {
  const overlay = (
    <div
      role="presentation"
      className={`fixed inset-0 bg-black/50 z-[10000] transition-opacity duration-200 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      onClick={onClose}
      onTouchMove={(e) => { if (isOpen) e.preventDefault(); }}
      onWheel={(e) => { if (isOpen) e.preventDefault(); }}
      aria-hidden={!isOpen}
    />
  );

  const aside = (
    <aside
      role="dialog"
      aria-modal={isOpen}
      aria-hidden={!isOpen}
      className={`
        bg-grayDash text-white2 p-6
        w-64 md:w-[240px]
        min-h-screen
        flex flex-col items-center
        fixed top-0 left-0 h-screen z-[11000] border-r border-gray4
        transform transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'}
        md:translate-x-0 md:pointer-events-auto
      `}
      tabIndex={isOpen ? 0 : -1}
    >
      {/* mobile close button */}
      <div className="w-full flex items-center justify-between md:justify-center mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-pink2 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">A</span>
          </div>
          <div className="hidden md:flex flex-col justify-center">
            <span className="font-radioCanada text-lg text-white font-semibold tracking-wide">Admin</span>
            <span className="text-white2 text-xs mt-1">Control Panel</span>
          </div>
        </div>

        <button
          className="md:hidden text-white2 p-2 rounded hover:bg-gray3"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <MdClose size={20} />
        </button>
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

  // if document isn't ready (SSR), render null; otherwise portal to body
  if (typeof document === 'undefined' || !document.body) return null;
  return createPortal(
    <>
      {overlay}
      {aside}
    </>,
    document.body
  );
};

export default AdminSidebar;



