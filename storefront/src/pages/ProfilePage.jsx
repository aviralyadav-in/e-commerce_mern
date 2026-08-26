import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  updateProfile,
  logoutUser,
  uploadAvatar,
  removeAvatar,
} from "../features/auth/authSlice";
import {
  fetchAddresses,
  deleteAddress,
  setDefaultAddress,
} from "../features/addresses/addressesSlice";
import { pushToast } from "../features/ui/uiSlice";
import { getAssetUrl } from "../utils/assetUrl";
import AddressForm from "../components/account/AddressForm";
import { ADDRESS_TYPE_LABELS } from "../utils/address";
import {
  MapPinIcon,
  TrashIcon,
  LogoutIcon,
  PencilIcon,
  StarIcon,
  SpinnerIcon,
} from "../components/common/Icons";

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
  const [editingAddress, setEditingAddress] = useState(null);

  /* Add / Edit / Default / Delete — saare address actions */
  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setShowAddressForm(true);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setShowAddressForm(true);
  };

  // 🆕 Profile photo — file select hote hi turant upload ho jaati hai
  const avatarInputRef = useRef(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // same file dobara select kar sakein
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      dispatch(pushToast("Only JPG, PNG or WEBP images allowed", "error"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      dispatch(pushToast("Photo must be under 5MB", "error"));
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("avatar", file);
    const result = await dispatch(uploadAvatar(formData));
    setUploadingAvatar(false);
    if (uploadAvatar.fulfilled.match(result)) {
      dispatch(pushToast("Profile photo updated"));
    } else {
      dispatch(pushToast(result.payload || "Upload failed", "error"));
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadingAvatar(true);
    const result = await dispatch(removeAvatar());
    setUploadingAvatar(false);
    if (removeAvatar.fulfilled.match(result)) {
      dispatch(pushToast("Profile photo removed", "info"));
    } else {
      dispatch(pushToast(result.payload || "Could not remove photo", "error"));
    }
  };

  const handleSetDefault = async (addr) => {
    const result = await dispatch(setDefaultAddress(addr._id));
    if (setDefaultAddress.fulfilled.match(result)) {
      dispatch(pushToast("Default address updated"));
    } else {
      dispatch(pushToast(result.payload || "Could not update", "error"));
    }
  };

  const handleDeleteAddress = async (addr) => {
    const result = await dispatch(deleteAddress(addr._id));
    if (deleteAddress.fulfilled.match(result)) {
      dispatch(pushToast("Address deleted", "info"));
    } else {
      dispatch(
        pushToast(result.payload || "Could not delete address", "error"),
      );
    }
  };

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

          {/* 🆕 Profile photo */}
          <div className="flex items-center gap-4 pb-3 mb-1 border-b" style={{ borderColor: "var(--border)" }}>
            {uploadingAvatar ? (
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed"
                style={{ borderColor: "var(--accent)" }}
              >
                <SpinnerIcon size={20} style={{ color: "var(--accent)" }} />
              </span>
            ) : user?.avatar ? (
              <img
                src={getAssetUrl(user.avatar)}
                alt="Profile"
                className="h-16 w-16 rounded-full border object-cover"
                style={{ borderColor: "var(--border-strong)" }}
              />
            ) : (
              <span
                className="font-display flex h-16 w-16 items-center justify-center rounded-full text-xl font-medium"
                style={{ background: "var(--accent)", color: "#101d1d" }}
              >
                {(user?.name || "N").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="space-y-1.5">
              <input
                ref={avatarInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  className="btn btn-outline py-1.5! text-[11px]!"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  Change photo
                </button>
                {user?.avatar && (
                  <button
                    type="button"
                    className="text-[11px] font-semibold underline"
                    style={{ color: "var(--danger)" }}
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <p className="text-[10.5px]" style={{ color: "var(--ink-muted)" }}>
                JPG, PNG or WEBP · max 5MB
              </p>
            </div>
          </div>

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
              type="tel"
              inputMode="numeric"
              maxLength={10}
              pattern="[6-9][0-9]{9}"
              title="Valid Indian mobile number (10 digits, starts with 6-9)"
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
              onClick={() =>
                showAddressForm ? closeAddressForm() : openAddAddress()
              }
            >
              {showAddressForm ? "Close" : "Add New"}
            </button>
          </div>

          {showAddressForm && (
            <div className="mb-4">
              <AddressForm
                key={editingAddress?._id || "new"}
                embedded
                existingAddress={editingAddress}
                onSaved={closeAddressForm}
                onCancel={closeAddressForm}
              />
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
                      {addr.fullName || `${addr.firstName} ${addr.lastName}`}{" "}
                      {(addr.addressNickname ||
                        ADDRESS_TYPE_LABELS[addr.addressType]) && (
                        <span
                          className="eyebrow ml-1 align-middle"
                          style={{ fontSize: 10 }}
                        >
                          {addr.addressNickname ||
                            ADDRESS_TYPE_LABELS[addr.addressType]}
                        </span>
                      )}
                      {addr.isDefault && (
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
                      {[addr.addressLine1, addr.addressLine2, addr.landmark]
                        .filter(Boolean)
                        .join(", ")}
                      , {addr.city}, {addr.state} — {addr.zipCode}
                    </p>
                    <p
                      className="mt-1 text-xs"
                      style={{ color: "var(--ink-muted)" }}
                    >
                      Phone: {addr.phone}
                    </p>
                  </div>
                  {/* Card actions — default / edit / delete */}
                  <div className="flex shrink-0 items-center gap-1.5">
                    {!addr.isDefault && (
                      <button
                        className="icon-btn h-8! w-8!"
                        aria-label="Set as default address"
                        title="Set as default"
                        onClick={() => handleSetDefault(addr)}
                      >
                        <StarIcon size={15} />
                      </button>
                    )}
                    <button
                      className="icon-btn h-8! w-8!"
                      aria-label="Edit address"
                      title="Edit"
                      onClick={() => openEditAddress(addr)}
                    >
                      <PencilIcon size={15} />
                    </button>
                    <button
                      className="icon-btn h-8! w-8!"
                      aria-label="Delete address"
                      title="Delete"
                      onClick={() => handleDeleteAddress(addr)}
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
