import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAddresses } from "../../features/addresses/addressesSlice";
import AddressForm from "./AddressForm";
import { MapPinIcon, PlusIcon, CheckIcon, SpinnerIcon } from "../common/Icons";

/** Saved addresses me se select karne ka UI + add-new form toggle */
export default function AddressPicker({ selected, onSelect }) {
  const dispatch = useDispatch();
  const { addresses, loading } = useSelector((s) => s.addresses);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  // Default address auto-select
  useEffect(() => {
    if (!selected && addresses.length) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      onSelect(def._id);
    }
  }, [addresses, selected, onSelect]);

  if (showForm) {
    return (
      <AddressForm
        onSaved={(addr) => {
          setShowForm(false);
          onSelect(addr._id);
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold">
          <span style={{ color: "var(--accent)" }}>1.</span> Shipping Address
        </h2>
        <button
          className="btn btn-outline py-2! text-[11px]!"
          onClick={() => setShowForm(true)}
        >
          <PlusIcon size={13} /> Add New
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <SpinnerIcon size={22} style={{ color: "var(--accent)" }} />
        </div>
      ) : addresses.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((addr) => (
            <button
              key={addr._id}
              className="card p-4 text-left transition-all"
              style={{
                borderColor:
                  selected === addr._id ? "var(--accent)" : "var(--border)",
                borderWidth: selected === addr._id ? 2 : 1,
              }}
              onClick={() => onSelect(addr._id)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold">{addr.full_name}</p>
                {selected === addr._id && (
                  <CheckIcon size={16} style={{ color: "var(--accent)" }} />
                )}
              </div>
              <p
                className="mt-1 flex items-center gap-1 text-xs"
                style={{ color: "var(--ink-muted)" }}
              >
                <MapPinIcon size={12} /> {addr.phone}
              </p>
              <p
                className="mt-1.5 text-sm leading-relaxed"
                style={{ color: "var(--ink-soft)" }}
              >
                {addr.street}, {addr.city}, {addr.state} — {addr.pincode}
              </p>
              {addr.is_default && (
                <span
                  className="eyebrow mt-2 inline-block"
                  style={{ fontSize: 10 }}
                >
                  Default
                </span>
              )}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
          No addresses yet — add one to continue.
        </p>
      )}
    </div>
  );
}
