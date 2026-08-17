import React, { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = () => {
  // Mobile sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar Component */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area (Right Side) */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Navbar Component */}
        <Navbar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        {/* Dynamic Page Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 sm:p-6">
          {/* Outlet wahan page render karega jahan aap react-router me navigate karenge */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
