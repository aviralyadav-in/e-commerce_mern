import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addAddress,
  updateAddress,
} from "../../features/addresses/addressesSlice";
import { pushToast } from "../../features/ui/uiSlice";
import { ADDRESS_TYPE_LABELS } from "../../utils/address";

/* Backend schema ke regex — client-side validation bhi same rules par */
const PHONE_RE = /^[6-9]\d{9}$/;
const PIN_RE = /^[1-9][0-9]{5}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

/* Naye schema ke saare editable fields */
const EMPTY = {
  firstName: "",
  lastName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  zipCode: "",
  addressType: "HOME",
  addressNickname: "",
  isDefault: false,
};

/** Profile ke naam/phone/email se receiver details pre-fill */
function buildDefaults(user) {
  const parts = (user?.name || "").trim().split(/\s+/);
  return {
    ...EMPTY,
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
    phone: user?.phone || "",
    email: user?.email || "",
  };
}

/** Edit mode: saved doc se sirf editable fields uthao (virtuals/_id chhod kar) */
function fromAddress(addr) {
  const out = { ...EMPTY };
  Object.keys(EMPTY).forEach((key) => {
    if (addr[key] !== undefined && addr[key] !== null) out[key] = addr[key];
  });
  return out;
}

/**
 * Address add/edit form — naye schema ke saare fields.
 * Props: existingAddress (pass karo toh edit mode), embedded (card styling off),
 * onSaved(savedAddress), onCancel()
 */
export default function AddressForm({
  onSaved,
  onCancel,
  existingAddress = null,
  embedded = false,
}) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const isEdit = Boolean(existingAddress?._id);

  const [form, setForm] = useState(() =>
    isEdit ? fromAddress(existingAddress) : buildDefaults(user),
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) =>
    setForm({
      ...form,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

  const validate = () => {
    const errs = {};
    if (!form.firstName.trim()) errs.firstName = "First name required";
    if (!form.lastName.trim()) errs.lastName = "Last name required";
    if (!PHONE_RE.test(form.phone))
      errs.phone = "Valid 10-digit Indian mobile required";
    if (form.alternatePhone && !PHONE_RE.test(form.alternatePhone))
      errs.alternatePhone = "Valid 10-digit mobile required";
    if (form.email && !EMAIL_RE.test(form.email))
      errs.email = "Enter a valid email";
    if (form.addressLine1.trim().length < 3)
      errs.addressLine1 = "House no. / street required";
    if (!form.city.trim()) errs.city = "City required";
    if (!form.state.trim()) errs.state = "State required";
    if (!PIN_RE.test(form.zipCode))
      errs.zipCode = "Valid 6-digit pincode required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const result = isEdit
      ? await dispatch(updateAddress({ id: existingAddress._id, data: form }))
      : await dispatch(addAddress(form));
    setSaving(false);

    if (result.meta.requestStatus === "fulfilled") {
      dispatch(pushToast(isEdit ? "Address updated" : "Address saved"));
      onSaved?.(result.payload);
    } else {
      dispatch(pushToast(result.payload || "Could not save address", "error"));
    }
  };

  const err = (key) =>
    errors[key] && (
      <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
        {errors[key]}
      </p>
    );

  return (
    <form
      onSubmit={handleSubmit}
      className={embedded ? "space-y-4" : "card space-y-4 p-5"}
    >
      <p className="eyebrow">{isEdit ? "Edit Address" : "Add New Address"}</p>
      <p className="-mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
        Receiver's name &amp; phone for delivery — pre-filled from your
        profile. Sending to someone else? Just edit these.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">First Name *</label>
          <input
            className="field"
            maxLength={50}
            value={form.firstName}
            onChange={set("firstName")}
          />
          {err("firstName")}
        </div>
        <div>
          <label className="field-label">Last Name *</label>
          <input
            className="field"
            maxLength={50}
            value={form.lastName}
            onChange={set("lastName")}
          />
          {err("lastName")}
        </div>
        <div>
          <label className="field-label">Mobile Number *</label>
          <input
            className="field"
            maxLength={10}
            placeholder="10-digit mobile"
            value={form.phone}
            onChange={set("phone")}
          />
          {err("phone")}
        </div>
        <div>
          <label className="field-label">Alternate Number</label>
          <input
            className="field"
            maxLength={10}
            placeholder="Optional"
            value={form.alternatePhone}
            onChange={set("alternatePhone")}
          />
          {err("alternatePhone")}
        </div>
      </div>

      <div>
        <label className="field-label">Email</label>
        <input
          className="field"
          type="email"
          placeholder="Optional — delivery updates ke liye"
          value={form.email}
          onChange={set("email")}
        />
        {err("email")}
      </div>

      <div>
        <label className="field-label">Address Line 1 *</label>
        <textarea
          rows={2}
          className="field resize-none"
          placeholder="House no., building, apartment"
          value={form.addressLine1}
          onChange={set("addressLine1")}
        />
        {err("addressLine1")}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Address Line 2</label>
          <input
            className="field"
            placeholder="Area, street, sector (optional)"
            value={form.addressLine2}
            onChange={set("addressLine2")}
          />
        </div>
        <div>
          <label className="field-label">Landmark</label>
          <input
            className="field"
            placeholder="e.g. Near Apollo Hospital (optional)"
            value={form.landmark}
            onChange={set("landmark")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label">City *</label>
          <input
            className="field"
            value={form.city}
            onChange={set("city")}
          />
          {err("city")}
        </div>
        <div>
          <label className="field-label">State *</label>
          <input
            className="field"
            value={form.state}
            onChange={set("state")}
          />
          {err("state")}
        </div>
        <div>
          <label className="field-label">Pincode *</label>
          <input
            className="field"
            maxLength={6}
            value={form.zipCode}
            onChange={set("zipCode")}
          />
          {err("zipCode")}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Address Type</label>
          <select
            className="field"
            value={form.addressType}
            onChange={set("addressType")}
          >
            {Object.entries(ADDRESS_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Nickname</label>
          <input
            className="field"
            placeholder='e.g. "Ghar", "Office"'
            maxLength={30}
            value={form.addressNickname}
            onChange={set("addressNickname")}
          />
        </div>
      </div>

      <label
        className="flex items-center gap-2 text-sm"
        style={{ color: "var(--ink-soft)" }}
      >
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={set("isDefault")}
          className="h-4 w-4 accent-(--accent)"
        />
        Set as default address
      </label>

      <div className="flex gap-2">
        <button
          className="btn btn-accent flex-1"
          type="submit"
          disabled={saving}
        >
          {saving ? "Saving…" : isEdit ? "Update Address" : "Save Address"}
        </button>
        {onCancel && (
          <button className="btn btn-outline" type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
