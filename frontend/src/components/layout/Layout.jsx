import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import { Toaster } from "react-hot-toast";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import CommandPalette from "./CommandPalette";

// react-hot-toast styling using CSS variables for light & dark adaptation
const TOAST_BASE_STYLE = {
  background: "var(--surface-card)",
  color: "var(--ink)",
  border: "1px solid var(--border)",
  borderRadius: "12px",
  padding: "12px 16px",
  fontSize: "13px",
  fontWeight: "500",
  boxShadow: "var(--shadow-pop)",
  maxWidth: "min(380px, calc(100vw - 32px))",
};

const TOAST_OPTIONS = {
  duration: 3500,
  style: { ...TOAST_BASE_STYLE, borderLeft: "4px solid #4f46e5" },
  success: {
    style: { ...TOAST_BASE_STYLE, borderLeft: "4px solid #10b981" },
    iconTheme: { primary: "#10b981", secondary: "#ffffff" },
  },
  error: {
    style: { ...TOAST_BASE_STYLE, borderLeft: "4px solid #ef4444" },
    iconTheme: { primary: "#ef4444", secondary: "#ffffff" },
  },
};

const Layout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-(--surface) text-(--ink) relative transition-colors duration-200">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <div className="flex-1 flex flex-col overflow-hidden w-full min-w-0">
        <Navbar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
        />

        <main
          key={location.pathname}
          className="flex-1 overflow-x-hidden overflow-y-auto admin-scroll p-4 sm:p-6 lg:p-7"
        >
          <div className="page-shell max-w-340 mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette />
      {/* react-hot-toast official renderer */}
      <Toaster position="bottom-right" gutter={10} toastOptions={TOAST_OPTIONS} />
    </div>
  );
};

export default Layout;
