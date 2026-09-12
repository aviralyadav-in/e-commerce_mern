import { Category } from "../models/category.model.js";

/* =========================================================
   CATEGORY HIERARCHY HELPERS
   Tree max 3 levels: 0 = root, 1 = child, 2 = sub-child.
   Categories kam hoti hain (hundreds), isliye poora tree ek
   lean query me load karke memory me check karna sasta hai.
========================================================= */
export const MAX_CATEGORY_LEVEL = 2;

const NEW_CATEGORY = "__new__";

const loadParentMap = async () => {
  const all = await Category.find().select("_id parentId").lean();
  return new Map(
    all.map((c) => [String(c._id), c.parentId ? String(c.parentId) : null]),
  );
};

// startId (khud bhi) se root tak ki chain me targetId aata hai?
const isInAncestorChain = (parentMap, startId, targetId) => {
  const seen = new Set();
  let cur = startId;
  while (cur && !seen.has(cur)) {
    if (cur === targetId) return true;
    seen.add(cur);
    cur = parentMap.get(cur) ?? null;
  }
  return false;
};

// 0 = root
const depthOf = (parentMap, id) => {
  const seen = new Set([id]);
  let depth = 0;
  let cur = parentMap.get(id) ?? null;
  while (cur && parentMap.has(cur) && !seen.has(cur)) {
    seen.add(cur);
    depth += 1;
    cur = parentMap.get(cur) ?? null;
  }
  return depth;
};

// 0 = koi child nahi
const subtreeHeight = (parentMap, id, seen = new Set()) => {
  if (seen.has(id)) return 0;
  seen.add(id);
  let height = 0;
  for (const [nodeId, parentId] of parentMap) {
    if (parentId === id) {
      height = Math.max(height, 1 + subtreeHeight(parentMap, nodeId, seen));
    }
  }
  return height;
};

/**
 * Parent set karne / existing child ko is category ke under move karne se
 * pehle rules check: parent/child exist karein, cycle na bane, tree 3 levels
 * se gehra na ho.
 *
 * @param {object} change
 * @param {string|null} change.categoryId - update me category id, create me null
 * @param {string|null} change.parentId - nayi parent id (null = top-level)
 * @param {string|null} change.childId - existing category jo is category ke under jayegi
 * @returns {Promise<string|null>} error message, ya null agar change valid hai
 */
export const checkHierarchyChange = async ({
  categoryId = null,
  parentId = null,
  childId = null,
}) => {
  const parentMap = await loadParentMap();
  const selfId = categoryId ? String(categoryId) : NEW_CATEGORY;
  const nextParentId = parentId ? String(parentId) : null;
  const tooDeep =
    "Categories can only be nested 3 levels deep (Main → Sub → Sub-child)";

  if (nextParentId) {
    if (nextParentId === selfId) return "Category cannot be its own parent";
    if (!parentMap.has(nextParentId)) return "Parent category not found";
    if (isInAncestorChain(parentMap, nextParentId, selfId)) {
      return "A category cannot be moved under its own sub-category";
    }
  }
  parentMap.set(selfId, nextParentId);

  const selfDepth = depthOf(parentMap, selfId);
  if (selfDepth + subtreeHeight(parentMap, selfId) > MAX_CATEGORY_LEVEL) {
    return tooDeep;
  }

  if (childId) {
    const nextChildId = String(childId);
    if (nextChildId === selfId) return "Category cannot be its own child";
    if (!parentMap.has(nextChildId)) return "Child category not found";
    if (isInAncestorChain(parentMap, selfId, nextChildId)) {
      return "A parent category cannot be moved under its own sub-category";
    }
    parentMap.set(nextChildId, selfId);
    if (selfDepth + 1 + subtreeHeight(parentMap, nextChildId) > MAX_CATEGORY_LEVEL) {
      return tooDeep;
    }
  }

  return null;
};

/**
 * Saari categories ka level + materialized path ("rootId/childId/selfId")
 * parentId chain se dobara calculate karta hai aur sirf badle hue docs update
 * karta hai. Parent change, child move ya delete ke baad call karo.
 *
 * @returns {Promise<number>} kitne docs update hue
 */
export const rebuildCategoryHierarchy = async () => {
  const all = await Category.find().select("_id parentId level path").lean();
  const byId = new Map(all.map((c) => [String(c._id), c]));

  const ops = [];
  for (const category of all) {
    const chain = [];
    const seen = new Set();
    let cur = category;
    while (cur && !seen.has(String(cur._id))) {
      seen.add(String(cur._id));
      chain.unshift(String(cur._id));
      cur = cur.parentId ? byId.get(String(cur.parentId)) : null;
    }

    const level = Math.min(chain.length - 1, MAX_CATEGORY_LEVEL);
    const path = chain.join("/");
    if (category.level !== level || category.path !== path) {
      ops.push({
        updateOne: {
          filter: { _id: category._id },
          update: { $set: { level, path } },
          timestamps: false,
        },
      });
    }
  }

  if (ops.length) await Category.bulkWrite(ops);
  return ops.length;
};
