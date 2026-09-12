import React, { useEffect, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import Layout from "./components/layout/Layout";
import PageLoader from "./components/common/PageLoader";
import ScrollToTop from "./components/common/ScrollToTop";

// Route-level code splitting: each page becomes its own chunk.
const HomePage = lazy(() => import("./pages/HomePage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage"));
const AccountLayout = lazy(() => import("./pages/account/AccountLayout"));
const ProfilePage = lazy(() => import("./pages/account/ProfilePage"));
const OrdersPage = lazy(() => import("./pages/account/OrdersPage"));
const AddressesPage = lazy(() => import("./pages/account/AddressesPage"));
const WishlistPage = lazy(() => import("./pages/account/WishlistPage"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const SignupPage = lazy(() => import("./pages/auth/SignupPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

import { useAuthStore } from "./stores/authStore";
import { useCartStore } from "./stores/cartStore";
import { useWishlistStore } from "./stores/wishlistStore";
import { useSettingsStore } from "./stores/settingsStore";

/** Single Suspense boundary for every lazy page, rendered inside Layout's <main>. */
function SuspenseOutlet() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Outlet />
    </Suspense>
  );
}

export default function App() {
  const { checkAuth } = useAuthStore();
  const { getCart } = useCartStore();
  const { getWishlist } = useWishlistStore();
  const { fetchSettings } = useSettingsStore();

  useEffect(() => {
    // Restore session and customer state on application load
    const initApp = async () => {
      // Store settings do not depend on the session — load them in parallel so
      // the announcement bar / shipping copy never flashes the fallback values.
      const settingsPromise = fetchSettings();
      await checkAuth();
      await Promise.all([getCart(), getWishlist(), settingsPromise]);
    };
    initApp();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route element={<SuspenseOutlet />}>
            {/* Public Pages */}
            <Route index element={<HomePage />} />
            <Route path="shop" element={<ShopPage />} />
            <Route path="products" element={<ShopPage />} />
            <Route path="catalog" element={<ShopPage />} />
            <Route path="collections" element={<ShopPage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="product/:id" element={<ProductDetailPage />} />

            {/* Checkout Flow */}
            <Route path="checkout" element={<CheckoutPage />} />

            {/* Customer Account Area */}
            <Route path="account" element={<AccountLayout />}>
              <Route index element={<ProfilePage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
            </Route>

            {/* Auth Pages */}
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
