// Regex special chars escape — user input (search/name/color) ko $regex / RegExp
// me safe banata hai, warna '(' '*' '+' jaise chars invalid regex → 500 de dete hain.
export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
