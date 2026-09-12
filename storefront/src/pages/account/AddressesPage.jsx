import React, { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Pencil, Home, Briefcase, Star, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { cn, pluralize } from "../../lib/utils";
import usePageTitle from "../../hooks/usePageTitle";
import EmptyState from "../../components/common/EmptyState";
import FormField from "../../components/common/FormField";
import { Spinner } from "../../components/common/PageLoader";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

const ADDRESS_TYPES = [
  { value: "HOME", label: "Home", icon: Home },
  { value: "WORK", label: "Work", icon: Briefcase },
  { value: "OTHER", label: "Other", icon: MapPin },
];

const EMPTY_FORM = {
  firstName: "",
  lastName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  zipCode: "",
  addressType: "HOME",
  isDefault: false,
};

function buildFormState(addr) {
  if (!addr) return EMPTY_FORM;
  return {
    firstName: addr.firstName || "",
    lastName: addr.lastName || "",
    phone: addr.phone || "",
    addressLine1: addr.addressLine1 || "",
    addressLine2: addr.addressLine2 || "",
    landmark: addr.landmark || "",
    city: addr.city || "",
    state: addr.state || "",
    zipCode: addr.zipCode || "",
    addressType: addr.addressType || "HOME",
    isDefault: addr.isDefault || false,
  };
}

function typeMeta(type) {
  return ADDRESS_TYPES.find((t) => t.value === type) || ADDRESS_TYPES[0];
}

/* ------------------------------------------------------------------ */
/* Address form (state initialised from the address being edited; the  */
/* parent remounts it via `key` so no effect-driven syncing is needed) */
/* ------------------------------------------------------------------ */
function AddressForm({ initialAddress, submitting, serverError, onSubmit, onCancel }) {
  const [formData, setFormData] = useState(() => buildFormState(initialAddress));
  const [fieldErrors, setFieldErrors] = useState({});

  const setField = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      errors.phone = "Please enter a valid 10-digit Indian mobile number";
    }
    if (!/^[1-9][0-9]{5}$/.test(formData.zipCode)) {
      errors.zipCode = "Please enter a valid 6-digit Indian Pincode";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="First name" required>
          <input
            type="text"
            required
            autoComplete="given-name"
            value={formData.firstName}
            onChange={setField("firstName")}
            className="input-luxury"
          />
        </FormField>
        <FormField label="Last name" required>
          <input
            type="text"
            required
            autoComplete="family-name"
            value={formData.lastName}
            onChange={setField("lastName")}
            className="input-luxury"
          />
        </FormField>
      </div>

      <FormField label="Mobile number" required error={fieldErrors.phone} hint="10-digit number for delivery updates">
        <input
          type="tel"
          required
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={10}
          placeholder="98765 43210"
          value={formData.phone}
          onChange={setField("phone")}
          className="input-luxury"
        />
      </FormField>

      <FormField label="Address line 1" required>
        <input
          type="text"
          required
          autoComplete="address-line1"
          placeholder="Flat / house number, building, street"
          value={formData.addressLine1}
          onChange={setField("addressLine1")}
          className="input-luxury"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Address line 2">
          <input
            type="text"
            autoComplete="address-line2"
            placeholder="Area, locality"
            value={formData.addressLine2}
            onChange={setField("addressLine2")}
            className="input-luxury"
          />
        </FormField>
        <FormField label="Landmark">
          <input
            type="text"
            placeholder="Near…"
            value={formData.landmark}
            onChange={setField("landmark")}
            className="input-luxury"
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="City" required>
          <input
            type="text"
            required
            autoComplete="address-level2"
            value={formData.city}
            onChange={setField("city")}
            className="input-luxury"
          />
        </FormField>
        <FormField label="State" required>
          <input
            type="text"
            required
            autoComplete="address-level1"
            value={formData.state}
            onChange={setField("state")}
            className="input-luxury"
          />
        </FormField>
        <FormField label="Pincode" required error={fieldErrors.zipCode}>
          <input
            type="text"
            required
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={formData.zipCode}
            onChange={setField("zipCode")}
            className="input-luxury"
          />
        </FormField>
      </div>

      <div>
        <span id="address-type-label" className="label-luxury">
          Address type
        </span>
        <div role="group" aria-labelledby="address-type-label" className="flex flex-wrap gap-2">
          {ADDRESS_TYPES.map((t) => {
            const Icon = t.icon;
            const selected = formData.addressType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFormData((prev) => ({ ...prev, addressType: t.value }))}
                className={cn("chip h-10", selected && "chip-active")}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3 text-small text-foreground">
        <input
          type="checkbox"
          checked={formData.isDefault}
          onChange={setField("isDefault")}
          className="size-4 shrink-0 accent-champagne"
        />
        <span>Use as my default shipping address</span>
      </label>

      {serverError && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-small text-danger">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{serverError}</span>
        </p>
      )}

      <div className="hairline flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={submitting} className="btn btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} aria-busy={submitting || undefined} className="btn btn-primary">
          {submitting && <Spinner className="size-4" />}
          <span>{submitting ? "Saving" : initialAddress ? "Save changes" : "Save address"}</span>
        </button>
      </div>
    </form>
  );
}

