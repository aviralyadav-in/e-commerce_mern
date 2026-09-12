import React, { useMemo, useRef, useState } from "react";
import { Camera, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "../../stores/authStore";
import { cn, getImageUrl } from "../../lib/utils";
import usePageTitle from "../../hooks/usePageTitle";
import FormField from "../../components/common/FormField";
import { Spinner } from "../../components/common/PageLoader";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

function buildFormState(user) {
  return {
    name: user?.name || "",
    phone: user?.phone || "",
    gender: user?.gender || "male",
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "",
  };
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function ProfilePage() {
  usePageTitle("Profile");
  const { user, updateProfile, updateAvatar, removeAvatar } = useAuthStore();

  const [formData, setFormData] = useState(() => buildFormState(user));
  const [updating, setUpdating] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  const savedState = useMemo(() => buildFormState(user), [user]);
  const isDirty =
    formData.name !== savedState.name ||
    formData.phone !== savedState.phone ||
    formData.gender !== savedState.gender ||
    formData.dateOfBirth !== savedState.dateOfBirth;

  const today = new Date().toISOString().slice(0, 10);
  const avatarSrc = user?.avatar ? getImageUrl(user.avatar) : undefined;

  const setField = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setErrorMsg("");

    const res = await updateProfile(formData);
    if (res.success) {
      toast.success("Profile updated", { description: "Your details have been saved." });
    } else {
      setErrorMsg(res.message);
      toast.error(res.message || "Could not update your profile");
    }
    setUpdating(false);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarLoading(true);
    setErrorMsg("");

    const res = await updateAvatar(file);
    if (res.success) {
      toast.success("Profile photo updated");
    } else {
      setErrorMsg(res.message);
      toast.error(res.message || "Could not upload the photo");
    }
    setAvatarLoading(false);
    // Allow re-selecting the same file later.
    e.target.value = "";
  };

  const handleRemoveAvatar = async () => {
    setAvatarLoading(true);
    setErrorMsg("");

    const res = await removeAvatar();
    if (res.success) {
      toast.success("Profile photo removed");
    } else {
      setErrorMsg(res.message);
      toast.error(res.message || "Could not remove the photo");
    }
    setAvatarLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile photo */}
      <section className="surface-card p-6" aria-labelledby="profile-photo-heading">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative shrink-0 self-center sm:self-auto">
            <Avatar className="size-24 ring-4 ring-gold-soft">
              {avatarSrc && <AvatarImage src={avatarSrc} alt={user?.name ? `${user.name}'s profile photo` : "Profile photo"} />}
              <AvatarFallback className="bg-primary font-serif text-3xl font-semibold text-primary-foreground">
                {getInitials(user?.name)}
              </AvatarFallback>
            </Avatar>
            {avatarLoading && (
              <div
                className="absolute inset-0 flex items-center justify-center rounded-full bg-onyx/50"
                aria-hidden="true"
              >
                <Spinner className="size-6 border-ivory/40 border-t-ivory" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 id="profile-photo-heading" className="text-h3 text-foreground">
              Profile photo
            </h2>
            <p className="mt-1 text-small text-ink-muted">
              A square JPG or PNG works best. Maximum file size 5 MB.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarLoading}
                aria-busy={avatarLoading || undefined}
                className="btn btn-secondary btn-sm"
              >
                <Camera aria-hidden="true" />
                <span>{user?.avatar ? "Change photo" : "Upload photo"}</span>
              </button>
              {user?.avatar && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarLoading}
                  className="btn btn-ghost btn-sm text-danger hover:text-danger"
                >
                  <Trash2 aria-hidden="true" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Personal details */}
      <section className="surface-card p-6" aria-labelledby="personal-details-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="personal-details-heading" className="text-h3 text-foreground">
              Personal details
            </h2>
            <p className="mt-1 text-small text-ink-muted">
              How we address you and where we can reach you about your orders.
            </p>
          </div>
          {isDirty && !updating && (
            <span className="pill pill-gold" aria-live="polite">
              Unsaved changes
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Full name" required>
              <input
                type="text"
                required
                autoComplete="name"
                value={formData.name}
                onChange={setField("name")}
                className="input-luxury"
              />
            </FormField>

            <FormField label="Email address" hint="Your email is your sign-in ID and can't be changed here." optionalLabel="">
              <input
                type="email"
                readOnly
                disabled
                autoComplete="email"
                value={user?.email || ""}
                className="input-luxury"
              />
            </FormField>

            <FormField label="Mobile number" hint="10-digit Indian mobile number" optionalLabel="">
              <input
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                maxLength={10}
                placeholder="98765 43210"
                value={formData.phone}
                onChange={setField("phone")}
                className="input-luxury"
              />
            </FormField>

            <div>
              <span id="gender-label" className="label-luxury">
                Gender
              </span>
              <div role="group" aria-labelledby="gender-label" className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((opt) => {
                  const selected = formData.gender === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setFormData((prev) => ({ ...prev, gender: opt.value }))}
                      className={cn("chip h-12 px-6", selected && "chip-active")}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <FormField label="Date of birth" hint="We'll send a little something on your birthday." optionalLabel="">
              <input
                type="date"
                max={today}
                autoComplete="bday"
                value={formData.dateOfBirth}
                onChange={setField("dateOfBirth")}
                className="input-luxury"
              />
            </FormField>
          </div>

          {errorMsg && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-small text-danger"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </p>
          )}

          <div className="hairline flex flex-col-reverse gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-small text-ink-soft">
              {isDirty ? "You have changes that haven't been saved." : "Everything is up to date."}
            </p>
            <button
              type="submit"
              disabled={updating || !isDirty}
              aria-busy={updating || undefined}
              className="btn btn-primary"
            >
              {updating && <Spinner className="size-4" />}
              <span>{updating ? "Saving" : "Save changes"}</span>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
