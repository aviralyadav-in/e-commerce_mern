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
    "name,description,gender,isActive",
    '"Backpacks","Durable everyday & travel backpacks","Men,Women",true',
    '"Tote Bags","Spacious totes for work and college","Women",true',
    '"Wallets","Compact leather wallets","Men",true',
  ].join("\n");
  downloadCsv("categories-sample.csv", content);
};

/** POST /api/collections/admin/bulk ke liye template */
export const downloadCollectionsSampleCsv = () => {
  const content = [
    "name,description,showOnHomePage,showAsBadge,isActive",
    '"Festive Edit 2026","Handcrafted festive bags for celebrations","true","true","true"',
    '"Office Classics","Sophisticated bags for daily 9-to-5","false","true","true"',
    '"Weekend Escapes","Spacious weekenders and duffels","true","false","true"',
  ].join("\n");
  downloadCsv("collections-sample.csv", content);
};

/** POST /api/products/admin/bulk ke liye template */
export const downloadProductsSampleCsv = () => {
  const content = [
    "name,description,price,stock,images,brand,gender,discountPrice,sku,category_name,isActive",
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
    ].join(","),
  ].join("\n");
  downloadCsv("products-sample.csv", content);
};

/** POST /api/coupons/bulk ke liye template */
export const downloadCouponsSampleCsv = () => {
  const content = [
    "code,discountType,discountValue,minOrderValue,usageLimit,perUserLimit,expiryDate,isActive",
    '"WELCOME10","percentage","10","500","100","1","2026-12-31","true"',
    '"FLAT200","flat","200","1000","50","1","2026-12-31","true"',
    '"FESTIVE25","percentage","25","1500","","","2026-12-31","true"',
  ].join("\n");
  downloadCsv("coupons-sample.csv", content);
};

/** POST /api/users/admin/bulk ke liye template */
export const downloadUsersSampleCsv = () => {
  const content = [
    "name,email,phone,gender,dateOfBirth,password",
    '"Priya Sharma","priya.sharma@example.com","9876543210","female","1995-06-15","Priya#Welcome26"',
    '"Rahul Verma","rahul.verma@example.com","8765432109","male","1992-11-20","Rahul#Welcome26"',
    '"Ananya Patel","ananya.patel@example.com","","female","","Ananya#Welcome26"',
  ].join("\n");
  downloadCsv("customers-sample.csv", content);
};


