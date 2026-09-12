import { useState } from "react";
import { useDispatch } from "react-redux";
import useTableControls from "../../hooks/useTableControls";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import Thumb from "../common/Thumb";
import ConfirmDialog from "../common/ConfirmDialog";
import { formatCurrency, formatDate, initials } from "../../utils/format";
import { notifySuccess, notifyError } from "../../lib/toast";
import {
  adminRemoveFromCart,
  adminUpdateCartQuantity,
} from "../../features/adminCart/adminCartSlice";
import {
  CartIcon,
  CopyIcon,
  MailIcon,
  WhatsAppIcon,
  BagIcon,
  TrashIcon,
} from "../common/Icon";

const ACCESSORS = {
  customer: (c) => c.userName || "",
  product: (c) => c.productName || "",
  price: (c) => Number(c.itemTotal) / (Number(c.quantity) || 1) || Number(c.productPrice) || 0,
  qty: (c) => Number(c.quantity) || 0,
  total: (c) => Number(c.itemTotal) || 0,
  updated: (c) => (c.addedAt ? new Date(c.addedAt).getTime() : null),
};

const getWhatsAppUrl = (phone, text = "") => {
  if (!phone) return "";
  const clean = String(phone).replace(/\D/g, "");
  if (!clean) return "";
  const standardNumber =
    clean.length === 10
      ? `91${clean}`
      : clean.length === 12 && clean.startsWith("91")
        ? clean
        : clean;
  return `https://wa.me/${standardNumber}?text=${encodeURIComponent(text)}`;
};

const formatIndianPhone = (phone) => {
  if (!phone) return "";
  const clean = String(phone).replace(/\D/g, "");
  if (clean.length === 10) {
    return `+91 ${clean}`;
  }
  if (clean.length === 12 && clean.startsWith("91")) {
    return `+91 ${clean.slice(2)}`;
  }
  return phone;
};

