import { useCallback, useMemo, useState } from "react";

const compare = (a, b) => {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "en", {
    numeric: true,
    sensitivity: "base",
  });
};

/**
 * Sorting + client-side pagination for the admin list tables.
 *
 * `accessors` maps a column key to a value getter, so a column can sort on
 * something other than the literal cell text (e.g. sort a customer column by
 * name while the cell also renders an email).
 */
const useTableControls = (
  rows,
  { accessors = {}, initialSort = null, pageSize: initialPageSize = 10 } = {},
) => {
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const sorted = useMemo(() => {
    if (!sort?.key) return rows;
    const get = accessors[sort.key] || ((row) => row?.[sort.key]);
    const dir = sort.dir === "desc" ? -1 : 1;
    // Copy first — `rows` is Redux state and must not be sorted in place.
    return [...rows].sort((a, b) => compare(get(a), get(b)) * dir);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sort]);

  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const safePage = Math.min(page, pageCount);

  /**
   * Exposed setter clamps every jump into range up-front (filters can shrink
   * the dataset), so a stale large page never resurfaces when rows grow back.
   */
  const goToPage = useCallback(
    (p) => setPage(Math.max(1, Math.min(p, pageCount))),
    [pageCount],
  );
  const start = (safePage - 1) * pageSize;

  const pageRows = useMemo(
    () => sorted.slice(start, start + pageSize),
    [sorted, start, pageSize],
  );

  const toggleSort = useCallback((key) => {
    setSort((prev) => {
      if (prev?.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null; // third click clears sorting
    });
    setPage(1);
  }, []);

  const changePageSize = useCallback((size) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return {
    rows: pageRows,
    sort,
    toggleSort,
    page: safePage,
    pageCount,
    pageSize,
    setPage: goToPage,
    setPageSize: changePageSize,
    total,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
    resetPage: () => setPage(1),
  };
};

export default useTableControls;
