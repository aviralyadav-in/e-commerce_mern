import React from "react";
import { Routes, Route, Navigate } from "react-router";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Pages Import
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import CategoriesPage from "./pages/CategoriesPage";
import ProductsPage from "./pages/ProductsPage";
import OrdersPage from "./pages/OrdersPage";

function App() {
  return (
    <Routes>
      {/* Public Route - Koi bhi dekh sakta hai */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Admin Routes - Sirf logged in admin dekh sakta hai */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Agar seedha '/' par jaye, toh dashboard par bhej do */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Actual Pages */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="orders" element={<OrdersPage />} />
      </Route>

      {/* 404 Route - Agar koi galat URL daale, toh usko wapas dashboard bhejo */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
