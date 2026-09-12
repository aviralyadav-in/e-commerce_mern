// 🆕 COLLECTION MATCHER — collection-ids ko membership condition banata hai.
// Sab collections manual hain — products ke `collections` array se match.

/**
 * Collection ids → ek Mongo condition ya null.
 * - Products ke `collections` array se match
 */
export const buildCollectionsCondition = async (
  CollectionModel,
  ids = [],
  options = {},
) => {
  if (!ids?.length) return null;

  const query = { _id: { $in: ids } };
  if (!options.includeInactive) {
    query.isActive = true;
  }

  const cols = await CollectionModel.find(query).select("_id").lean();
  if (!cols.length) return { collections: { $in: [] } };

  return { collections: { $in: cols.map((c) => c._id) } };
};
