import { ChevronLeftIcon, ChevronRightIcon } from "./Icon";

/** Windowed page list: 1 … 4 5 6 … 12 */
const buildPages = (page, pageCount) => {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);

  const pages = new Set([1, pageCount, page, page - 1, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((n) => pages.add(n));
  if (page >= pageCount - 2)
    [pageCount - 1, pageCount - 2, pageCount - 3].forEach((n) => pages.add(n));

  const sorted = [...pages]
    .filter((n) => n >= 1 && n <= pageCount)
    .sort((a, b) => a - b);

  const out = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) out.push(`gap-${n}`);
    out.push(n);
  });
  return out;
};

const PAGE_SIZES = [10, 25, 50, 100];

/** Enough of a depluraliser for the nouns this footer is actually given. */
const singular = (noun) => {
  if (noun.endsWith("ies")) return `${noun.slice(0, -3)}y`;
  if (noun.endsWith("s") && !noun.endsWith("ss")) return noun.slice(0, -1);
  return noun;
};

const countLabel = (count, noun) => (count === 1 ? singular(noun) : noun);

const Pagination = ({
  page,
  pageCount,
  pageSize,
  total,
  rangeStart,
  rangeEnd,
  onPage,
  onPageSize,
  noun = "records",
}) => {
  // A single page of results doesn't need controls, but the count is still useful.
  const showPager = pageCount > 1;
  const showSizer = typeof onPageSize === "function" && total > PAGE_SIZES[0];

  if (!showPager && !showSizer) {
    if (total === 0) return null;
    return (
      <div className="table-footer">
        <span>
          {total} {countLabel(total, noun)}
        </span>
      </div>
    );
  }

  return (
    <div className="table-footer">
      <div className="flex items-center gap-3">
        <span>
          Showing{" "}
          <span className="font-semibold text-(--ink-soft)">{rangeStart}</span>–
          <span className="font-semibold text-(--ink-soft)">{rangeEnd}</span> of{" "}
          <span className="font-semibold text-(--ink-soft)">{total}</span>{" "}
          {countLabel(total, noun)}
        </span>
        {showSizer && (
          <select
            value={pageSize}
            onChange={(e) => onPageSize(Number(e.target.value))}
            className="admin-select h-7 text-[12px] pl-2 pr-7"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {showPager && (
        <div className="pager">
          <button
            className="pager-btn"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
          </button>

          {buildPages(page, pageCount).map((n) =>
            typeof n === "string" ? (
              <span key={n} className="pager-gap">
                …
              </span>
            ) : (
              <button
                key={n}
                onClick={() => onPage(n)}
                className={`pager-btn ${n === page ? "pager-btn-active" : ""}`}
                aria-current={n === page ? "page" : undefined}
              >
                {n}
              </button>
            ),
          )}

          <button
            className="pager-btn"
            onClick={() => onPage(page + 1)}
            disabled={page >= pageCount}
            aria-label="Next page"
          >
            <ChevronRightIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Pagination;
