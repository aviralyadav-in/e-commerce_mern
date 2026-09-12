import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import usersReducer from "../features/users/usersSlice";
import categoriesReducer from "../features/categories/categoriesSlice";
import collectionsReducer from "../features/collections/collectionsSlice";
import productsReducer from "../features/products/productsSlice";
import ordersReducer from "../features/orders/ordersSlice";
import bannersReducer from "../features/banners/bannersSlice";
import couponsReducer from "../features/coupons/couponsSlice";
import wishlistReducer from "../features/wishlist/wishlistSlice";
import adminCartReducer from "../features/adminCart/adminCartSlice";
import reviewsReducer from "../features/reviews/reviewsSlice";
import settingsReducer from "../features/settings/settingsSlice";
import inquiriesReducer from "../features/inquiries/inquiriesSlice";
import uiReducer from "../features/ui/uiSlice";
import toastMiddleware from "./toastMiddleware";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    categories: categoriesReducer,
    collections: collectionsReducer,
    products: productsReducer,
    orders: ordersReducer,
    banners: bannersReducer,
    coupons: couponsReducer,
    wishlist: wishlistReducer,
    adminCart: adminCartReducer,
    reviews: reviewsReducer,
    settings: settingsReducer,
    inquiries: inquiriesReducer,
    ui: uiReducer,
  },
  middleware: (getDefault) => getDefault().concat(toastMiddleware),
});

export default store;
