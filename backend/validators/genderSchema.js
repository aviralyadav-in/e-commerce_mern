import { z } from "zod";

/**
 * Gender multi-select (Men / Women) — input kisi bhi shape me aa sakta hai:
 * JSON string '["Men","Women"]' (FormData), plain "Men", comma-separated
 * "Men,Women" ya direct array. Sab normalize karke array banata hai.
 *
 * @param {string[]} defaultValue - field absent / khali ho tab ki value
 */
export const genderArraySchema = (defaultValue) =>
  z
    .preprocess(
      (val) => {
        if (val === undefined) return val; // .optional()/.default() handle karenge
        if (val === null || val === "") return [...defaultValue]; // khali value - default
        if (Array.isArray(val)) return val;
        if (typeof val === "string") {
          const trimmed = val.trim();
          try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return parsed;
          } catch {
            // JSON nahi hai - plain / comma-separated string
          }
          return trimmed.split(",").map((v) => v.trim()).filter(Boolean);
        }
        return val;
      },
      z
        .array(
          z.enum(["Men", "Women"], {
            error: "Gender must be Men or Women",
          }),
        )
        .min(1, "Select at least one gender (Men or Women)"),
    )
    .optional()
    .default(() => [...defaultValue]);
