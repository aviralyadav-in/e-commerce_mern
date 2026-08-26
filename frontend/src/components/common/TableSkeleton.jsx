import React from "react";

/**
 * Placeholder rows that match the real table's geometry, so the first paint
 * after a fetch doesn't shift the layout.
 */
const TableSkeleton = ({ rows = 6, columns = 5, hasThumb = false }) => (
  <div className="admin-table-wrap">
    <table className="admin-table">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: columns }).map((__, c) => (
              <td key={c}>
                {hasThumb && c === 0 ? (
                  <div className="flex items-center gap-2.5">
                    <div className="skeleton w-9 h-9 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3" style={{ width: "62%" }} />
                      <div className="skeleton h-2.5" style={{ width: "38%" }} />
                    </div>
                  </div>
                ) : (
                  <div
                    className="skeleton h-3"
                    style={{ width: `${[70, 55, 45, 60, 40][c % 5]}%` }}
                  />
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default TableSkeleton;
