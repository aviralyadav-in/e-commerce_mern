import * as XLSX from "xlsx";
import { getAssetUrl } from "./assetUrl";

export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatImageUrls = (paths = []) =>
  paths.map((path) => getAssetUrl(path)).filter(Boolean).join(", ");

const getCategoryName = (product, fallback = "Unknown Category") => {
  if (typeof product.categoryId === "object" && product.categoryId?.name) {
    return product.categoryId.name;
  }
  return fallback;
};

const productToRow = (product, categoryName) => ({
  "Product ID": product._id || "",
  Name: product.name || "",
  Slug: product.slug || "",
  Description: product.description || "",
  Category: categoryName || getCategoryName(product),
  "Sub Category": product.subCategory || "",
  Brand: product.brand || "",
  SKU: product.sku || "",
  Price: product.price ?? "",
  "Discount Price": product.discountPrice ?? "",
  Stock: product.stock ?? 0,
  Status: product.isActive ? "Live" : "Hidden",
  "Average Rating": product.averageRating ?? 0,
  "Number of Reviews": product.numOfReviews ?? 0,
  "Desktop Images": formatImageUrls(product.images?.desktop),
  "Mobile Images": formatImageUrls(product.images?.mobile),
  "Created At": formatDate(product.createdAt),
  "Updated At": formatDate(product.updatedAt),
});

