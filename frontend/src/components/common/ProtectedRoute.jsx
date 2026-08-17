import React from "react";
import { Navigate } from "react-router";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  // Redux store se authentication status check karenge
  const { isAuthenticated } = useSelector((state) => state.auth);

  // Agar admin authenticated nahi hai toh
  // login page par bhej do
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Agar authenticated hai toh
  // children (requested page) render karo
  return children;
};

export default ProtectedRoute;