function AddressSkeleton() {
  return (
    <li className="surface-card p-5" aria-hidden="true">
      <div className="flex gap-2">
        <div className="skeleton-shimmer h-5 w-16 rounded-full" />
        <div className="skeleton-shimmer h-5 w-16 rounded-full" />
      </div>
      <div className="skeleton-shimmer mt-4 h-5 w-40 rounded-full" />
      <div className="skeleton-shimmer mt-2 h-3 w-28 rounded-full" />
      <div className="mt-4 space-y-2">
        <div className="skeleton-shimmer h-3 w-full rounded-full" />
        <div className="skeleton-shimmer h-3 w-3/4 rounded-full" />
        <div className="skeleton-shimmer h-3 w-1/2 rounded-full" />
      </div>
      <div className="hairline mt-5 flex gap-2 pt-4">
        <div className="skeleton-shimmer h-9 w-20 rounded-xl" />
        <div className="skeleton-shimmer h-9 w-24 rounded-xl" />
      </div>
    </li>
  );
}

function AddressCard({ address, onEdit, onDelete, onSetDefault, settingDefault }) {
  const meta = typeMeta(address.addressType);
  const TypeIcon = meta.icon;
  return (
    <li
      className={cn(
        "surface-card flex flex-col p-5 transition-colors duration-300",
        address.isDefault && "border-champagne/70"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="pill pill-new">
          <TypeIcon className="size-3" aria-hidden="true" />
          {meta.label}
        </span>
        {address.isDefault && (
          <span className="pill pill-gold">
            <Star className="size-3 fill-current" aria-hidden="true" />
            Default
          </span>
        )}
      </div>

      <h3 className="mt-4 font-sans text-base font-semibold text-foreground">
        {[address.firstName, address.lastName].filter(Boolean).join(" ")}
      </h3>
      {address.phone && <p className="text-small text-ink-muted">{address.phone}</p>}

      <address className="mt-3 text-small not-italic leading-relaxed text-ink-muted">
        <span className="block">{address.addressLine1}</span>
        {address.addressLine2 && <span className="block">{address.addressLine2}</span>}
        {address.landmark && <span className="block">Near {address.landmark}</span>}
        <span className="block text-foreground">
          {address.city}, {address.state} {address.zipCode}
        </span>
      </address>

      <div className="hairline mt-auto flex flex-wrap items-center gap-1 pt-4">
        <button type="button" onClick={onEdit} className="btn btn-ghost btn-sm px-2.5">
          <Pencil aria-hidden="true" />
          <span>Edit</span>
        </button>
        {!address.isDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            disabled={settingDefault}
            aria-busy={settingDefault || undefined}
            className="btn btn-ghost btn-sm px-2.5"
          >
            {settingDefault ? <Spinner className="size-4" /> : <Star aria-hidden="true" />}
            <span>Set default</span>
          </button>
        )}
        <button type="button" onClick={onDelete} className="btn btn-ghost btn-sm ml-auto px-2.5 text-danger hover:text-danger">
          <Trash2 aria-hidden="true" />
          <span>Delete</span>
        </button>
      </div>
    </li>
  );
}

export default function AddressesPage() {
  usePageTitle("Saved addresses");
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const fetchAddresses = async () => {
    try {
      const res = await api.get("/addresses");
      setAddresses(res.data?.addresses || []);
    } catch (err) {
      console.error("Failed to load addresses:", err);
      toast.error("Could not load your addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await api.get("/addresses");
        if (!ignore) setAddresses(res.data?.addresses || []);
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenAdd = () => {
    setEditingAddress(null);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingAddress(addr);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDialogChange = (open) => {
    if (!open && formLoading) return;
    setIsModalOpen(open);
    if (!open) setFormError("");
  };

  const handleSetDefault = async (id) => {
    setSettingDefaultId(id);
    try {
      await api.patch(`/addresses/${id}/default`);
      toast.success("Default shipping address updated");
      fetchAddresses();
    } catch (err) {
      console.error("Set default address error:", err);
      toast.error(err.response?.data?.message || "Could not update the default address");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/addresses/${deleteTarget._id}`);
      toast.success("Address removed");
      setDeleteTarget(null);
      fetchAddresses();
    } catch (err) {
      console.error("Delete address error:", err);
      toast.error(err.response?.data?.message || "Could not remove the address");
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (formData) => {
    setFormError("");
    try {
      setFormLoading(true);
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress._id}`, formData);
        toast.success("Address updated");
      } else {
        await api.post("/addresses", formData);
        toast.success("Address added");
      }
      setIsModalOpen(false);
      fetchAddresses();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save address.");
    } finally {
      setFormLoading(false);
    }
  };

  const sortedAddresses = [...addresses].sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-h3 text-foreground">Saved addresses</h2>
          <p className="mt-1 text-small text-ink-muted" aria-live="polite">
            {loading
              ? "Fetching your address book…"
              : addresses.length === 0
                ? "Save an address to speed up checkout."
                : `${pluralize(addresses.length, "address", "addresses")} saved for faster checkout.`}
          </p>
        </div>
        {!loading && addresses.length > 0 && (
          <button type="button" onClick={handleOpenAdd} className="btn btn-primary btn-sm">
            <Plus aria-hidden="true" />
            <span>Add address</span>
          </button>
        )}
      </div>

      {loading ? (
        <ul className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading addresses">
          <AddressSkeleton />
          <AddressSkeleton />
        </ul>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No saved addresses"
          description="Add a delivery address once and reuse it at checkout for every future order."
          action={{ label: "Add address", onClick: handleOpenAdd }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {sortedAddresses.map((addr) => (
            <AddressCard
              key={addr._id}
              address={addr}
              onEdit={() => handleOpenEdit(addr)}
              onDelete={() => setDeleteTarget(addr)}
              onSetDefault={() => handleSetDefault(addr._id)}
              settingDefault={settingDefaultId === addr._id}
            />
          ))}
        </ul>
      )}

      {/* Add / edit dialog */}
      <Dialog open={isModalOpen} onOpenChange={handleDialogChange}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[calc(100%-2rem)] gap-0 overflow-y-auto rounded-3xl bg-popover p-5 sm:max-w-xl sm:p-7"
        >
          <DialogHeader className="mb-5 gap-1 pr-12">
            <DialogTitle className="text-h3 text-foreground">
              {editingAddress ? "Edit address" : "Add a new address"}
            </DialogTitle>
            <DialogDescription className="text-small text-ink-muted">
              We deliver across India. Fields marked with an asterisk are required.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <button type="button" className="icon-btn absolute top-4 right-4" aria-label="Close" disabled={formLoading}>
              <X className="size-5" aria-hidden="true" />
            </button>
          </DialogClose>
          <AddressForm
            key={editingAddress?._id || "new"}
            initialAddress={editingAddress}
            submitting={formLoading}
            serverError={formError}
            onSubmit={handleSubmit}
            onCancel={() => handleDialogChange(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl bg-popover p-6 sm:max-w-md">
          <AlertDialogHeader className="gap-2">
            <span className="flex size-12 items-center justify-center rounded-full bg-danger-soft text-danger" aria-hidden="true">
              <Trash2 className="size-5" />
            </span>
            <AlertDialogTitle className="text-h4 text-foreground">Remove this address?</AlertDialogTitle>
            <AlertDialogDescription className="text-small text-ink-muted">
              {deleteTarget
                ? `${[deleteTarget.firstName, deleteTarget.lastName].filter(Boolean).join(" ")}, ${deleteTarget.city} will be removed from your address book. This can't be undone.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="-mx-6 -mb-6 rounded-b-3xl border-line bg-surface-2 px-6 py-4">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="btn btn-secondary btn-sm"
            >
              Keep address
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              aria-busy={deleting || undefined}
              className="btn btn-danger btn-sm"
            >
              {deleting && <Spinner className="size-4" />}
              <span>{deleting ? "Removing" : "Remove"}</span>
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
