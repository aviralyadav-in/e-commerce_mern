// 🆕 COLLECTION MATCHER — automated collections ke rules ko Mongo query me
// convert karta hai aur collection-ids ko ek membership condition bana deta hai.

const OPERATORS = { gt: "$gt", gte: "$gte", lt: "$lt", lte: "$lte", eq: "$eq" };

/**
 * Rules array → Product.find() ke liye $and conditions array.
 * Unknown/invalid rules silently skip hote hain.
 */
export const buildRulesQuery = (rules = []) => {
  const and = [];
  for (const rule of rules || []) {
    if (!rule?.field || !rule?.operator) continue;

    if (rule.field === "price" || rule.field === "stock") {
      const value = Number(rule.value);
      if (Number.isNaN(value)) continue;
      const op = OPERATORS[rule.operator];
      if (op) and.push({ [rule.field]: { [op]: value } });
    } else if (rule.field === "createdAt" && rule.operator === "withinDays") {
      const days = Number(rule.value);
      if (days > 0) {
        and.push({
          createdAt: { $gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000) },
        });
      }
    } else if (rule.field === "subCategory" && rule.operator === "eq") {
      if (rule.value === "Men" || rule.value === "Women") {
        and.push({ subCategory: rule.value });
      }
    }
  }
  return and;
};

/**
 * Collection ids (manual + automated mix) → ek Mongo condition ya null.
 * - Manual collections → products ke `collections` array se match
 * - Automated collections → rules query se match (virtual membership)
 */
export const buildCollectionsCondition = async (CollectionModel, ids = []) => {
  if (!ids?.length) return null;

  const cols = await CollectionModel.find({
    _id: { $in: ids },
    isActive: true,
  }).lean();
  if (!cols.length) return null;

  const manualIds = cols.filter((c) => c.type !== "automated").map((c) => c._id);
  const automated = cols.filter((c) => c.type === "automated");

  const branches = [];
  if (manualIds.length) {
    branches.push({ collections: { $in: manualIds } });
  }
  for (const col of automated) {
    const ruleQuery = buildRulesQuery(col.rules);
    if (ruleQuery.length) {
      branches.push({ $and: ruleQuery });
    }
  }

  if (!branches.length) return null;
  return branches.length === 1 ? branches[0] : { $or: branches };
};
