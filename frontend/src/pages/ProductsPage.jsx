import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  fetchProductsByCategory,
  setSelectedCategory,
} from "../features/products/productsSlice";
import { fetchCategories } from "../features/categories/categoriesSlice";
import { exportAllProductsToExcel } from "../utils/exportProductToExcel";
import { toastInfo } from "../features/ui/uiSlice";

import PageHeader from "../components/common/PageHeader";
import ProductTable from "../components/products/ProductTable";
import ProductModal from "../components/products/ProductModal";
import BulkProductDrawer from "../components/products/BulkProductDrawer";
import SearchInput from "../components/common/SearchInput";
import SegmentedFilter from "../components/common/SegmentedFilter";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { formatCurrency } from "../utils/format";
import { DownloadIcon, LayersIcon, PlusIcon } from "../components/common/Icon";

const LOW_STOCK = 5;

const ProductsPage = () => {
  const dispatch = useDispatch();
  const { products, loading, error, selectedCategoryId } = useSelector(
    (state) => state.products,
  );
  const { categories, loading: catLoading } = useSelector(
    (state) => state.categories,
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [stockFilter, setStockFilter] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (categories.length === 0) dispatch(fetchCategories());
  }, [dispatch, categories.length]);

  useEffect(() => {
    if (selectedCategoryId) {
      if (debouncedSearch) {
        dispatch(
          fetchProducts({
            categoryId: selectedCategoryId,
            search: debouncedSearch,
            limit: 100,
          }),
        );
      } else {
        dispatch(fetchProductsByCategory(selectedCategoryId));
      }
    } else {
      dispatch(
        fetchProducts({
          search: debouncedSearch || undefined,
          limit: 100,
        }),
      );
    }
  }, [dispatch, selectedCategoryId, debouncedSearch]);

  const getCategoryName = (id) => {
    if (typeof id === "object" && id?.name) return id.name;
    const catId = typeof id === "object" ? id?._id : id;
    const cat = categories.find((c) => c._id === catId);
    return cat ? cat.name : "Unknown Category";
  };

  const stats = useMemo(() => {
    let inventoryValue = 0;
    let low = 0;
    let out = 0;
    let hidden = 0;
    products.forEach((p) => {
      const stock = Number(p.stock) || 0;
      inventoryValue += (Number(p.discountPrice || p.price) || 0) * stock;
      if (stock === 0) out += 1;
      else if (stock <= LOW_STOCK) low += 1;
      if (!p.isActive) hidden += 1;
    });
    return { inventoryValue, low, out, hidden };
  }, [products]);

  const list = useMemo(() => {
    if (!stockFilter) return products;
    return products.filter((p) => {
      const stock = Number(p.stock) || 0;
      if (stockFilter === "low") return stock > 0 && stock <= LOW_STOCK;
      if (stockFilter === "out") return stock === 0;
      if (stockFilter === "hidden") return !p.isActive;
      return true;
    });
  }, [products, stockFilter]);

  const handleExportAll = () => {
    if (!products.length) {
      dispatch(toastInfo("Nothing to export", "No products match this view."));
      return;
    }
    exportAllProductsToExcel(products, getCategoryName);
  };

  const openAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Products"
        subtitle="Your bag catalog — pricing, stock and visibility on the storefront."
        meta={
          <>
            <span className="meta-chip">
              <b>{products.length}</b> in view
            </span>
            <span className="meta-chip meta-chip-success">
              <b>{formatCurrency(stats.inventoryValue, { compact: true })}</b>{" "}
              inventory value
            </span>
            {stats.low > 0 && (
              <span className="meta-chip meta-chip-warning">
                <b>{stats.low}</b> low stock
              </span>
            )}
            {stats.out > 0 && (
              <span className="meta-chip meta-chip-danger">
                <b>{stats.out}</b> out of stock
              </span>
            )}
          </>
        }
        actions={
          <>
            <button onClick={handleExportAll} className="btn btn-export">
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setIsBulkOpen(true)}
              className="btn btn-secondary"
            >
              <LayersIcon className="w-4 h-4" />
              Bulk add
            </button>
            <button onClick={openAdd} className="btn btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add product
            </button>
          </>
        }
      />

      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products…"
        />
        <select
          value={selectedCategoryId || ""}
          onChange={(e) =>
            dispatch(
              setSelectedCategory(e.target.value === "" ? null : e.target.value),
            )
          }
          className="admin-select"
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
        <SegmentedFilter
          value={stockFilter}
          onChange={setStockFilter}
          options={[
            { value: null, label: "All", count: products.length },
            { value: "low", label: "Low", count: stats.low },
            { value: "out", label: "Out", count: stats.out },
            { value: "hidden", label: "Hidden", count: stats.hidden },
          ]}
        />
      </div>

      <ErrorBanner
        message={error}
        onRetry={() => dispatch(fetchProducts({ limit: 100 }))}
      />

      {(loading || catLoading) && products.length === 0 ? (
        <TableSkeleton rows={8} columns={7} hasThumb />
      ) : (
        <ProductTable
          products={list}
          onCreate={openAdd}
          onEdit={(p) => {
            setEditData(p);
            setIsModalOpen(true);
          }}
        />
      )}

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
        editData={editData}
      />

      {/* Conditional render — har baar fresh state ke saath mount hota hai */}
      {isBulkOpen && (
        <BulkProductDrawer
          isOpen
          onClose={() => setIsBulkOpen(false)}
        />
      )}
    </div>
  );
};

export default ProductsPage;