const AdminCartTable = ({ carts = [] }) => {
  const dispatch = useDispatch();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingQtyId, setUpdatingQtyId] = useState(null);

  const table = useTableControls(carts, {
    accessors: ACCESSORS,
    initialSort: { key: "updated", dir: "desc" },
    pageSize: 10,
  });

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    notifySuccess(`${label} copied`, text);
  };

  const handleQuantityChange = async (item, delta) => {
    const newQty = (Number(item.quantity) || 1) + delta;
    if (newQty < 1) {
      setDeleteTarget(item);
      return;
    }

    if (item.productStock !== undefined && newQty > item.productStock) {
      notifyError(
        "Insufficient stock",
        `Only ${item.productStock} units available in stock.`,
      );
      return;
    }

    setUpdatingQtyId(item._id);
    try {
      await dispatch(
        adminUpdateCartQuantity({
          userId: item.userId,
          productId: item.productId,
          variantName: item.productVariant,
          quantity: newQty,
        }),
      ).unwrap();
      notifySuccess("Quantity updated", `${item.productName}: ${newQty} pcs`);
    } catch (err) {
      notifyError("Failed to update quantity", String(err));
    } finally {
      setUpdatingQtyId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(
        adminRemoveFromCart({
          userId: deleteTarget.userId,
          productId: deleteTarget.productId,
          variantName: deleteTarget.productVariant,
        }),
      ).unwrap();
      notifySuccess(
        "Item removed from cart",
        `Removed "${deleteTarget.productName}" for ${deleteTarget.userName}`,
      );
      setDeleteTarget(null);
    } catch (err) {
      notifyError("Failed to remove item", String(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-240">
            <thead>
              <tr>
                <SortableTh
                  label="Customer & Reach"
                  sortKey="customer"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Product & Variant"
                  sortKey="product"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Unit Price"
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
                  align="center"
                />
                <SortableTh
                  label="Line Total"
                  sortKey="total"
                  sort={table.sort}
                  onSort={table.toggleSort}
                  align="right"
                />
                <SortableTh
                  label="Cart Updated"
                  sortKey="updated"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <th scope="col" className="text-right">
                  Actions & Outreach
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.length > 0 ? (
                table.rows.map((item) => {
                  const cleanPhone =
                    item.userPhone && item.userPhone !== "N/A"
                      ? String(item.userPhone).replace(/\D/g, "")
                      : "";

                  const qty = Number(item.quantity) || 1;
                  const lineTotal = Number(item.itemTotal) || 0;
                  const effectiveUnit = Math.round(lineTotal / qty);
                  const originalPrice = Number(item.productPrice) || effectiveUnit;
                  const hasDiscount = effectiveUnit < originalPrice;
                  const discountPercent = hasDiscount
                    ? Math.round(
                        ((originalPrice - effectiveUnit) / originalPrice) * 100,
                      )
                    : 0;

                  const recoveryMsg = `Hi ${item.userName || "there"}, we noticed you left ${qty}x "${item.productName}" in your cart at Niya Bags (Total: ${formatCurrency(lineTotal)}). Would you like any assistance or an exclusive offer to complete your order today?`;
                  const waUrl = getWhatsAppUrl(item.userPhone, recoveryMsg);

                  const isUpdatingThis = updatingQtyId === item._id;

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-(--surface-sunken)/70 transition-colors"
                    >
                      {/* Customer & Reach */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-500 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs ring-2 ring-blue-100 dark:ring-blue-900/50">
                            {initials(item.userName)}
                          </div>
                          <div className="min-w-0">
                            <p className="cell-strong text-(--ink) truncate max-w-45 text-[13px] font-semibold">
                              {item.userName || "Shopper"}
                            </p>

                            {/* Email with copy & mailto */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="cell-sub text-(--ink-muted) truncate max-w-45 text-[11px] select-all">
                                {item.userEmail || "No email"}
                              </span>
                              {item.userEmail && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.userEmail, "Email")}
                                    className="p-0.5 rounded text-(--ink-muted) hover:text-(--brand) hover:bg-(--surface-sunken) transition-colors"
                                    title="Copy email"
                                    aria-label="Copy email"
                                  >
                                    <CopyIcon className="w-3 h-3" />
                                  </button>
                                  <a
                                    href={`mailto:${item.userEmail}?subject=${encodeURIComponent(`Complete your cart at Niya Bags: ${item.productName}`)}`}
                                    className="p-0.5 rounded text-(--ink-muted) hover:text-(--brand) hover:bg-(--surface-sunken) transition-colors"
                                    title="Send email"
                                    aria-label="Send email"
                                  >
                                    <MailIcon className="w-3 h-3" />
                                  </a>
                                </>
                              )}
                            </div>

                            {/* Phone with copy & WhatsApp */}
                            {cleanPhone ? (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[11px] text-(--ink-muted)">
                                  {formatIndianPhone(item.userPhone)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(item.userPhone, "Phone")}
                                  className="p-0.5 rounded text-(--ink-muted) hover:text-(--brand) hover:bg-(--surface-sunken) transition-colors"
                                  title="Copy phone"
                                  aria-label="Copy phone"
                                >
                                  <CopyIcon className="w-2.5 h-2.5" />
                                </button>
                                {waUrl && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-0.5 rounded text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                                    title="WhatsApp chat"
                                    aria-label="WhatsApp chat"
                                  >
                                    <WhatsAppIcon className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Product & Variant */}
                      <td>
                        <div className="flex items-center gap-3">
                          <Thumb
                            src={item.productImage}
                            alt={item.productName}
                            className="w-10 h-10"
                            rounded="rounded-xl"
                            icon={<BagIcon className="w-4 h-4 text-(--ink-muted)" />}
                          />
                          <div className="min-w-0">
                            <p className="cell-strong text-(--ink) truncate max-w-50 text-[13px] font-semibold">
                              {item.productName || "Product item"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.productVariant && item.productVariant !== "plain" ? (
                                <span className="badge badge-neutral text-[10.5px] px-1.5 py-0.2">
                                  Variant: {item.productVariant}
                                </span>
                              ) : (
                                <span className="text-[11px] text-(--ink-muted) block">
                                  Standard
                                </span>
                              )}

                              {item.productStock !== undefined && (
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-medium ${
                                    item.productStock <= 0
                                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
                                      : item.productStock <= 5
                                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
                                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                                  }`}
                                >
                                  {item.productStock <= 0
                                    ? "Out of stock"
                                    : `${item.productStock} in stock`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="text-right whitespace-nowrap">
                        {hasDiscount ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="badge badge-success text-[10px] px-1 py-0 font-bold">
                                {discountPercent}% OFF
                              </span>
                              <p className="cell-strong text-emerald-600 dark:text-emerald-400 font-bold text-[13px]">
                                {formatCurrency(effectiveUnit)}
                              </p>
                            </div>
                            <span className="cell-sub line-through text-(--ink-muted) text-[11px]">
                              {formatCurrency(originalPrice)}
                            </span>
                          </div>
                        ) : (
                          <p className="cell-strong text-(--ink) font-bold text-[13px]">
                            {formatCurrency(originalPrice)}
                          </p>
                        )}
                      </td>

                      {/* Quantity with Inline Adjustment Controls */}
                      <td className="text-center whitespace-nowrap">
                        <div className="inline-flex items-center rounded-lg border border-(--border) bg-(--surface-card) shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, -1)}
                            disabled={isUpdatingThis}
                            className="px-2 py-1 text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken) rounded-l-lg transition-colors font-bold text-xs"
                            title="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="px-2.5 py-1 text-[12px] font-bold text-(--ink) min-w-7 text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(item, 1)}
                            disabled={isUpdatingThis}
                            className="px-2 py-1 text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken) rounded-r-lg transition-colors font-bold text-xs"
                            title="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Line Total */}
                      <td className="text-right whitespace-nowrap">
                        <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[14px] tabular-nums">
                          {formatCurrency(lineTotal)}
                        </p>
                        {qty > 1 && (
                          <span className="text-[10.5px] text-(--ink-muted) block mt-0.5">
                            ({qty} × {formatCurrency(effectiveUnit)})
                          </span>
                        )}
                      </td>

                      {/* Cart Updated */}
                      <td className="whitespace-nowrap text-(--ink-muted) text-[12px]">
                        {item.addedAt ? formatDate(item.addedAt) : "Recently"}
                      </td>

                      {/* Quick Recovery Outreach & Delete Actions */}
                      <td className="text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-1.5">
                          {cleanPhone && waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40 transition-colors shadow-2xs"
                              title="Send WhatsApp recovery message"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Recover</span>
                            </a>
                          ) : item.userEmail ? (
                            <a
                              href={`mailto:${item.userEmail}?subject=${encodeURIComponent(`Complete your order at Niya Bags: ${item.productName}`)}&body=${encodeURIComponent(`Hi ${item.userName},\n\nWe saw you have ${qty}x "${item.productName}" in your Niya Bags cart!\n\nUse code SAVE10 for an extra 10% off if you complete your order today.`)}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/40 transition-colors shadow-2xs"
                              title="Send cart recovery email"
                            >
                              <MailIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Email offer</span>
                            </a>
                          ) : (
                            <span className="text-[11.5px] text-(--ink-muted)">
                              —
                            </span>
                          )}

                          {/* Delete from Cart Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Remove from customer cart"
                            aria-label="Remove item"
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
                  <td colSpan="7" className="empty-cell">
                    <EmptyState
                      icon={<CartIcon className="w-5 h-5 text-(--brand)" />}
                      title="No active carts"
                      message="Items sitting in customer carts show up here — useful for recovering abandoned checkouts."
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Cart Item?"
        message={
          deleteTarget
            ? `Are you sure you want to remove ${deleteTarget.quantity}x "${deleteTarget.productName}" from ${deleteTarget.userName}'s cart?`
            : ""
        }
        confirmLabel={deleting ? "Removing..." : "Remove Item"}
        cancelLabel="Keep Item"
        variant="danger"
        busy={deleting}
      />
    </>
  );
};

export default AdminCartTable;
