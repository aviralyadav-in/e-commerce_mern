import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addCoupon,
  updateCoupon,
} from "../../features/coupons/couponsSlice";

const CouponModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.coupons);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (editData) {
      setCode(editData.code || "");
      setDiscountType(editData.discountType || "percentage");
      setDiscountValue(editData.discountValue || "");
      setMinOrderValue(editData.minOrderValue || "");
      setExpiryDate(
        editData.expiryDate
          ? new Date(editData.expiryDate).toISOString().split("T")[0]
          : ""
      );
      setIsActive(editData.isActive !== false);
    } else {
      setCode("");
      setDiscountType("percentage");
      setDiscountValue("");
      setMinOrderValue("");
      setExpiryDate("");
      setIsActive(true);
    }
    setErrors({});
    setTouched({});
  }, [editData, isOpen]);

  const validate = (fields = {}) => {
    const errs = {};
    const c = "code" in fields ? fields.code : code;
    const dv = "discountValue" in fields ? fields.discountValue : discountValue;
    const dt = "discountType" in fields ? fields.discountType : discountType;
    const ed = "expiryDate" in fields ? fields.expiryDate : expiryDate;
    const mov = "minOrderValue" in fields ? fields.minOrderValue : minOrderValue;

    if (!c.trim()) errs.code = "Coupon code is required.";
    else if (c.trim().length < 3) errs.code = "Code must be at least 3 characters.";

    if (dv === "" || dv === null || dv === undefined) {
      errs.discountValue = "Discount value is required.";
    } else if (Number(dv) <= 0) {
      errs.discountValue = "Discount value must be greater than 0.";
    } else if (dt === "percentage" && Number(dv) > 100) {
      errs.discountValue = "Percentage discount cannot exceed 100%.";
    }

    if (mov !== "" && Number(mov) < 0) {
      errs.minOrderValue = "Min order value cannot be negative.";
    }

    if (!ed) errs.expiryDate = "Expiry date is required.";
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(ed) < today) errs.expiryDate = "Expiry date must be today or in the future.";
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
    const allTouched = { code: true, discountValue: true, minOrderValue: true, expiryDate: true };
    setTouched(allTouched);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const couponData = {
      code: code.toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      expiryDate,
      isActive,
    };

    if (editData) {
      dispatch(updateCoupon({ id: editData._id, data: couponData })).then((res) => {
        if (!res.error) onClose();
      });
    } else {
      dispatch(addCoupon(couponData)).then((res) => {
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
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {errors[field]}
      </p>
    ) : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(15,23,42,0.18)" }}
        onClick={onClose}
      />

      {/* Slide-in Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {editData ? "Edit Coupon" : "Add New Coupon"}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {editData ? "Update coupon details below." : "Fill in the details to create a coupon."}
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

        {/* API Error */}
        {error && (
          <div className="mx-6 mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Coupon Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setCode(val);
                  if (touched.code) {
                    const errs = validate({ code: val });
                    setErrors((prev) => ({ ...prev, code: errs.code }));
                  }
                }}
                onBlur={() => handleBlur("code", code)}
                className={`${fieldClass("code")} uppercase tracking-wider font-bold`}
                placeholder="e.g., SUMMER50"
              />
              <ErrorMsg field="code" />
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Discount Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={discountType}
                  onChange={(e) => {
                    setDiscountType(e.target.value);
                    if (touched.discountValue) {
                      const errs = validate({ discountType: e.target.value, discountValue });
                      setErrors((prev) => ({ ...prev, discountValue: errs.discountValue }));
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Discount Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={(e) => {
                    setDiscountValue(e.target.value);
                    if (touched.discountValue) {
                      const errs = validate({ discountValue: e.target.value });
                      setErrors((prev) => ({ ...prev, discountValue: errs.discountValue }));
                    }
                  }}
                  onBlur={() => handleBlur("discountValue", discountValue)}
                  className={fieldClass("discountValue")}
                  placeholder={discountType === "percentage" ? "e.g., 20" : "e.g., 500"}
                />
                <ErrorMsg field="discountValue" />
              </div>
            </div>

            {/* Min Order Value & Expiry Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Min Order (₹) <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => {
                    setMinOrderValue(e.target.value);
                    if (touched.minOrderValue) {
                      const errs = validate({ minOrderValue: e.target.value });
                      setErrors((prev) => ({ ...prev, minOrderValue: errs.minOrderValue }));
                    }
                  }}
                  onBlur={() => handleBlur("minOrderValue", minOrderValue)}
                  className={fieldClass("minOrderValue")}
                  placeholder="e.g., 999"
                />
                <ErrorMsg field="minOrderValue" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Expiry Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => {
                    setExpiryDate(e.target.value);
                    if (touched.expiryDate) {
                      const errs = validate({ expiryDate: e.target.value });
                      setErrors((prev) => ({ ...prev, expiryDate: errs.expiryDate }));
                    }
                  }}
                  onBlur={() => handleBlur("expiryDate", expiryDate)}
                  className={fieldClass("expiryDate")}
                />
                <ErrorMsg field="expiryDate" />
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
              <select
                value={isActive ? "active" : "inactive"}
                onChange={(e) => setIsActive(e.target.value === "active")}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white transition-colors"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </form>
        </div>

        {/* Footer */}
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
            {loading ? "Saving..." : editData ? "Update Coupon" : "Add Coupon"}
          </button>
        </div>
      </div>
    </>
  );
};

export default CouponModal;
