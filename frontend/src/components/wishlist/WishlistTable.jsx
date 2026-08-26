import React from "react";
import useTableControls from "../../hooks/useTableControls";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import { formatCurrency, formatDate, initials } from "../../utils/format";
import { HeartIcon } from "../common/Icon";

const ACCESSORS = {
  customer: (w) => w.userName || "",
  product: (w) => w.productName || "",
  price: (w) => Number(w.productDiscountPrice || w.productPrice) || 0,
  added: (w) => (w.addedAt ? new Date(w.addedAt).getTime() : null),
};

const WishlistTable = ({ wishlists }) => {
  const table = useTableControls(wishlists, {
    accessors: ACCESSORS,
    initialSort: { key: "added", dir: "desc" },
    pageSize: 10,
  });

  return (
    <div className="admin-table-wrap">
      <div className="overflow-x-auto admin-scroll">
        <table className="admin-table min-w-190">
          <thead>
            <tr>
              <SortableTh
                label="Customer"
                sortKey="customer"
                sort={table.sort}
                onSort={table.toggleSort}
              />
              <SortableTh
                label="Product"
                sortKey="product"
                sort={table.sort}
                onSort={table.toggleSort}
              />
              <SortableTh
                label="Price"
                sortKey="price"
                sort={table.sort}
                onSort={table.toggleSort}
                align="right"
              />
              <SortableTh
                label="Added"
                sortKey="added"
                sort={table.sort}
                onSort={table.toggleSort}
              />
            </tr>
          </thead>
          <tbody>
            {table.rows.length > 0 ? (
              table.rows.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="avatar w-7 h-7 text-[10.5px] bg-rose-50! text-rose-600!">
                        {initials(item.userName)}
                      </div>
                      <div className="min-w-0">
                        <p className="cell-strong truncate max-w-42.5">
                          {item.userName || "Unknown"}
                        </p>
                        <span className="cell-sub truncate max-w-42.5">
                          {item.userEmail || "—"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <Thumb
                        src={item.productImage}
                        alt={item.productName}
                        className="w-8 h-8"
                      />
                      <span className="cell-strong truncate max-w-55">
                        {item.productName || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {item.productDiscountPrice ? (
                      <>
                        <p className="cell-strong text-emerald-700">
                          {formatCurrency(item.productDiscountPrice)}
                        </p>
                        <span className="cell-sub line-through">
                          {formatCurrency(item.productPrice)}
                        </span>
                      </>
                    ) : (
                      <p className="cell-strong">
                        {formatCurrency(item.productPrice)}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    {formatDate(item.addedAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="empty-cell">
                  <EmptyState
                    icon={<HeartIcon className="w-5 h-5" />}
                    title="No wishlist entries"
                    message="Products your customers save for later will appear here."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={table.page}
        pageCount={table.pageCount}
        pageSize={table.pageSize}
        total={table.total}
        rangeStart={table.rangeStart}
        rangeEnd={table.rangeEnd}
        onPage={table.setPage}
        onPageSize={table.setPageSize}
        noun="saved items"
      />
    </div>
  );
};

export default WishlistTable;
