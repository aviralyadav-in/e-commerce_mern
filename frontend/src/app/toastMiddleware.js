import toast from "react-hot-toast";
import { renderToastBody } from "../lib/toast";

/**
 * Turns every mutating thunk into a toast, centrally.
 *
 * Doing this in middleware (rather than in each page's submit handler) means
 * a create/update/delete anywhere in the panel gets consistent feedback,
 * including the calls fired straight from table rows.
 *
 * Read thunks are deliberately absent: a failed list fetch already renders an
 * inline error banner on the page, and toasting it as well is just noise.
 */
const SUCCESS_LABELS = {
  "products/add": "Product created",
  "products/update": "Product updated",
  "products/delete": "Product deleted",
  "categories/add": "Category created",
  "categories/update": "Category updated",
  "categories/delete": "Category deleted",
  "banners/add": "Banner created",
  "banners/update": "Banner updated",
  "banners/delete": "Banner deleted",
  "coupons/add": "Coupon created",
  "coupons/update": "Coupon updated",
  "coupons/delete": "Coupon deleted",
  "users/addUser": "Customer created",
  "users/updateUser": "Customer updated",
  "users/deleteUser": "Customer deleted",
  "orders/updateStatus": "Order status updated",
  "orders/delete": "Order deleted",
  "reviews/delete": "Review deleted",
};

const FAILURE_LABELS = {
  "products/add": "Could not create product",
  "products/update": "Could not update product",
  "products/delete": "Could not delete product",
  "categories/add": "Could not create category",
  "categories/update": "Could not update category",
  "categories/delete": "Could not delete category",
  "banners/add": "Could not create banner",
  "banners/update": "Could not update banner",
  "banners/delete": "Could not delete banner",
  "coupons/add": "Could not create coupon",
  "coupons/update": "Could not update coupon",
  "coupons/delete": "Could not delete coupon",
  "users/addUser": "Could not create customer",
  "users/updateUser": "Could not update customer",
  "users/deleteUser": "Could not delete customer",
  "orders/updateStatus": "Could not update order",
  "orders/delete": "Could not delete order",
  "reviews/delete": "Could not delete review",
};

const toastMiddleware = () => (next) => (action) => {
  const result = next(action);
  const type = action?.type;
  if (typeof type !== "string") return result;

  if (type.endsWith("/fulfilled")) {
    const key = type.slice(0, -"/fulfilled".length);
    const title = SUCCESS_LABELS[key];
    if (title) toast.success(title);
  } else if (type.endsWith("/rejected")) {
    const key = type.slice(0, -"/rejected".length);
    const title = FAILURE_LABELS[key];
    // `condition`-aborted thunks also land here; they carry no useful message.
    if (title && !action.meta?.aborted) {
      const message =
        typeof action.payload === "string"
          ? action.payload
          : action.error?.message || "";
      toast.error(message ? renderToastBody(title, message) : title, {
        duration: 5000,
      });
    }
  }

  return result;
};

export default toastMiddleware;
