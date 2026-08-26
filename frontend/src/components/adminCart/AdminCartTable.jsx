import React from "react";
import useTableControls from "../../hooks/useTableControls";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import { formatCurrency, formatDate, initials } from "../../utils/format";
import { CartIcon } from "../common/Icon";

const ACCESSORS = {
  customer: (c) => c.userName || "",
  product: (c) => c.productName || "",
  price: (c) => Number(c.productPrice) || 0,
  qty: (c) => Number(c.quantity) || 0,
  total: (c) => Number(c.itemTotal) || 0,
  updated: (c) => (c.addedAt ? new Date(c.addedAt).getTime() : null),
};

const AdminCartTable = ({ carts }) => {
  const table = useTableControls(carts, {
    accessors: ACCESSORS,
    initialSort: { key: "updated", dir: "desc" },
    pageSize: 10,
  });

  return (
    <div className="admin-table-wrap">
      <div className="overflow-x-auto admin-scroll">
        <table className="admin-table min-w-225">
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
                label="Qty"
                sortKey="qty"
                sort={table.sort}
                onSort={table.toggleSort}
                align="right"
              />
              <SortableTh
                label="Line total"
                sortKey="total"
                sort={table.sort}
                onSort={table.toggleSort}
                align="right"
              />
              <SortableTh
                label="Updated"
                sortKey="updated"
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
                      <div className="avatar w-7 h-7 text-[10.5px] bg-blue-50! text-blue-700!">
                        {initials(item.userName)}
                      </div>
                      <div className="min-w-0">
                        <p className="cell-strong truncate max-w-40">
                          {item.userName || "Unknown"}
                        </p>
                        <span className="cell-sub truncate max-w-40">
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
                      <span className="cell-strong truncate max-w-50">
                        {item.productName || "—"}
                      </span>
                    </div>
                  </td>
                  <td className="text-right whitespace-nowrap">
                    {formatCurrency(item.productPrice)}
                  </td>
                  <td className="text-right">
                    <span className="badge badge-neutral">
                      ×{item.quantity}
                    </span>
                  </td>
                  <td className="text-right whitespace-nowrap cell-strong">
                    {formatCurrency(item.itemTotal)}
                  </td>
                  <td className="whitespace-nowrap">
                    {formatDate(item.addedAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-cell">
                  <EmptyState
                    icon={<CartIcon className="w-5 h-5" />}
                    title="No active carts"
                    message="Items sitting in customer carts show up here — useful for spotting abandoned checkouts."
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
        noun="cart items"
      />
    </div>
  );
};

export default AdminCartTable;
