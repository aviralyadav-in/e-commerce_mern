import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import usersReducer from "../features/users/usersSlice";
import categoriesReducer from "../features/categories/categoriesSlice";
import productsReducer from "../features/products/productsSlice";
import ordersReducer from "../features/orders/ordersSlice";
import bannersReducer from "../features/banners/bannersSlice";
import couponsReducer from "../features/coupons/couponsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    categories: categoriesReducer,
    products: productsReducer,
    orders: ordersReducer,
    banners: bannersReducer,
    coupons: couponsReducer,
  },
});

export default store;
