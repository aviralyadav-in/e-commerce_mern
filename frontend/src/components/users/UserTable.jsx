import { useState } from "react";
import { useDispatch } from "react-redux";
import { deleteUser } from "../../features/users/usersSlice";
import useTableControls from "../../hooks/useTableControls";
import ConfirmDialog from "../common/ConfirmDialog";
import EmptyState from "../common/EmptyState";
import Pagination from "../common/Pagination";
import SortableTh from "../common/SortableTh";
import { formatDate, initials } from "../../utils/format";
import { getAssetUrl } from "../../utils/assetUrl";
import { PencilIcon, PlusIcon, TrashIcon, UsersIcon } from "../common/Icon";

const GENDER_LABEL = {
  male: "Male",
  female: "Female",
};

const ACCESSORS = {
  name: (u) => u.name || "",
  email: (u) => u.email || "",
  gender: (u) => GENDER_LABEL[u.gender] || "",
  joined: (u) => (u.createdAt ? new Date(u.createdAt).getTime() : null),
};

const UserTable = ({ users, onEdit, onCreate }) => {
  const dispatch = useDispatch();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const table = useTableControls(users, {
    accessors: ACCESSORS,
    initialSort: { key: "joined", dir: "desc" },
    pageSize: 10,
  });

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    dispatch(deleteUser(deleteTarget._id));
    setDeleteTarget(null);
  };

  return (
    <>
      <div className="admin-table-wrap">
        <div className="overflow-x-auto admin-scroll">
          <table className="admin-table min-w-205">
            <thead>
              <tr>
                <SortableTh
                  label="Customer"
                  sortKey="name"
                  sort={table.sort}
                  onSort={table.toggleSort}
                />
                <SortableTh
                  label="Contact"
                  sortKey="email"
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
                table.rows.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-50/80 transition-colors">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 text-white font-bold text-[11.5px] flex items-center justify-center shrink-0 shadow-xs ring-2 ring-indigo-100 overflow-hidden">
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
                          <p className="cell-strong truncate max-w-45 text-[13px]">
                            {user.name}
                          </p>
                          <span className="cell-sub font-mono text-slate-400 text-[11px]">
                            ID: {String(user._id).slice(-8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="cell-strong text-slate-800 text-[13px]">{user.email}</p>
                      <span className="cell-sub text-slate-400 text-[11px]">{user.phone || "No phone added"}</span>
                    </td>
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
                        <span className="text-slate-400 text-[12px]">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-slate-500 text-[12.5px]">
                      {user.createdAt ? formatDate(user.createdAt) : "—"}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(user)}
                          className="icon-btn icon-btn-edit"
                          title="Edit user"
                          aria-label={`Edit ${user.name}`}
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="icon-btn icon-btn-delete"
                          title="Delete user"
                          aria-label={`Delete ${user.name}`}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="empty-cell">
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
            ? `“${deleteTarget.name}” will be deleted along with their cart and wishlist. This cannot be undone.`
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
