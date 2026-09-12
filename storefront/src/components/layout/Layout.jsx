import React from "react";
import { Outlet } from "react-router-dom";
import { useTheme } from "next-themes";
import Header from "./Header";
import Footer from "./Footer";
import CartDrawer from "../cart/CartDrawer";
import BackToTop from "../common/BackToTop";
import { Toaster } from "../ui/sonner";

const TOAST_CLASSNAMES = {
  toast: "cn-toast rounded-2xl border border-line bg-popover font-sans text-small text-foreground shadow-lift",
  title: "font-semibold text-foreground",
  description: "text-ink-muted",
  closeButton: "border-line bg-popover text-foreground hover:bg-surface-2",
  actionButton: "rounded-lg bg-primary text-primary-foreground",
  cancelButton: "rounded-lg bg-surface-2 text-foreground",
};

const TOAST_STYLE = {
  "--normal-bg": "var(--popover)",
  "--normal-text": "var(--popover-foreground)",
  "--normal-border": "var(--border)",
  "--border-radius": "1rem",
};

export default function Layout() {
  const { theme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-champagne/30 selection:text-foreground">
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      <Header />

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <CartDrawer />
      <Footer />
      <BackToTop />
      <Toaster
        theme={theme === "dark" ? "dark" : "light"}
        position="top-center"
        richColors
        closeButton
        offset={{ top: 120 }}
        mobileOffset={{ top: 112 }}
        style={TOAST_STYLE}
        toastOptions={{ classNames: TOAST_CLASSNAMES }}
      />
    </div>
  );
}
