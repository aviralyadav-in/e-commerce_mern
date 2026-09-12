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
  "products/restore": "Product restored",
  "products/bulkCreate": "Products imported",
  "categories/add": "Category created",
  "categories/update": "Category updated",
  "categories/delete": "Category deleted",
  "categories/restore": "Category restored",
  "categories/toggleStatus": "Category status updated",
  "categories/bulkCreate": "Categories imported",
  "collections/add": "Collection created",
  "collections/update": "Collection updated",
  "collections/delete": "Collection deleted",
  "collections/restore": "Collection restored",
  "collections/bulkCreate": "Collections imported",
  "collections/bulkAddProducts": "Products added to collection",
  "banners/add": "Banner created",
  "banners/update": "Banner updated",
  "banners/delete": "Banner deleted",
  "banners/toggleStatus": "Banner status updated",
  "coupons/add": "Coupon created",
  "coupons/update": "Coupon updated",
  "coupons/delete": "Coupon deleted",
  "coupons/bulkCreate": "Coupons imported",
  "users/addUser": "Customer created",
  "users/updateUser": "Customer updated",
  "users/deleteUser": "Customer deleted",
  "users/bulkCreate": "Customers imported",
  "orders/updateStatus": "Order status updated",
  "reviews/delete": "Review deleted",
  "reviews/updateStatus": "Review status updated",
  "products/quickUpdateStock": "Stock updated",
  "settings/updateSettings": "Store settings saved",
  "settings/resetSettings": "Store settings reset to defaults",
  "inquiries/updateStatus": "Inquiry updated",
  "inquiries/deleteInquiry": "Inquiry deleted",
};

const FAILURE_LABELS = {
  "products/add": "Could not create product",
  "products/update": "Could not update product",
  "products/delete": "Could not delete product",
  "products/restore": "Could not restore product",
  "products/bulkCreate": "Could not import products",
  "categories/add": "Could not create category",
  "categories/update": "Could not update category",
  "categories/delete": "Could not delete category",
  "categories/restore": "Could not restore category",
  "categories/toggleStatus": "Could not update category status",
  "categories/bulkCreate": "Could not import categories",
  "collections/add": "Could not create collection",
  "collections/update": "Could not update collection",
  "collections/delete": "Could not delete collection",
  "collections/restore": "Could not restore collection",
  "collections/bulkCreate": "Could not import collections",
  "collections/bulkAddProducts": "Could not add products to collection",
  "banners/add": "Could not create banner",
  "banners/update": "Could not update banner",
  "banners/delete": "Could not delete banner",
  "banners/toggleStatus": "Could not update banner status",
  "coupons/add": "Could not create coupon",
  "coupons/update": "Could not update coupon",
  "coupons/delete": "Could not delete coupon",
  "coupons/bulkCreate": "Could not import coupons",
  "users/addUser": "Could not create customer",
  "users/updateUser": "Could not update customer",
  "users/deleteUser": "Could not delete customer",
  "users/bulkCreate": "Could not import customers",
  "orders/updateStatus": "Could not update order",
  "reviews/delete": "Could not delete review",
  "reviews/updateStatus": "Could not update review status",
  "products/quickUpdateStock": "Could not update stock",
  "settings/updateSettings": "Could not save settings",
  "settings/resetSettings": "Could not reset settings",
  "inquiries/updateStatus": "Could not update inquiry",
  "inquiries/deleteInquiry": "Could not delete inquiry",
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
