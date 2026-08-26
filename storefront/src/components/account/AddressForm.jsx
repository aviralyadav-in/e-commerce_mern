import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addAddress } from "../../features/addresses/addressesSlice";
import { pushToast } from "../../features/ui/uiSlice";

const EMPTY = {
  full_name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
  is_default: false,
};

/** Naya shipping address add karne ka form */
export default function AddressForm({ onSaved, onCancel }) {
  const dispatch = useDispatch();
  // Receiver (delivery) ki details profile se pre-fill hoti hain —
  // gift ya kisi aur ke address ke liye user inhe edit kar sakta hai.
  const user = useSelector((s) => s.auth.user);
  const receiverDefaults = {
    ...EMPTY,
    full_name: user?.name || "",
    phone: user?.phone || "",
  };
  const [form, setForm] = useState(receiverDefaults);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key) => (e) =>
    setForm({
      ...form,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });

  const validate = () => {
    const errs = {};
    if (form.full_name.trim().length < 2)
      errs.full_name = "Receiver name required";
    if (!/^[0-9]{10}$/.test(form.phone))
      errs.phone = "Valid 10-digit phone required";
    if (form.street.trim().length < 3)
      errs.street = "Street / House No. required";
    if (!form.city.trim()) errs.city = "City required";
    if (!form.state.trim()) errs.state = "State required";
    if (!/^[0-9]{6}$/.test(form.pincode))
      errs.pincode = "Valid 6-digit pincode required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    const result = await dispatch(addAddress(form));
    setSaving(false);
    if (addAddress.fulfilled.match(result)) {
      dispatch(pushToast("Address saved"));
      setForm(receiverDefaults);
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
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      <p className="eyebrow">Add New Address</p>
      <p className="-mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
        Receiver's name &amp; phone for delivery — pre-filled from your
        profile. Sending to someone else? Just edit these.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Full Name</label>
          <input
            className="field"
            value={form.full_name}
            onChange={set("full_name")}
          />
          {err("full_name")}
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input
            className="field"
            maxLength={10}
            value={form.phone}
            onChange={set("phone")}
          />
          {err("phone")}
        </div>
      </div>
      <div>
        <label className="field-label">Street / House No.</label>
        <input className="field" value={form.street} onChange={set("street")} />
        {err("street")}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="field-label">City</label>
          <input className="field" value={form.city} onChange={set("city")} />
          {err("city")}
        </div>
        <div>
          <label className="field-label">State</label>
          <input className="field" value={form.state} onChange={set("state")} />
          {err("state")}
        </div>
        <div>
          <label className="field-label">Pincode</label>
          <input
            className="field"
            maxLength={6}
            value={form.pincode}
            onChange={set("pincode")}
          />
          {err("pincode")}
        </div>
      </div>
      <label
        className="flex items-center gap-2 text-sm"
        style={{ color: "var(--ink-soft)" }}
      >
        <input
          type="checkbox"
          checked={form.is_default}
          onChange={set("is_default")}
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
          {saving ? "Saving…" : "Save Address"}
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
