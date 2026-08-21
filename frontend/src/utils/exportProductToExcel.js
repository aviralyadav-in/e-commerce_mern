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
  Status: product.isActive ? "In Stock" : "Out of Stock",
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
