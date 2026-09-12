import { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addUser,
  updateUser,
  clearUserError,
  uploadUserAvatar,
  removeUserAvatar,
  fetchUserById,
  clearSelectedUser,
} from "../../features/users/usersSlice";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import { initials } from "../../utils/format";
import { getAssetUrl } from "../../utils/assetUrl";
import { notifySuccess, notifyError } from "../../lib/toast";
import { UserIcon, UploadIcon, EyeIcon, EyeOffIcon } from "../common/Icon";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const UserModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error, selectedUserAddresses = [], detailLoading } = useSelector(
    (state) => state.users,
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarObjectUrl, setAvatarObjectUrl] = useState("");

  const formKey = `${isOpen}-${editData?._id || "new"}`;
  const [prevFormKey, setPrevFormKey] = useState(formKey);
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey);
    if (editData) {
      setName(editData.name || "");
      setEmail(editData.email || "");
      setPassword("");
      setShowPassword(false);
      setPhone(editData.phone || "");
      setGender(editData.gender === "female" ? "female" : "male");
      setDateOfBirth(
        editData.dateOfBirth
          ? (() => {
              const d = new Date(editData.dateOfBirth);
              return !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : "";
            })()
          : "",
      );
      setAvatarPreview(editData.avatar || "");
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
      setAvatarFile(null);
      setAvatarObjectUrl("");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setPhone("");
      setGender("male");
      setDateOfBirth("");
      setAvatarPreview("");
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
      setAvatarFile(null);
      setAvatarObjectUrl("");
    }
    setErrors({});
    setTouched({});
  }

  useEffect(() => {
    if (isOpen) {
      dispatch(clearUserError());
      if (editData?._id) {
        dispatch(fetchUserById(editData._id));
      }
    } else {
      dispatch(clearSelectedUser());
    }
  }, [dispatch, formKey, isOpen, editData?._id]);

  useEffect(() => {
    return () => {
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
    };
  }, [avatarObjectUrl]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Only JPG, PNG or WEBP allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Photo must be under 5MB.");
      return;
    }
    setAvatarError("");

    if (!editData?._id) {
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
      setAvatarFile(file);
      setAvatarObjectUrl(URL.createObjectURL(file));
      return;
    }

    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await dispatch(
      uploadUserAvatar({ id: editData._id, formData: fd }),
    );
    setUploadingAvatar(false);
    if (uploadUserAvatar.fulfilled.match(res)) {
      setAvatarPreview(res.payload?.avatar || "");
      notifySuccess("Photo updated", "Customer avatar changed successfully.");
    } else {
      setAvatarError(res.payload || "Upload failed.");
      notifyError("Photo upload failed", res.payload || "Something went wrong.");
    }
  };

  const handleAvatarRemove = async () => {
    if (!editData?._id) {
      if (avatarObjectUrl) URL.revokeObjectURL(avatarObjectUrl);
      setAvatarFile(null);
      setAvatarObjectUrl("");
      return;
    }
    setUploadingAvatar(true);
    const res = await dispatch(removeUserAvatar(editData._id));
    setUploadingAvatar(false);
    if (removeUserAvatar.fulfilled.match(res)) {
      setAvatarPreview("");
      notifySuccess("Photo removed", "Customer avatar removed.");
    } else {
      setAvatarError(res.payload || "Could not remove photo.");
      notifyError("Could not remove photo", res.payload || "Something went wrong.");
    }
  };

  const validate = (fields = {}) => {
    const errs = {};
    const n = "name" in fields ? fields.name : name;
    const e = "email" in fields ? fields.email : email;
    const p = "password" in fields ? fields.password : password;
    const ph = "phone" in fields ? fields.phone : phone;

    if (!n.trim()) errs.name = "Name is required.";
    else if (n.trim().length < 2)
      errs.name = "Name must be at least 2 characters.";

    if (!e.trim()) errs.email = "Email is required.";
    else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e.trim())
    ) {
      errs.email = "Please enter a valid email.";
    }

    if (!editData) {
      if (!p) errs.password = "Password is required.";
      else if (p.length < 8)
        errs.password = "Password must be at least 8 characters.";
    } else if (p && p.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    if (ph && !/^[6-9]\d{9}$/.test(ph)) {
      errs.phone = "Enter a valid 10-digit Indian phone number.";
    }

    return errs;
  };

  const revalidate = (field, value) => {
    if (!touched[field]) return;
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const err = (field) => (touched[field] ? errors[field] : undefined);
  const invalid = (field) =>
    touched[field] && errors[field] ? "is-invalid" : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, phone: true });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      gender,
      dateOfBirth: dateOfBirth || null,
    };

    if (password) payload.password = password;

    if (editData) {
      const res = await dispatch(updateUser({ id: editData._id, data: payload }));
      if (updateUser.fulfilled.match(res)) {
        notifySuccess("Customer updated", `Changes to "${payload.name}" saved successfully.`);
        onClose();
      } else {
        const errorMsg = res.payload || "Could not update customer profile.";
        if (typeof errorMsg === "string" && errorMsg.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: errorMsg }));
          setTouched((prev) => ({ ...prev, email: true }));
        }
        notifyError("Update failed", errorMsg);
      }
    } else {
      let res;
      if (avatarFile) {
        const fd = new FormData();
        fd.append("name", payload.name);
        fd.append("email", payload.email);
        if (payload.phone) fd.append("phone", payload.phone);
        fd.append("gender", payload.gender);
        if (payload.dateOfBirth) fd.append("dateOfBirth", payload.dateOfBirth);
        fd.append("password", payload.password);
        fd.append("avatar", avatarFile);
        res = await dispatch(addUser(fd));
      } else {
        res = await dispatch(addUser(payload));
      }

      if (addUser.fulfilled.match(res)) {
        notifySuccess("Customer created", `Account for "${payload.name}" created successfully.`);
        onClose();
      } else {
        const errorMsg = res.payload || "Could not create customer profile.";
        if (typeof errorMsg === "string" && errorMsg.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: errorMsg }));
          setTouched((prev) => ({ ...prev, email: true }));
        }
        notifyError("Creation failed", errorMsg);
      }
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<UserIcon className="w-4 h-4" />}
      title={editData ? "Edit Customer Account" : "New Customer Account"}
      subtitle={
        editData
          ? "Update customer contact details, login credentials, or demographic profile."
          : "Create a customer account directly from the admin dashboard."
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            form="user-form"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <span className="spinner spinner-on-brand" />}
            {loading
              ? "Saving…"
              : editData
                ? "Save changes"
                : "Create customer"}
          </button>
        </>
      }
    >
      <FormAlert>{error}</FormAlert>

      {/* Live Identity Card Preview */}
      <div className="mb-4.5 p-3.5 rounded-xl border border-(--border) bg-(--surface-sunken)/50 flex items-center gap-3.5">
        <div className="relative">
          {uploadingAvatar ? (
            <span className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-200 dark:bg-slate-700">
              <span className="spinner spinner-sm" />
            </span>
          ) : avatarObjectUrl ? (
            <img
              src={avatarObjectUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover ring-2 ring-(--brand)/30 shadow-xs"
            />
          ) : avatarPreview ? (
            <img
              src={getAssetUrl(avatarPreview)}
              alt=""
              className="w-12 h-12 rounded-full object-cover ring-2 ring-(--brand)/30 shadow-xs"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-linear-to-tr from-indigo-500 to-violet-600 text-white font-bold text-[14px] flex items-center justify-center ring-2 ring-indigo-100 dark:ring-indigo-900/50 shadow-xs">
              {initials(name) || "?"}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[14px] font-bold text-(--ink) truncate">
              {name.trim() || "New Customer"}
            </p>
            <span className="badge badge-neutral text-[10.5px] px-1.5 py-0.2">
              {editData ? "Editing" : "Live Preview"}
            </span>
          </div>
          <p className="text-[12px] text-(--ink-muted) truncate mt-0.5">
            {email.trim() || "Enter email address below"}
          </p>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-(--ink-muted)">
            <span>{phone.trim() ? `+91 ${phone}` : "No phone"}</span>
            <span>•</span>
            <span className="capitalize">{gender}</span>
          </div>
          {avatarError && (
            <p className="mt-1 text-[11px] text-red-600">{avatarError}</p>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <input
            ref={avatarInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => avatarInputRef.current?.click()}
            disabled={uploadingAvatar}
          >
            <UploadIcon className="w-3.5 h-3.5" />
            {avatarPreview || avatarObjectUrl ? "Change photo" : "Add photo"}
          </button>
          {(avatarPreview || avatarObjectUrl) && (
            <button
              type="button"
              className="text-[11px] font-semibold text-red-600 hover:underline"
              onClick={handleAvatarRemove}
              disabled={uploadingAvatar}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <form
        id="user-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        <Field
          label="Full name"
          required
          htmlFor="user-name"
          error={err("name")}
          hint={err("name") ? undefined : "Display name used for order invoices and storefront greetings."}
        >
          <input
            id="user-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              revalidate("name", e.target.value);
            }}
            onBlur={() => handleBlur("name", name)}
            placeholder="e.g. Rahul Sharma"
            className={`form-input ${invalid("name")}`}
          />
        </Field>

        <Field
          label="Email address"
          required
          htmlFor="user-email"
          error={err("email")}
          hint={err("email") ? undefined : "Customer uses this email to log in and receive order status updates."}
        >
          <input
            id="user-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              revalidate("email", e.target.value);
            }}
            onBlur={() => handleBlur("email", email)}
            placeholder="e.g. rahul@example.com"
            autoComplete="off"
            className={`form-input ${invalid("email")}`}
          />
        </Field>

        <Field
          label="Password"
          required={!editData}
          optional={!!editData}
          htmlFor="user-password"
          error={err("password")}
          hint={
            err("password")
              ? undefined
              : editData
                ? "Leave empty to keep the customer's current password."
                : "Initial password for this customer (min. 8 characters; e.g. Customer@123)."
          }
        >
          <div className="relative flex items-center">
            <input
              id="user-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                revalidate("password", e.target.value);
              }}
              onBlur={() => handleBlur("password", password)}
              placeholder={editData ? "•••••••• (unchanged)" : "Min. 8 characters (e.g. Customer@123)"}
              autoComplete="new-password"
              className={`form-input pr-10 ${invalid("password")}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 p-1 text-(--ink-muted) hover:text-(--ink) transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOffIcon className="w-4 h-4" />
              ) : (
                <EyeIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </Field>

        <Field
          label="Mobile phone number"
          optional
          htmlFor="user-phone"
          error={err("phone")}
          hint={err("phone") ? undefined : "10-digit Indian mobile number for WhatsApp tracking & delivery SMS."}
        >
          <div className="relative flex items-center">
            <span className="absolute left-3 text-[12px] font-semibold text-(--ink-muted) select-none pr-2 border-r border-(--border)">
              +91
            </span>
            <input
              id="user-phone"
              type="tel"
              value={phone}
              onChange={(e) => {
                let val = e.target.value.replace(/\D/g, "");
                // Smart strip if +91 or leading 0 was pasted/typed
                if (val.startsWith("91") && val.length > 10) val = val.slice(2);
                else if (val.startsWith("0") && val.length > 10) val = val.slice(1);
                val = val.slice(0, 10);
                setPhone(val);
                revalidate("phone", val);
              }}
              onBlur={() => handleBlur("phone", phone)}
              placeholder="9876543210"
              maxLength={14}
              style={{ paddingLeft: "54px" }}
              className={`form-input font-mono ${invalid("phone")}`}
            />
          </div>
        </Field>

        <div className="form-row">
          <Field
            label="Gender"
            htmlFor="user-gender"
            hint="Personalizes recommended categories."
          >
            <select
              id="user-gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="form-select"
            >
              {GENDER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </Field>

          <Field
            label="Date of birth"
            optional
            htmlFor="user-dob"
            hint="For birthday coupons."
          >
            <input
              id="user-dob"
              type="date"
              max={new Date().toISOString().split("T")[0]}
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="form-input"
            />
          </Field>
        </div>

        {/* Saved Delivery Addresses Section (edit mode) */}
        {editData && (
          <div className="pt-3 border-t border-(--border) space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[12.5px] font-bold text-(--ink) flex items-center gap-1.5">
                <span>📍</span>
                <span>Saved Delivery Addresses</span>
              </h4>
              <span className="text-[11px] text-(--ink-muted) font-medium">
                {detailLoading
                  ? "Loading addresses…"
                  : `${selectedUserAddresses.length} ${selectedUserAddresses.length === 1 ? "address" : "addresses"}`}
              </span>
            </div>

            {selectedUserAddresses.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto admin-scroll pr-1">
                {selectedUserAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    className="p-2.5 rounded-lg border border-(--border) bg-(--surface-sunken)/40 text-[11.5px] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-(--ink) truncate">
                        {addr.fullName ||
                          [addr.firstName, addr.lastName]
                            .filter(Boolean)
                            .join(" ") ||
                          "Customer"}
                      </span>
                      <div className="flex items-center gap-1">
                        {addr.isDefault && (
                          <span className="badge badge-success text-[10px] px-1.5 py-0">
                            Default
                          </span>
                        )}
                        <span className="badge badge-neutral text-[10px] px-1.5 py-0">
                          {addr.addressType || "Home"}
                        </span>
                      </div>
                    </div>
                    <p className="text-(--ink-muted) leading-relaxed">
                      {[
                        addr.addressLine1,
                        addr.addressLine2,
                        addr.landmark,
                        addr.city,
                        addr.state,
                        addr.zipCode,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {addr.phone && (
                      <p className="text-[11px] text-(--ink-muted) font-mono">
                        Phone: +91 {addr.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-(--border) text-center text-(--ink-muted) text-[11.5px]">
                {detailLoading
                  ? "Checking saved addresses…"
                  : "No shipping addresses saved by this customer yet."}
              </div>
            )}
          </div>
        )}

        <div className="p-3 rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 text-[11.5px] text-blue-800 dark:text-blue-300">
          💡 <b>Tip:</b> Shoppers can also create accounts on their own at storefront checkout or via the sign-up page.
        </div>
      </form>
    </Drawer>
  );
};

export default UserModal;

