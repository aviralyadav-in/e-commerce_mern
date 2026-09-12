import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { deleteUser } from "../../features/users/usersSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import { formatDate, initials } from "../../utils/format";
import { getAssetUrl } from "../../utils/assetUrl";
import { notifySuccess, notifyError } from "../../lib/toast";
import {
  BagIcon,
  CopyIcon,
  MailIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UsersIcon,
  WhatsAppIcon,
} from "../common/Icon";

const GENDER_LABEL = {
  male: "Male",
  female: "Female",
};

const UserTable = ({ users, customerMetrics = {}, onEdit, onCreate }) => {
  const dispatch = useDispatch();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const accessors = useMemo(
    () => ({
      name: (u) => u.name || "",
      email: (u) => u.email || "",
      orders: (u) => customerMetrics[u._id]?.ordersCount || 0,
      spend: (u) => customerMetrics[u._id]?.totalSpend || 0,
      gender: (u) => GENDER_LABEL[u.gender] || "",
      joined: (u) => (u.createdAt ? new Date(u.createdAt).getTime() : null),
    }),
    [customerMetrics],
  );

  const table = useTableControls(users, {
    accessors,
    initialSort: { key: "joined", dir: "desc" },
    pageSize: 10,
  });

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    notifySuccess(`${label} copied`, text);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await dispatch(deleteUser(deleteTarget._id));
    if (deleteUser.fulfilled.match(res)) {
      notifySuccess("Customer deleted", `"${deleteTarget.name}" has been removed.`);
    } else {
      notifyError("Failed to delete customer", res.payload || "Could not delete customer.");
    }
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-220">
            <thead>
              <tr>
                <SortableTh
                  label="Customer"
                  sortKey="name"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Contact & Reach"
                  sortKey="email"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Orders & Spend (LTV)"
                  sortKey="orders"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Gender"
                  sortKey="gender"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Joined"
                  sortKey="joined"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <th scope="col" className="text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.length > 0 ? (
                table.rows.map((user) => {
                  const metrics = customerMetrics[user._id] || {
                    ordersCount: 0,
                    totalSpend: 0,
                  };
                  const cleanPhone = user.phone ? String(user.phone).replace(/\D/g, "") : "";

                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-(--surface-sunken)/70 transition-colors"
                    >
                      {/* Customer Identity */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-linear-to-tr from-indigo-500 to-violet-600 text-white font-bold text-[11.5px] flex items-center justify-center shrink-0 shadow-xs ring-2 ring-indigo-100 dark:ring-indigo-900/50 overflow-hidden">
                            {user.avatar ? (
                              <img
                                src={getAssetUrl(user.avatar)}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              initials(user.name)
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="cell-strong text-(--ink) truncate max-w-45 text-[13px] font-semibold">
                              {user.name}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="cell-sub font-mono text-(--ink-muted) text-[11px]">
                                ID: {String(user._id).slice(-8)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopy(user._id, "Customer ID")}
                                className="p-0.5 rounded text-(--ink-muted) hover:text-(--brand) hover:bg-(--surface-sunken) transition-colors cursor-pointer"
                                title="Copy full Customer ID"
                                aria-label="Copy Customer ID"
                              >
                                <CopyIcon className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & 1-Click Reach */}
                      <td>
                        <div className="flex flex-col gap-1">
                          {/* Email row with 1-click copy & mailto */}
                          <div className="flex items-center gap-1.5">
                            <span className="cell-strong text-(--ink) text-[13px] truncate max-w-50 select-all">
                              {user.email}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(user.email, "Email")}
                              className="p-1 rounded text-(--ink-muted) hover:text-(--brand) hover:bg-(--surface-sunken) transition-colors"
                              title="Copy email to clipboard"
                              aria-label="Copy email"
                            >
                              <CopyIcon className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`mailto:${user.email}`}
                              className="p-1 rounded text-(--ink-muted) hover:text-(--brand) hover:bg-(--surface-sunken) transition-colors"
                              title="Send email"
                              aria-label="Send email"
                            >
                              <MailIcon className="w-3.5 h-3.5" />
                            </a>
                          </div>

                          {/* Phone row with 1-click copy & WhatsApp */}
                          <div className="flex items-center gap-1.5">
                            {user.phone ? (
                              <>
                                <span className="cell-sub text-(--ink-muted) font-mono text-[11.5px]">
                                  +91 {user.phone}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(user.phone, "Phone")}
                                  className="p-1 rounded text-(--ink-muted) hover:text-(--brand) hover:bg-(--surface-sunken) transition-colors"
                                  title="Copy phone to clipboard"
                                  aria-label="Copy phone"
                                >
                                  <CopyIcon className="w-3 h-3" />
                                </button>
                                <a
                                  href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Hi ${user.name}, this is Niya Bags support.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                  title="Open WhatsApp chat"
                                  aria-label="Open WhatsApp chat"
                                >
                                  <WhatsAppIcon className="w-3.5 h-3.5" />
                                </a>
                              </>
                            ) : (
                              <span className="cell-sub text-(--ink-muted) text-[11px] italic">
                                No phone added
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Orders & Total Spend (LTV) */}
                      <td>
                        {metrics.ordersCount > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-[11.5px] font-semibold w-fit border border-emerald-200/60 dark:border-emerald-900/40">
                              <BagIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>
                                {metrics.ordersCount} {metrics.ordersCount === 1 ? "order" : "orders"}
                              </span>
                            </div>
                            <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
                              ₹{metrics.totalSpend.toLocaleString("en-IN")} spent
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="badge badge-neutral text-[11px] w-fit">
                              0 orders
                            </span>
                            <span className="text-[11px] text-(--ink-muted) mt-0.5">
                              ₹0 spend
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Gender */}
                      <td>
                        {user.gender ? (
                          <span
                            className={`badge ${
                              user.gender === "male"
                                ? "badge-info"
                                : "badge-pink"
                            }`}
                          >
                            {GENDER_LABEL[user.gender] || user.gender}
                          </span>
                        ) : (
                          <span className="text-(--ink-muted) text-[12px]">—</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="whitespace-nowrap text-(--ink-muted) text-[12.5px]">
                        {user.createdAt ? formatDate(user.createdAt) : "—"}
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onEdit(user)}
                            className="icon-btn icon-btn-edit"
                            title="Edit customer details"
                            aria-label={`Edit ${user.name}`}
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(user)}
                            className="icon-btn icon-btn-delete"
                            title="Delete customer account"
                            aria-label={`Delete ${user.name}`}
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    <EmptyState
                      icon={<UsersIcon className="w-5 h-5" />}
                      title="No customers found"
                      message="Customers who register on the storefront appear here. You can also add one manually."
                      action={
                        onCreate && (
                          <button
                            onClick={onCreate}
                            className="btn btn-primary btn-sm"
                          >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Add customer
                          </button>
                        )
                      }
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
          noun="customers"
        />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete customer?"
        message={
          deleteTarget
            ? customerMetrics[deleteTarget._id]?.ordersCount > 0
              ? `“${deleteTarget.name}” will be deleted along with their cart and wishlist. Note: Their ${customerMetrics[deleteTarget._id].ordersCount} historical order records will remain safely preserved for store accounting.`
              : `“${deleteTarget.name}” will be deleted along with their cart and wishlist. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete customer"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default UserTable;
