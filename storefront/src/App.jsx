import { Routes, Route, Navigate, useLocation } from "react-router";
import { useEffect } from "react";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import SearchOverlay from "./components/layout/SearchOverlay";
import CartDrawer from "./components/cart/CartDrawer";
import Toasts from "./components/common/Toasts";
import ScrollToAnchor from "./components/common/ScrollToAnchor";

import HomePage from "./pages/HomePage";
import ShopPage from "./pages/ShopPage";
import SalePage from "./pages/SalePage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import WishlistPage from "./pages/WishlistPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProfilePage from "./pages/ProfilePage";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import OurStoryPage from "./pages/OurStoryPage";
import CraftsmanshipPage from "./pages/CraftsmanshipPage";
import ContactPage from "./pages/ContactPage";
import ShippingReturnsPage from "./pages/ShippingReturnsPage";
import SizeGuidePage from "./pages/SizeGuidePage";
import FaqPage from "./pages/FaqPage";
import LegalPage from "./pages/LegalPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/common/ProtectedRoute";


function App() {
  const location = useLocation();

  // Route change par scroll top
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div key={location.pathname} className="page-enter">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/sale" element={<SalePage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Info / editorial pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/our-story" element={<OurStoryPage />} />
            <Route path="/craftsmanship" element={<CraftsmanshipPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/shipping-returns" element={<ShippingReturnsPage />} />
            <Route path="/size-guide" element={<SizeGuidePage />} />
            <Route path="/care-guide" element={<SizeGuidePage />} />
            <Route path="/faq" element={<FaqPage />} />
            <Route
              path="/privacy-policy"
              element={<LegalPage slug="privacy-policy" />}
            />
            <Route
              path="/terms-of-use"
              element={<LegalPage slug="terms-of-use" />}
            />

            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/checkout"
              element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/account"
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              }
            />

            <Route path="/404" element={<NotFoundPage />} />

            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </div>
      </main>
      <Footer />
      <SearchOverlay />
      <CartDrawer />
      <Toasts />
      <ScrollToAnchor />
    </div>
  );
}

export default App;
