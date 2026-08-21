import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUser, updateUser, clearUserError } from "../../features/users/usersSlice";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const UserModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.users);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("prefer_not_to_say");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (editData) {
      setName(editData.name || "");
      setEmail(editData.email || "");
      setPassword("");
      setPhone(editData.phone || "");
      setGender(editData.gender || "prefer_not_to_say");
      setDateOfBirth(
        editData.dateOfBirth
          ? new Date(editData.dateOfBirth).toISOString().split("T")[0]
          : "",
      );
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      setGender("prefer_not_to_say");
      setDateOfBirth("");
    }
    setErrors({});
    setTouched({});
    dispatch(clearUserError());
  }, [editData, isOpen, dispatch]);

  const validate = (fields = {}) => {
    const errs = {};
    const n = "name" in fields ? fields.name : name;
    const e = "email" in fields ? fields.email : email;
    const p = "password" in fields ? fields.password : password;
    const ph = "phone" in fields ? fields.phone : phone;

    if (!n.trim()) errs.name = "Name is required.";
    else if (n.trim().length < 2) errs.name = "Name must be at least 2 characters.";

    if (!e.trim()) errs.email = "Email is required.";
    else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(e.trim())) {
      errs.email = "Please enter a valid email.";
    }

    if (!editData) {
      if (!p) errs.password = "Password is required.";
      else if (p.length < 8) errs.password = "Password must be at least 8 characters.";
    } else if (p && p.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    if (ph && !/^[6-9]\d{9}$/.test(ph)) {
      errs.phone = "Enter a valid 10-digit Indian phone number.";
    }

    return errs;
  };

  const handleBlur = (field, value) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate({ [field]: value });
    setErrors((prev) => ({ ...prev, [field]: errs[field] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const allTouched = { name: true, email: true, password: true, phone: true };
    setTouched(allTouched);
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

  const fieldClass = (field) =>
    `w-full px-4 py-2.5 border rounded-lg text-sm outline-none transition-colors ${
      errors[field] && touched[field]
        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300"
        : "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
    }`;

  const ErrorMsg = ({ field }) =>
    errors[field] && touched[field] ? (
      <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
        <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(15,23,42,0.18)" }}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {editData ? "Edit User" : "Add New User"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {editData
                ? "Update customer details below."
                : "Create a new customer account from admin panel."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) {
                    const errs = validate({ name: e.target.value });
                    setErrors((prev) => ({ ...prev, name: errs.name }));
                  }
                }}
                onBlur={() => handleBlur("name", name)}
                className={fieldClass("name")}
                placeholder="e.g., Rahul Sharma"
              />
              <ErrorMsg field="name" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (touched.email) {
                    const errs = validate({ email: e.target.value });
                    setErrors((prev) => ({ ...prev, email: errs.email }));
                  }
                }}
                onBlur={() => handleBlur("email", email)}
                className={fieldClass("email")}
                placeholder="e.g., rahul@example.com"
              />
              <ErrorMsg field="email" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password{" "}
                {editData ? (
                  <span className="text-gray-400 font-normal">(Leave blank to keep current)</span>
                ) : (
                  <span className="text-red-500">*</span>
                )}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (touched.password) {
                    const errs = validate({ password: e.target.value });
                    setErrors((prev) => ({ ...prev, password: errs.password }));
                  }
                }}
                onBlur={() => handleBlur("password", password)}
                className={fieldClass("password")}
                placeholder={editData ? "••••••••" : "Min. 8 characters"}
                autoComplete="new-password"
              />
              <ErrorMsg field="password" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (touched.phone) {
                    const errs = validate({ phone: e.target.value });
                    setErrors((prev) => ({ ...prev, phone: errs.phone }));
                  }
                }}
                onBlur={() => handleBlur("phone", phone)}
                className={fieldClass("phone")}
                placeholder="e.g., 9876543210"
                maxLength={10}
              />
              <ErrorMsg field="phone" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                >
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading && (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            )}
            {loading ? "Saving..." : editData ? "Update User" : "Add User"}
          </button>
        </div>
      </div>
    </>
  );
};

export default UserModal;
