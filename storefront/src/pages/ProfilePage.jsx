import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, logoutUser } from "../features/auth/authSlice";
import {
  fetchAddresses,
  deleteAddress,
} from "../features/addresses/addressesSlice";
import { pushToast } from "../features/ui/uiSlice";
import AddressForm from "../components/account/AddressForm";
import { MapPinIcon, TrashIcon, LogoutIcon } from "../components/common/Icons";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { addresses } = useSelector((s) => s.addresses);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    // Purane users jinka gender invalid value me saved hai unke liye fallback
    gender:
      user?.gender === "male" || user?.gender === "female"
        ? user.gender
        : "male",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split("T")[0] : "",
  });
  const [saving, setSaving] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Empty DOB ko backend ke liye null banao (SignupPage jaisa hi pattern)
    const result = await dispatch(
      updateProfile({ ...form, dateOfBirth: form.dateOfBirth || null }),
    );
    setSaving(false);
    if (updateProfile.fulfilled.match(result)) {
      dispatch(pushToast("Profile updated"));
    } else {
      dispatch(pushToast(result.payload || "Update failed", "error"));
    }
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(pushToast("Logged out", "info"));
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="eyebrow mb-2">My Account</p>
      <h1 className="section-title mb-8">Profile</h1>

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* Profile details */}
        <form onSubmit={handleSave} className="card space-y-4 p-6">
          <p className="eyebrow">Personal Details</p>
          <div>
            <label className="field-label">Full Name</label>
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input
              className="field"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Phone</label>
            <input
              className="field"
              maxLength={10}
              placeholder="10-digit mobile"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Gender</label>
            <select
              className="field"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="field-label">Date of Birth</label>
            <input
              className="field"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={form.dateOfBirth}
              onChange={(e) =>
                setForm({ ...form, dateOfBirth: e.target.value })
              }
            />
          </div>
          <button
            className="btn btn-accent w-full"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 text-sm font-semibold"
            style={{ color: "var(--danger)" }}
            onClick={handleLogout}
          >
            <LogoutIcon size={15} /> Logout
          </button>
        </form>

        {/* Addresses */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="eyebrow">Saved Addresses</p>
            <button
              className="btn btn-outline py-2! text-[11px]!"
              onClick={() => setShowAddressForm((v) => !v)}
            >
              {showAddressForm ? "Close" : "Add New"}
            </button>
          </div>

          {showAddressForm && (
            <div className="mb-4">
              <AddressForm onSaved={() => setShowAddressForm(false)} />
            </div>
          )}

          {!addresses.length && !showAddressForm && (
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              No saved addresses yet.
            </p>
          )}

          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr._id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {addr.full_name}{" "}
                      {addr.is_default && (
                        <span className="eyebrow ml-1" style={{ fontSize: 10 }}>
                          Default
                        </span>
                      )}
                    </p>
                    <p
                      className="mt-1 flex gap-1.5 text-sm leading-relaxed"
                      style={{ color: "var(--ink-soft)" }}
                    >
                      <MapPinIcon size={15} className="mt-0.5 shrink-0" />
                      {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--ink-muted)" }}
                    >
                      Phone: {addr.phone}
                    </p>
                  </div>
                  <button
                    className="icon-btn h-8! w-8!"
                    aria-label="Delete address"
                    onClick={async () => {
                      await dispatch(deleteAddress(addr._id));
                      dispatch(pushToast("Address deleted", "info"));
                    }}
                  >
                    <TrashIcon size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
