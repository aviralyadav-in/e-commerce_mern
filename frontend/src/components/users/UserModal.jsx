import { useRef, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addUser,
  updateUser,
  clearUserError,
  uploadUserAvatar,
  removeUserAvatar,
} from "../../features/users/usersSlice";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import { initials } from "../../utils/format";
import { getAssetUrl } from "../../utils/assetUrl";
import { UserIcon, UploadIcon } from "../common/Icon";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

const UserModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.users);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("male");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // 🆕 Avatar (sirf edit mode me — naye user ki pehle create honi zaroori hai)
  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // 🛠️ editData/isOpen change par form reset — React ka recommended
  // "adjust state during render" pattern (purane effect-setState ki jagah)
  const formKey = `${isOpen}-${editData?._id || "new"}`;
  const [prevFormKey, setPrevFormKey] = useState(formKey);
  if (prevFormKey !== formKey) {
    setPrevFormKey(formKey);
    if (editData) {
      setName(editData.name || "");
      setEmail(editData.email || "");
      setPassword("");
      setPhone(editData.phone || "");
      setGender(editData.gender === "female" ? "female" : "male");
      setDateOfBirth(
        editData.dateOfBirth
          ? new Date(editData.dateOfBirth).toISOString().split("T")[0]
          : "",
      );
      setAvatarPreview(editData.avatar || "");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setGender("male");
      setDateOfBirth("");
      setAvatarPreview("");
    }
    setErrors({});
    setTouched({});
  }

  // Redux error clear karna external-system update hai — effect allowed hai
  useEffect(() => {
    if (isOpen) dispatch(clearUserError());
  }, [dispatch, formKey, isOpen]);

  // 🆕 Avatar handlers — select hote hi turant upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editData?._id) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAvatarError("Only JPG, PNG or WEBP allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Photo must be under 5MB.");
      return;
    }
    setAvatarError("");
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append("avatar", file);
    const res = await dispatch(
      uploadUserAvatar({ id: editData._id, formData: fd }),
    );
    setUploadingAvatar(false);
    if (uploadUserAvatar.fulfilled.match(res)) {
      setAvatarPreview(res.payload?.avatar || "");
    } else {
      setAvatarError(res.payload || "Upload failed.");
    }
  };

  const handleAvatarRemove = async () => {
    if (!editData?._id) return;
    setUploadingAvatar(true);
    const res = await dispatch(removeUserAvatar(editData._id));
    setUploadingAvatar(false);
    if (removeUserAvatar.fulfilled.match(res)) {
      setAvatarPreview("");
    } else {
      setAvatarError(res.payload || "Could not remove photo.");
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

  /** Live-correct a field only once the user has already left it. */
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

  const handleSubmit = (e) => {
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
      dispatch(updateUser({ id: editData._id, data: payload })).then((res) => {
        if (!res.error) onClose();
      });
    } else {
      dispatch(addUser(payload)).then((res) => {
        if (!res.error) onClose();
      });
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<UserIcon className="w-4 h-4" />}
      title={editData ? "Edit customer" : "New customer"}
      subtitle={
        editData
          ? "Update this customer's account details."
          : "Create a customer account from the admin panel."
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

      {/* Identity strip — makes it obvious which account you're editing. */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-(--border)">
        {uploadingAvatar ? (
          <span className="avatar w-11 h-11 flex items-center justify-center">
            <span className="spinner spinner-sm" />
          </span>
        ) : avatarPreview ? (
          <img
            src={getAssetUrl(avatarPreview)}
            alt=""
            className="w-11 h-11 rounded-full object-cover border border-(--border)"
          />
        ) : (
          <span className="avatar w-11 h-11 text-[14px]">
            {initials(name) || "?"}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-semibold text-(--ink) truncate">
            {name.trim() || "Unnamed customer"}
          </p>
          <p className="text-[11.5px] text-(--ink-muted) truncate">
            {email.trim() || "No email yet"}
          </p>
          {avatarError && (
            <p className="mt-1 text-[11px] text-red-600">{avatarError}</p>
          )}
        </div>
        {editData && (
          <div className="shrink-0 flex flex-col items-end gap-1.5">
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
              {avatarPreview ? "Change photo" : "Add photo"}
            </button>
            {avatarPreview && (
              <button
                type="button"
                className="text-[11px] font-semibold underline text-red-600"
                onClick={handleAvatarRemove}
                disabled={uploadingAvatar}
              >
                Remove photo
              </button>
            )}
          </div>
        )}
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

        <Field label="Email" required htmlFor="user-email" error={err("email")}>
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
                ? "Leave blank to keep the current password."
                : "At least 8 characters."
          }
        >
          <input
            id="user-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              revalidate("password", e.target.value);
            }}
            onBlur={() => handleBlur("password", password)}
            placeholder={editData ? "••••••••" : "Min. 8 characters"}
            autoComplete="new-password"
            className={`form-input ${invalid("password")}`}
          />
        </Field>

        <Field
          label="Phone"
          optional
          htmlFor="user-phone"
          error={err("phone")}
          hint={err("phone") ? undefined : "10-digit Indian mobile number."}
        >
          <input
            id="user-phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              revalidate("phone", e.target.value);
            }}
            onBlur={() => handleBlur("phone", phone)}
            placeholder="e.g. 9876543210"
            maxLength={10}
            className={`form-input ${invalid("phone")}`}
          />
        </Field>

        <div className="form-row">
          <Field label="Gender" htmlFor="user-gender">
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

          <Field label="Date of birth" optional htmlFor="user-dob">
            <input
              id="user-dob"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="form-input"
            />
          </Field>
        </div>
      </form>
    </Drawer>
  );
};

export default UserModal;