export const exportProductToExcel = (product, categoryName = "Unknown Category") => {
  const worksheet = XLSX.utils.json_to_sheet([productToRow(product, categoryName)]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Product Details");

  const safeName = (product.name || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  XLSX.writeFile(workbook, `${safeName || "product"}-details.xlsx`);
};

export const exportAllProductsToExcel = (products = [], getCategoryNameFn) => {
  if (!products.length) return false;

  const rows = products.map((product) => {
    const catName =
      typeof getCategoryNameFn === "function"
        ? getCategoryNameFn(product.categoryId)
        : getCategoryName(product);
    return productToRow(product, catName);
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All Products");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `all-products-${stamp}.xlsx`);
  return true;
};

export const exportAllCategoriesToExcel = (categories = []) => {
  if (!categories.length) return false;

  const rows = categories.map((cat) => ({
    "Category ID": cat._id || "",
    Name: cat.name || "",
    Slug: cat.slug || "",
    Description: cat.description || "",
    "Sub Categories": Array.isArray(cat.subCategories)
      ? cat.subCategories.join(", ")
      : "",
    Status: cat.isActive ? "Active" : "Inactive",
    Image: cat.image ? getAssetUrl(cat.image) : "",
    "Created At": formatDate(cat.createdAt),
    "Updated At": formatDate(cat.updatedAt),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "All Categories");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `all-categories-${stamp}.xlsx`);
  return true;
};

const writeRowsToExcel = (rows, sheetName, filePrefix) => {
  if (!rows.length) return false;
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `${filePrefix}-${stamp}.xlsx`);
  return true;
};

const resolveCustomerName = (user, getCustomerNameFn) => {
  if (typeof getCustomerNameFn === "function") {
    return getCustomerNameFn(user);
  }
  if (typeof user === "object" && user?.name) return user.name;
  return "Unknown Customer";
};

export const exportAllUsersToExcel = (users = []) => {
  const rows = users.map((user) => ({
    "User ID": user._id || "",
    Name: user.name || "",
    Email: user.email || "",
    Phone: user.phone || "",
    Gender:
      user.gender === "female"
        ? "Female"
        : user.gender === "male"
          ? "Male"
          : "",
    "Date of Birth": user.dateOfBirth
      ? new Date(user.dateOfBirth).toLocaleDateString("en-IN")
      : "",
    "Joined At": formatDate(user.createdAt),
    "Updated At": formatDate(user.updatedAt),
  }));
  return writeRowsToExcel(rows, "All Users", "all-users");
};

export const exportAllOrdersToExcel = (orders = [], getCustomerNameFn) => {
  const rows = orders.map((order) => {
    const customerId =
      typeof order.user === "object" ? order.user?._id : order.user;
    const itemsSummary = Array.isArray(order.orderItems)
      ? order.orderItems
          .map((item) => {
            const productName =
              typeof item.product === "object"
                ? item.product?.name || item.product?._id
                : item.product;
            return `${productName || "Product"} x${item.quantity || 0}`;
          })
          .join("; ")
      : "";

    return {
      "Order ID": order._id || "",
      "Customer Name": resolveCustomerName(order.user, getCustomerNameFn),
      "Customer ID": customerId || "",
      "Items Count": order.orderItems?.length || 0,
      Items: itemsSummary,
      "Items Price": order.itemsPrice ?? "",
      "Shipping Price": order.shippingPrice ?? "",
      "Coupon Code": order.couponCode || "",
      "Discount Amount": order.discountAmount ?? 0,
      "Total Amount": order.totalAmount ?? 0,
      "Payment Method": order.paymentMethod || "",
      "Payment Status": order.paymentStatus || "",
      "Transaction ID": order.transactionId || "",
      "Order Status": order.orderStatus || "",
      "Delivered At": formatDate(order.deliveredAt),
      "Created At": formatDate(order.createdAt || order.orderDate),
      "Updated At": formatDate(order.updatedAt),
    };
  });
  return writeRowsToExcel(rows, "All Orders", "all-orders");
};

export const exportAllCouponsToExcel = (coupons = []) => {
  const rows = coupons.map((coupon) => ({
    "Coupon ID": coupon._id || "",
    Code: coupon.code || "",
    "Discount Type": coupon.discountType || "",
    "Discount Value": coupon.discountValue ?? "",
    "Min Order Value": coupon.minOrderValue ?? 0,
    "Expiry Date": coupon.expiryDate
      ? new Date(coupon.expiryDate).toLocaleDateString("en-IN")
      : "",
    Status: coupon.isActive ? "Active" : "Inactive",
    Expired:
      coupon.expiryDate && new Date(coupon.expiryDate) < new Date()
        ? "Yes"
        : "No",
    "Created At": formatDate(coupon.createdAt),
    "Updated At": formatDate(coupon.updatedAt),
  }));
  return writeRowsToExcel(rows, "All Coupons", "all-coupons");
};

export const exportAllBannersToExcel = (banners = []) => {
  const rows = banners.map((banner) => ({
    "Banner ID": banner._id || "",
    Title: banner.title || "",
    Subtitle: banner.subtitle || "",
    "Link URL": banner.linkUrl || "",
    "Sort Order": banner.sortOrder ?? 0,
    Status: banner.isActive ? "Active" : "Inactive",
    Image: banner.image ? getAssetUrl(banner.image) : "",
    "Created At": formatDate(banner.createdAt),
    "Updated At": formatDate(banner.updatedAt),
  }));
  return writeRowsToExcel(rows, "All Banners", "all-banners");
};

export const exportAllWishlistsToExcel = (wishlists = []) => {
  const rows = wishlists.map((item, index) => ({
    "#": index + 1,
    "Entry ID": item._id || "",
    "Customer Name": item.userName || "",
    "Customer Email": item.userEmail || "",
    "Product Name": item.productName || "",
    "Product Price": item.productPrice ?? "",
    "Discount Price": item.productDiscountPrice ?? "",
    "Product Image": item.productImage ? getAssetUrl(item.productImage) : "",
    "Added At": formatDate(item.addedAt),
  }));
  return writeRowsToExcel(rows, "All Wishlists", "all-wishlists");
};

export const exportAllCartsToExcel = (carts = []) => {
  const rows = carts.map((item, index) => ({
    "#": index + 1,
    "Entry ID": item._id || "",
    "Customer Name": item.userName || "",
    "Customer Email": item.userEmail || "",
    "Product Name": item.productName || "",
    "Product Price": item.productPrice ?? "",
    Quantity: item.quantity ?? 0,
    "Item Total": item.itemTotal ?? "",
    "Product Image": item.productImage ? getAssetUrl(item.productImage) : "",
    "Updated At": formatDate(item.addedAt),
  }));
  return writeRowsToExcel(rows, "All Carts", "all-carts");
};

export const exportAllReviewsToExcel = (reviews = []) => {
  const rows = reviews.map((review) => ({
    "Review ID": review._id || "",
    "Customer Name": review.user?.name || "",
    "Customer Email": review.user?.email || "",
    "Product Name": review.product?.name || "",
    Rating: review.rating ?? "",
    Comment: review.comment || "",
    "Created At": formatDate(review.createdAt),
    "Updated At": formatDate(review.updatedAt),
  }));
  return writeRowsToExcel(rows, "All Reviews", "all-reviews");
};
