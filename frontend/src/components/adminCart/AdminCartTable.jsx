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
                  <tr key={item._id} className="hover:bg-slate-50/80 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-blue-100 shadow-xs">
                          {initials(item.userName)}
                        </div>
                        <div className="min-w-0">
                          <p className="cell-strong truncate max-w-45 text-[13px]">
                            {item.userName || "Customer"}
                          </p>
                          <span className="cell-sub truncate max-w-45 text-slate-400 text-[11px]">
                            {item.userEmail || "Active Cart User"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Thumb
                          src={item.productImage}
                          alt={item.productName}
                          className="w-9 h-9"
                          rounded="rounded-xl"
                        />
                        <span className="cell-strong truncate max-w-50 text-[13px]">
                          {item.productName || "Product item"}
                        </span>
                      </div>
                    </td>
                    <td className="text-right whitespace-nowrap text-slate-600 font-medium text-[13px]">
                      {formatCurrency(item.productPrice)}
                    </td>
                    <td className="text-right whitespace-nowrap font-bold text-slate-900 tabular-nums text-[13px]">
                      {item.quantity}
                    </td>
                    <td className="text-right whitespace-nowrap font-extrabold text-slate-900 tabular-nums text-[13.5px]">
                      {formatCurrency(item.itemTotal)}
                    </td>
                    <td className="whitespace-nowrap text-slate-500 text-[12px]">
                      {item.addedAt ? formatDate(item.addedAt) : "Recently"}
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
