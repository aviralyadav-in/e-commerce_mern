import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProductsByCollection,
  clearCollectionProducts,
} from "../../features/collections/collectionsSlice";
import Thumb from "../common/Thumb";
import { formatCurrency } from "../../utils/format";
import { XIcon } from "../common/Icon";

/**
 * CollectionProductsModal — Lists products inside a collection
 */
const CollectionProductsModal = ({ isOpen, collection, onClose }) => {
  const dispatch = useDispatch();
  const {
    collectionProducts,
    collectionProductsLoading,
    collectionProductsError,
  } = useSelector((state) => state.collections);

  useEffect(() => {
    if (isOpen && collection?._id) {
      dispatch(fetchProductsByCollection(collection._id));
    }
    return () => {
      dispatch(clearCollectionProducts());
    };
  }, [isOpen, collection?._id, dispatch]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-panel max-w-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-products-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-(--border) p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                id="collection-products-title"
                className="font-display text-lg font-bold truncate text-(--ink)"
              >
                {collection?.name || "Collection"}
              </h2>
            </div>
            <p className="mt-0.5 text-[12px] text-(--ink-muted)">
              {collectionProductsLoading
                ? "Loading products…"
                : `${collectionProducts.length} product${
                    collectionProducts.length === 1 ? "" : "s"
                  } in this collection`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="icon-btn shrink-0"
            aria-label="Close"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="admin-scroll max-h-[60vh] overflow-y-auto">
          {collectionProductsLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="spinner" />
            </div>
          ) : collectionProductsError ? (
            <div className="p-6 text-center">
              <p className="text-[13px] text-red-600">
                {collectionProductsError}
              </p>
            </div>
          ) : collectionProducts.length > 0 ? (
            <table className="admin-table w-full">
              <thead>
                <tr>
                  <th scope="col">Product</th>
                  <th scope="col" className="text-right">
                    Price
                  </th>
                  <th scope="col" className="text-right">
                    Stock
                  </th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {collectionProducts.map((p) => {
                  const price = Number(p.price) || 0;
                  const discount = Number(p.discountPrice) || 0;
                  const effective =
                    discount > 0 && discount < price ? discount : price;
                  const stock = p.stock ?? 0;
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <Thumb
                            src={p.images?.desktop?.[0]}
                            alt={p.name}
                            className="w-9 h-9"
                            rounded="rounded-lg"
                          />
                          <div className="min-w-0">
                            <p className="cell-strong truncate max-w-60 text-[13px]">
                              {p.name}
                            </p>
                            <span className="cell-sub truncate max-w-60 text-slate-400 dark:text-slate-500 text-[11px]">
                              {p.brand || p.material || "Standard"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap font-medium text-(--ink)">
                        {formatCurrency(effective)}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <span
                          className={`cell-strong ${
                            stock === 0
                              ? "text-red-600 dark:text-red-400"
                              : stock < 5
                                ? "text-amber-600 dark:text-amber-400"
                                : ""
                          }`}
                        >
                          {stock}
                        </span>
                      </td>
                      <td>
                        {p.isActive !== false ? (
                          <span className="meta-chip meta-chip-success">
                            Active
                          </span>
                        ) : (
                          <span className="meta-chip">Hidden</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-10 text-center">
              <p className="font-display text-lg text-(--ink-muted)">
                No products in this collection
              </p>
              <p className="mt-1.5 text-[12.5px] text-(--ink-faint)">
                Assign products to this collection from the Products page or using the bulk selection bar.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollectionProductsModal;