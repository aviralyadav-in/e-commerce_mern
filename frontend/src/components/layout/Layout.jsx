import React, { useState } from "react";
import { Outlet, useLocation } from "react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import CommandPalette from "./CommandPalette";
import Toaster from "../common/Toaster";

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-(--surface)">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        <Navbar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

        <main
          key={location.pathname}
          className="flex-1 overflow-x-hidden overflow-y-auto admin-scroll p-4 sm:p-5 lg:p-6"
        >
          <div className="page-shell max-w-330 mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette />
      <Toaster />
    </div>
  );
};

export default Layout;
