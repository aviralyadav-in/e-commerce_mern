import React from "react";
import { ArrowUpIcon, ArrowDownIcon, SortIcon } from "./Icon";

/**
 * A sortable `<th>`. Pass `align="right"` for numeric columns.
 *
 * The click handler sits on the `<th>` so the whole header cell is a target;
 * `tabIndex` + Enter/Space keep it reachable without a keyboard trap, and the
 * cell keeps its native `columnheader` role so `aria-sort` still reads out.
 */
const SortableTh = ({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
  className = "",
  width,
}) => {
  const active = sort?.key === sortKey;
  const dir = active ? sort.dir : null;

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSort(sortKey);
    }
  };

  return (
    <th
      scope="col"
      style={width ? { width } : undefined}
      className={`th-sort ${active ? "th-sort-active" : ""} ${
        align === "right" ? "text-right" : ""
      } ${className}`}
      onClick={() => onSort(sortKey)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      title={`Sort by ${label}`}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span
        className={`th-sort-inner ${align === "right" ? "flex-row-reverse" : ""}`}
      >
        {label}
        {dir === "asc" ? (
          <ArrowUpIcon className="th-sort-icon" />
        ) : dir === "desc" ? (
          <ArrowDownIcon className="th-sort-icon" />
        ) : (
          <SortIcon className="th-sort-icon" />
        )}
      </span>
    </th>
  );
};

export default SortableTh;
