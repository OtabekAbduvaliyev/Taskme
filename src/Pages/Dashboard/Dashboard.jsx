import React, { useState } from "react";
import Sidebar from "../../Components/Sidebar/Sidebar";
import Navbar from "../../Components/Navbar/Navbar";
import { Outlet } from "react-router-dom";
import { HiMenuAlt2 } from "react-icons/hi";

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative w-[280px] xl:w-[300px] 2xl:w-[323px] h-screen transition-transform duration-300 ease-in-out z-40`}
      >
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 h-screen overflow-hidden">
        {/* Navbar (Sticky Header) */}
        <div className="flex-shrink-0 z-10">
          <Navbar />
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1  w-full max-w-[1920px] mx-auto px-4 xl:px-6 pt-4">
          <Outlet />
        </div>
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};


export default Dashboard;
