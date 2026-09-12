import { Category } from "../models/category.model.js";
import { Collection } from "../models/collection.model.js";
import { Product } from "../models/product.model.js";
import { Settings } from "../models/settings.model.js";
import { rebuildCategoryHierarchy } from "../utils/categoryHierarchy.js";

/* =========================================================
   DATA MIGRATIONS (server start par chalte hain, idempotent)
   Schema changes ke baad purana data naye shape me laate hain.
   Dobara chalane par kuch nahi badalta. Native collection ops
   use hote hain kyunki purane fields ab schema me nahi hain.
========================================================= */

const GENDERS = ["Men", "Women"];

// Purana field (array ya single string) → `gender` array; invalid values
// filter, khali reh jaye toh model default; phir purana field hata do.
const migrateGenderField = async (Model, legacyField, fallback) => {
  const legacy = `$${legacyField}`;

  const renamed = await Model.collection.updateMany(
    {
      gender: { $exists: false },
      $or: [
        { [`${legacyField}.0`]: { $exists: true } },
        { [legacyField]: { $type: "string", $ne: "" } },
      ],
    },
    [
      {
        $set: {
          gender: {
            $filter: {
              input: { $cond: [{ $isArray: legacy }, legacy, [legacy]] },
              cond: { $in: ["$$this", GENDERS] },
            },
          },
        },
      },
    ],
  );

  const defaulted = await Model.collection.updateMany(
    { $or: [{ gender: { $exists: false } }, { gender: { $size: 0 } }] },
    { $set: { gender: fallback } },
  );

  const cleaned = await Model.collection.updateMany(
    { [legacyField]: { $exists: true } },
    { $unset: { [legacyField]: "" } },
  );

  return renamed.modifiedCount + defaulted.modifiedCount + cleaned.modifiedCount;
};

// Hataye gaye automated-collection matcher ki rule logic — sirf migration ke liye
const RULE_OPERATORS = { gt: "$gt", gte: "$gte", lt: "$lt", lte: "$lte", eq: "$eq" };

const legacyRulesQuery = (rules = []) => {
  const and = [];
  for (const rule of rules || []) {
    if (!rule?.field || !rule?.operator) continue;

    if (rule.field === "price" || rule.field === "stock") {
      const value = Number(rule.value);
      const op = RULE_OPERATORS[rule.operator];
      if (!Number.isNaN(value) && op) and.push({ [rule.field]: { [op]: value } });
    } else if (rule.field === "createdAt" && rule.operator === "withinDays") {
      const days = Number(rule.value);
      if (days > 0) {
        and.push({
          createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
        });
      }
    } else if (
      rule.field === "subCategory" &&
      rule.operator === "eq" &&
      GENDERS.includes(rule.value)
    ) {
      and.push({ gender: rule.value });
    }
  }
  return and;
};

// Automated collections ki membership rules se compute hoti thi (products par
// save nahi hoti thi). Rules ek baar chala kar matching products ko
// `collections` me link karo, phir collection ko manual bana do.
const migrateAutomatedCollections = async () => {
  const automated = await Collection.collection.find({ type: "automated" }).toArray();

  let linked = 0;
  for (const col of automated) {
    const conditions = legacyRulesQuery(col.rules);
    if (!conditions.length) continue;
    const result = await Product.collection.updateMany(
      { $and: conditions },
      { $addToSet: { collections: col._id } },
    );
    linked += result.modifiedCount;
  }

  await Collection.collection.updateMany(
    { $or: [{ type: { $exists: true } }, { rules: { $exists: true } }] },
    { $unset: { type: "", rules: "" } },
  );

  return { automated: automated.length, linked };
};

export const runDataMigrations = async () => {
  // Order zaroori: products ka gender pehle, kyunki purane rules gender par match hote hain
  const productGender = await migrateGenderField(Product, "subCategory", ["Men"]);
  const categoryGender = await migrateGenderField(Category, "subCategories", ["Men", "Women"]);
  const collections = await migrateAutomatedCollections();
  const hierarchy = await rebuildCategoryHierarchy();

  // Settings singleton — unique index ban jaye, phir ek hi document ensure
  await Settings.init();
  await Settings.getSingleton();

  const applied = [];
  if (productGender) applied.push(`products subCategory → gender (${productGender} updates)`);
  if (categoryGender) applied.push(`categories subCategories → gender (${categoryGender} updates)`);
  if (collections.automated) {
    applied.push(
      `${collections.automated} automated collection(s) → manual (${collections.linked} product links added)`,
    );
  }
  if (hierarchy) applied.push(`category level/path recomputed (${hierarchy} categories)`);

  if (applied.length) {
    console.log(`Data migrations applied: ${applied.join("; ")}`);
  }
};
