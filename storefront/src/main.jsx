import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router";
import store from "./app/store.js";
import { initTheme } from "./features/ui/uiSlice.js";
import { checkAuth } from "./features/auth/authSlice.js";
import { fetchCart } from "./features/cart/cartSlice.js";
import { fetchWishlist } from "./features/wishlist/wishlistSlice.js";
import { fetchCategories } from "./features/categories/categoriesSlice.js";

store.dispatch(initTheme());

// Pehle session verify — phir logged-in data (cart/wishlist) load karo
store
  .dispatch(checkAuth())
  .unwrap()
  .then(() => {
    store.dispatch(fetchCart());
    store.dispatch(fetchWishlist());
  })
  .catch(() => {
    // Guest user — koi problem nahi
  });

store.dispatch(fetchCategories());

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
);
