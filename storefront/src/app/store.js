import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import productsReducer from "../features/products/productsSlice";
import categoriesReducer from "../features/categories/categoriesSlice";
import cartReducer from "../features/cart/cartSlice";
import wishlistReducer from "../features/wishlist/wishlistSlice";
import ordersReducer from "../features/orders/ordersSlice";
import addressesReducer from "../features/addresses/addressesSlice";
import reviewsReducer from "../features/reviews/reviewsSlice";
import bannersReducer from "../features/banners/bannersSlice";
import uiReducer from "../features/ui/uiSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    categories: categoriesReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    orders: ordersReducer,
    addresses: addressesReducer,
    reviews: reviewsReducer,
    banners: bannersReducer,
    ui: uiReducer,
  },
});

export default store;
