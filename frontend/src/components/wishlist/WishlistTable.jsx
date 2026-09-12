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
import { adminRemoveWishlistItem } from "../../features/wishlist/wishlistSlice";
import {
  HeartIcon,
  CopyIcon,
  MailIcon,
  WhatsAppIcon,
  BagIcon,
  TrashIcon,
} from "../common/Icon";

const ACCESSORS = {
  customer: (w) => w.userName || "",
  product: (w) => w.productName || "",
  price: (w) => Number(w.productDiscountPrice || w.productPrice) || 0,
  added: (w) => (w.addedAt ? new Date(w.addedAt).getTime() : null),
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

const WishlistTable = ({ wishlists = [], productTally = {} }) => {
  const dispatch = useDispatch();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const table = useTableControls(wishlists, {
    accessors: ACCESSORS,
    initialSort: { key: "added", dir: "desc" },
    pageSize: 10,
  });

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    notifySuccess(`${label} copied`, text);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await dispatch(
        adminRemoveWishlistItem({
          userId: deleteTarget.userId,
          productId: deleteTarget.productId,
        }),
      ).unwrap();
      notifySuccess(
        "Removed from wishlist",
        `"${deleteTarget.productName}" removed for ${deleteTarget.userName}`,
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
          <table className="admin-table min-w-220">
            <thead>
              <tr>
                <SortableTh
                  label="Customer & Reach"
                  sortKey="customer"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Saved Product"
                  sortKey="product"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Price & Savings"
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
                <th scope="col" className="text-right">
                  Actions & Outreach
                </th>
              </tr>
            </thead>
            <tbody>
              {table.rows.length > 0 ? (
                table.rows.map((item) => {
                  const cleanPhone = item.userPhone && item.userPhone !== "N/A"
                    ? String(item.userPhone).replace(/\D/g, "")
                    : "";

                  const tally = productTally[item.productName] || 1;
                  const hasDiscount =
                    item.productDiscountPrice &&
                    Number(item.productDiscountPrice) < Number(item.productPrice);

                  const discountPercent = hasDiscount
                    ? Math.round(
                        ((item.productPrice - item.productDiscountPrice) /
                          item.productPrice) *
                          100,
                      )
                    : 0;

                  const whatsappMsg = `Hi ${item.userName || "there"}, we noticed you saved "${item.productName}" to your wishlist at Niya Bags! Would you like an exclusive offer to complete your order today?`;
                  const waUrl = getWhatsAppUrl(item.userPhone, whatsappMsg);

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-(--surface-sunken)/70 transition-colors"
                    >
                      {/* Customer & Reach */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-rose-500 to-pink-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-xs ring-2 ring-rose-100 dark:ring-rose-900/50">
                            {initials(item.userName)}
                          </div>
                          <div className="min-w-0">
                            <p className="cell-strong text-(--ink) truncate max-w-45 text-[13px] font-semibold">
                              {item.userName || "Registered Shopper"}
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
                                    href={`mailto:${item.userEmail}?subject=${encodeURIComponent(`Regarding your saved bag: ${item.productName}`)}`}
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

                      {/* Saved Product */}
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
                            <p className="cell-strong text-(--ink) truncate max-w-55 text-[13px] font-semibold">
                              {item.productName || "Product item"}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {tally >= 2 ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.2 rounded-md border border-rose-200/50 dark:border-rose-900/30">
                                  🔥 Saved by {tally} shoppers
                                </span>
                              ) : (
                                <span className="text-[11px] text-(--ink-muted)">
                                  1 shopper saved
                                </span>
                              )}
                              {item.productStock !== undefined && (
                                <span
                                  className={`text-[10.5px] px-1.5 py-0.2 rounded-md font-medium ${
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

                      {/* Price & Savings */}
                      <td className="text-right whitespace-nowrap">
                        {hasDiscount ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="badge badge-success text-[10px] px-1 py-0 font-bold">
                                {discountPercent}% OFF
                              </span>
                              <p className="cell-strong text-emerald-600 dark:text-emerald-400 font-bold text-[13px]">
                                {formatCurrency(item.productDiscountPrice)}
                              </p>
                            </div>
                            <span className="cell-sub line-through text-(--ink-muted) text-[11px]">
                              {formatCurrency(item.productPrice)}
                            </span>
                          </div>
                        ) : (
                          <p className="cell-strong text-(--ink) font-bold text-[13px]">
                            {formatCurrency(item.productPrice)}
                          </p>
                        )}
                      </td>

                      {/* Added Date */}
                      <td className="whitespace-nowrap text-(--ink-muted) text-[12px]">
                        {item.addedAt ? formatDate(item.addedAt) : "Recently"}
                      </td>

                      {/* Quick Convert Outreach & Delete Actions */}
                      <td className="text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-1.5">
                          {cleanPhone && waUrl ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-medium bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40 transition-colors shadow-2xs"
                              title="Chat with customer on WhatsApp"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>WhatsApp</span>
                            </a>
                          ) : item.userEmail ? (
                            <a
                              href={`mailto:${item.userEmail}?subject=${encodeURIComponent(`Special offer for your saved bag: ${item.productName}`)}&body=${encodeURIComponent(`Hi ${item.userName},\n\nWe saw you added "${item.productName}" to your wishlist at Niya Bags!\n\nHere is a special offer just for you to complete your order today.`)}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/40 transition-colors shadow-2xs"
                              title="Send customer an email offer"
                            >
                              <MailIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Email offer</span>
                            </a>
                          ) : (
                            <span className="text-[11.5px] text-(--ink-muted)">
                              —
                            </span>
                          )}

                          {/* Delete from Wishlist Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                            title="Remove from customer wishlist"
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
                  <td colSpan="5" className="empty-cell">
                    <EmptyState
                      icon={<HeartIcon className="w-5 h-5 text-rose-500" />}
                      title="No wishlist entries found"
                      message="When shoppers save items for later on your storefront, they will appear here with conversion options."
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

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Remove Saved Item?"
        message={
          deleteTarget
            ? `Are you sure you want to remove "${deleteTarget.productName}" from ${deleteTarget.userName}'s wishlist? The customer will no longer see this saved item.`
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

export default WishlistTable;
