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
                  <tr key={user._id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="avatar w-8 h-8 overflow-hidden">
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
                          <p className="cell-strong truncate max-w-45">
                            {user.name}
                          </p>
                          <span className="cell-sub font-mono">
                            {String(user._id).slice(-8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="truncate max-w-52.5 text-(--ink)">
                        {user.email}
                      </p>
                      <span className="cell-sub">{user.phone || "—"}</span>
                    </td>
                    <td>
                      <span className="badge badge-neutral">
                        {GENDER_LABEL[user.gender] || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(user)}
                          title="Edit customer"
                          aria-label={`Edit ${user.name}`}
                          className="icon-btn icon-btn-edit"
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(user)}
                          title="Delete customer"
                          aria-label={`Delete ${user.name}`}
                          className="icon-btn icon-btn-delete"
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
