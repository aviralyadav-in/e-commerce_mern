/**
 * Sample CSV templates — admin bulk-import modals ke "Download sample" se
 * client-side Blob download hote hain (koi backend call nahi).
 */

const downloadCsv = (filename, content) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/** GET /api/categories/admin/bulk ke liye template */
export const downloadCategoriesSampleCsv = () => {
  const content = [
    "name,description,subCategories,isActive",
    '"Backpacks","Durable everyday & travel backpacks","Men,Women",true',
    '"Tote Bags","Spacious totes for work and college","Women",true',
    '"Wallets","Compact leather wallets","Men",true',
  ].join("\n");
  downloadCsv("categories-sample.csv", content);
};

/** POST /api/products/admin/bulk ke liye template */
export const downloadProductsSampleCsv = () => {
  const content = [
    "name,description,price,stock,images,brand,subCategory,discountPrice,sku,category_name,isActive,isFeatured,isBestSeller,isNewArrival",
    [
      '"Classic Leather Tote"',
      '"Handcrafted genuine leather tote bag with spacious interior."',
      "2499",
      "25",
      '"https://example.com/tote-1.jpg"',
      "Niya",
      "Women",
      "1999",
      "",
      "Tote Bags",
      "true",
      "false",
      "true",
      "false",
    ].join(","),
    [
      '"Urban Laptop Backpack"',
      '"Water-resistant laptop backpack with padded compartment."',
      "1899",
      "40",
      '"https://example.com/backpack-1.jpg"',
      "Niya",
      "Men",
      "",
      "", // SKU khali = auto-generate
      "", // category_name khali = dropdown wali category
      "true",
      "true",
      "false",
      "true",
    ].join(","),
  ].join("\n");
  downloadCsv("products-sample.csv", content);
};
