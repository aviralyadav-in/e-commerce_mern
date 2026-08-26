import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers } from "../features/users/usersSlice";
import { exportAllUsersToExcel } from "../utils/exportProductToExcel";
import { toastInfo } from "../features/ui/uiSlice";

import PageHeader from "../components/common/PageHeader";
import UserTable from "../components/users/UserTable";
import UserModal from "../components/users/UserModal";
import SearchInput from "../components/common/SearchInput";
import ErrorBanner from "../components/common/ErrorBanner";
import TableSkeleton from "../components/common/TableSkeleton";
import { DownloadIcon, PlusIcon } from "../components/common/Icon";

/** Registrations in the last 30 days, for the header chip. */
const isRecent = (createdAt) => {
  if (!createdAt) return false;
  const then = new Date(createdAt).getTime();
  if (Number.isNaN(then)) return false;
  return Date.now() - then < 30 * 24 * 60 * 60 * 1000;
};

const UsersPage = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const newThisMonth = useMemo(
    () => users.filter((u) => isRecent(u.createdAt)).length,
    [users],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        String(u.name || "").toLowerCase().includes(q) ||
        String(u.email || "").toLowerCase().includes(q) ||
        String(u.phone || "").toLowerCase().includes(q),
    );
  }, [users, search]);

  const openAdd = () => {
    setEditData(null);
    setIsModalOpen(true);
  };

  const handleExport = () => {
    if (!users.length) {
      dispatch(toastInfo("Nothing to export", "No customers registered yet."));
      return;
    }
    exportAllUsersToExcel(users);
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Customers"
        subtitle="Everyone registered on your storefront."
        meta={
          <>
            <span className="meta-chip">
              <b>{users.length}</b> registered
            </span>
            <span className="meta-chip meta-chip-success">
              <b>{newThisMonth}</b> joined in the last 30 days
            </span>
          </>
        }
        actions={
          <>
            <button onClick={handleExport} className="btn btn-export">
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
            <button onClick={openAdd} className="btn btn-primary">
              <PlusIcon className="w-4 h-4" />
              Add customer
            </button>
          </>
        }
      />

      <div className="admin-toolbar mb-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, email or phone…"
        />
      </div>

      {!isModalOpen && (
        <ErrorBanner message={error} onRetry={() => dispatch(fetchUsers())} />
      )}

      {loading && users.length === 0 ? (
        <TableSkeleton rows={8} columns={5} hasThumb />
      ) : (
        <UserTable
          users={filtered}
          onCreate={openAdd}
          onEdit={(u) => {
            setEditData(u);
            setIsModalOpen(true);
          }}
        />
      )}

      <UserModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditData(null);
        }}
        editData={editData}
      />
    </div>
  );
};

export default UsersPage;
