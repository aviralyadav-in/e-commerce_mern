import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useFormSync from "../../hooks/useFormSync";
import { addCoupon, updateCoupon } from "../../features/coupons/couponsSlice";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import { formatCurrency } from "../../utils/format";
import { TagIcon, CheckIcon } from "../common/Icon";
import { notifySuccess, notifyError } from "../../lib/toast";

const CouponModal = ({ isOpen, onClose, editData }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.coupons);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Re-seed form state whenever the drawer opens for a different record.
  useFormSync(`${isOpen}|${editData?._id ?? ""}`, () => {
    if (editData) {
      setCode(editData.code || "");
      setDiscountType(editData.discountType || "percentage");
      setDiscountValue(editData.discountValue || "");
      setMinOrderValue(editData.minOrderValue || "");
      setUsageLimit(
        editData.usageLimit != null ? String(editData.usageLimit) : "",
      );
      setPerUserLimit(
        editData.perUserLimit != null ? String(editData.perUserLimit) : "",
      );
      setExpiryDate(
        editData.expiryDate
          ? new Date(editData.expiryDate).toISOString().split("T")[0]
          : "",
      );
      setIsActive(editData.isActive !== false);
    } else {
      setCode("");
      setDiscountType("percentage");
      setDiscountValue("");
      setMinOrderValue("");
      setUsageLimit("");
      setPerUserLimit("");
      setExpiryDate("");
      setIsActive(true);
    }
    setErrors({});
    setTouched({});
  });

  const validate = (fields = {}) => {
    const errs = {};
    const c = "code" in fields ? fields.code : code;
    const dv = "discountValue" in fields ? fields.discountValue : discountValue;
    const dt = "discountType" in fields ? fields.discountType : discountType;
    const ed = "expiryDate" in fields ? fields.expiryDate : expiryDate;
    const mov =
      "minOrderValue" in fields ? fields.minOrderValue : minOrderValue;

    if (!c.trim()) errs.code = "Coupon code is required.";
    else if (c.trim().length < 3)
      errs.code = "Code must be at least 3 characters.";
    else if (!/^[A-Z0-9_-]+$/.test(c.trim().toUpperCase()))
      errs.code =
        "Code can only contain letters, numbers, hyphens, and underscores.";

    if (dv === "" || dv === null || dv === undefined) {
      errs.discountValue = "Discount value is required.";
    } else if (Number(dv) <= 0) {
      errs.discountValue = "Discount value must be greater than 0.";
    } else if (dt === "percentage" && Number(dv) > 100) {
      errs.discountValue = "Percentage discount cannot exceed 100%.";
    }

    if (mov !== "" && Number(mov) < 0) {
      errs.minOrderValue = "Min order value cannot be negative.";
    } else if (
      dt === "flat" &&
      mov !== "" &&
      Number(mov) > 0 &&
      dv !== "" &&
      Number(dv) > Number(mov)
    ) {
      errs.minOrderValue =
        "Min spend must be at least equal to flat discount amount.";
    }

    const ul = "usageLimit" in fields ? fields.usageLimit : usageLimit;
    const pul =
      "perUserLimit" in fields ? fields.perUserLimit : perUserLimit;
    if (ul !== "" && (!Number.isInteger(Number(ul)) || Number(ul) < 1)) {
      errs.usageLimit = "Usage limit must be a whole number of at least 1.";
    }
    if (pul !== "" && (!Number.isInteger(Number(pul)) || Number(pul) < 1)) {
      errs.perUserLimit =
        "Per-user limit must be a whole number of at least 1.";
    } else if (
      ul !== "" &&
      pul !== "" &&
      Number(ul) > 0 &&
      Number(pul) > Number(ul)
    ) {
      errs.perUserLimit = "Per-user limit cannot exceed total usage limit.";
    }

    if (!ed) errs.expiryDate = "Expiry date is required.";
    else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(ed) < today)
        errs.expiryDate = "Expiry date must be today or in the future.";
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

  const handlePresetValue = (val) => {
    setDiscountValue(String(val));
    setTouched((prev) => ({ ...prev, discountValue: true }));
    revalidate("discountValue", String(val));
  };

  const handleDatePreset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const val = d.toISOString().split("T")[0];
    setExpiryDate(val);
    setTouched((prev) => ({ ...prev, expiryDate: true }));
    revalidate("expiryDate", val);
  };

  const handleEndOfYear = () => {
    const year = new Date().getFullYear();
    const val = `${year}-12-31`;
    setExpiryDate(val);
    setTouched((prev) => ({ ...prev, expiryDate: true }));
    revalidate("expiryDate", val);
  };

  const handleGenerateCode = () => {
    const prefixes = [
      "NIYA",
      "SAVE",
      "FESTIVE",
      "FLASH",
      "VIP",
      "LUXE",
      "WELCOME",
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = [10, 15, 20, 25, 50, 100][Math.floor(Math.random() * 6)];
    const generated = `${prefix}${num}`;
    setCode(generated);
    setTouched((prev) => ({ ...prev, code: true }));
    revalidate("code", generated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      code: true,
      discountValue: true,
      minOrderValue: true,
      usageLimit: true,
      perUserLimit: true,
      expiryDate: true,
    });
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const couponData = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue: Number(discountValue),
      minOrderValue: Number(minOrderValue) || 0,
      usageLimit:
        usageLimit !== "" && Number(usageLimit) > 0 ? Number(usageLimit) : null,
      perUserLimit:
        perUserLimit !== "" && Number(perUserLimit) > 0
          ? Number(perUserLimit)
          : null,
      expiryDate,
      isActive,
    };

    const action = editData
      ? updateCoupon({ id: editData._id, data: couponData })
      : addCoupon(couponData);

    try {
      await dispatch(action).unwrap();
      onClose();
    } catch {
      // toastMiddleware centrally handles success/error toast
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<TagIcon className="w-4 h-4" />}
      title={editData ? `Edit Coupon: ${editData.code}` : "Create New Coupon"}
      subtitle={
        editData
          ? "Update discount amount, minimum spend, limits, or expiry date."
          : "Configure a promotional discount code for customer checkout."
      }
      footer={
        <>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="submit"
            form="coupon-form"
            disabled={loading}
            className="btn btn-primary"
          >
            {loading && <span className="spinner spinner-on-brand" />}
            {loading ? "Saving…" : editData ? "Save changes" : "Create coupon"}
          </button>
        </>
      }
    >
      <FormAlert>{error}</FormAlert>

      <form
        id="coupon-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        {/* Live Storefront Ticket Preview Card */}
        <div className="p-3.5 rounded-(--radius) border border-dashed border-(--brand)/40 bg-linear-to-br from-(--brand-soft) via-(--surface-card) to-(--surface-card) space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded bg-(--brand) text-white flex items-center justify-center font-bold text-[11px] shadow-2xs">
                %
              </span>
              <span className="font-mono text-[14px] font-extrabold tracking-wider text-(--brand)">
                {code.trim() ? code.toUpperCase() : "COUPONCODE"}
              </span>
            </div>
            <span
              className={`badge ${isActive ? "badge-success" : "badge-neutral"}`}
            >
              <span className="badge-dot" />
              {isActive ? "Active" : "Paused"}
            </span>
          </div>

          <div className="pt-0.5">
            <p className="text-[15px] font-extrabold text-(--ink) tracking-tight">
              {discountValue && Number(discountValue) > 0
                ? discountType === "percentage"
                  ? `${discountValue}% OFF Total Order`
                  : `${formatCurrency(discountValue)} Flat Discount`
                : "Specify discount below"}
            </p>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-(--ink-muted) mt-1">
              <span>
                {Number(minOrderValue) > 0
                  ? `Min spend: ${formatCurrency(minOrderValue)}`
                  : "No minimum spend"}
              </span>
              <span>•</span>
              <span>
                {expiryDate ? `Valid till ${expiryDate}` : "Select expiry date"}
              </span>
              {perUserLimit && (
                <>
                  <span>•</span>
                  <span>Max {perUserLimit} per user</span>
                </>
              )}
            </div>
          </div>
        </div>

        <Field
          label="Coupon Code"
          required
          htmlFor="coupon-code"
          error={err("code")}
          hint={
            err("code")
              ? undefined
              : "Customers type this code in their cart/checkout."
          }
        >
          <div className="flex gap-2">
            <input
              id="coupon-code"
              type="text"
              value={code}
              onChange={(e) => {
                const val = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9_-]/g, "");
                setCode(val);
                revalidate("code", val);
              }}
              onBlur={() => handleBlur("code", code)}
              placeholder="e.g. FESTIVE20, WELCOME50, SUMMER100"
              className={`form-input form-input-mono font-bold uppercase tracking-wider flex-1 ${invalid(
                "code",
              )}`}
            />
            <button
              type="button"
              onClick={handleGenerateCode}
              className="btn btn-secondary text-[11.5px] px-3 shrink-0"
              title="Generate a random branded coupon code"
            >
              Generate
            </button>
          </div>
        </Field>

        <div className="form-row">
          <Field label="Discount Type" required htmlFor="coupon-type">
            <select
              id="coupon-type"
              value={discountType}
              onChange={(e) => {
                setDiscountType(e.target.value);
                if (touched.discountValue) {
                  const errs = validate({
                    discountType: e.target.value,
                    discountValue,
                  });
                  setErrors((prev) => ({
                    ...prev,
                    discountValue: errs.discountValue,
                  }));
                }
              }}
              className="form-select"
            >
              <option value="percentage">Percentage Discount (%)</option>
              <option value="flat">Flat Rupee Deduction (₹)</option>
            </select>
          </Field>

          <Field
            label={
              discountType === "percentage" ? "Percentage Off (%)" : "Flat Amount (₹)"
            }
            required
            htmlFor="coupon-value"
            error={err("discountValue")}
            hint={
              err("discountValue")
                ? undefined
                : discountType === "percentage"
                  ? "Percentage deducted from order total (max 100%)."
                  : "Direct ₹ amount deducted from checkout total."
            }
          >
            <input
              id="coupon-value"
              type="number"
              min="1"
              value={discountValue}
              onChange={(e) => {
                setDiscountValue(e.target.value);
                revalidate("discountValue", e.target.value);
              }}
              onBlur={() => handleBlur("discountValue", discountValue)}
              placeholder={discountType === "percentage" ? "20" : "500"}
              className={`form-input ${invalid("discountValue")}`}
            />
          </Field>
        </div>

        {/* Quick Discount Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-(--ink-faint) font-medium">
            Quick presets:
          </span>
          {discountType === "percentage" ? (
            [10, 15, 20, 25, 50].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePresetValue(num)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                  String(discountValue) === String(num)
                    ? "bg-(--brand) text-white border-(--brand)"
                    : "border-(--border) text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
                }`}
              >
                {num}%
              </button>
            ))
          ) : (
            [100, 200, 500, 1000].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePresetValue(num)}
                className={`px-2 py-0.5 text-[11px] font-semibold rounded border transition-colors cursor-pointer ${
                  String(discountValue) === String(num)
                    ? "bg-(--brand) text-white border-(--brand)"
                    : "border-(--border) text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
                }`}
              >
                ₹{num}
              </button>
            ))
          )}
        </div>

        <div className="form-row">
          <Field
            label="Minimum Order Value (₹)"
            optional
            htmlFor="coupon-min"
            error={err("minOrderValue")}
            hint="Cart subtotal must reach this amount. Leave blank for no minimum."
          >
            <input
              id="coupon-min"
              type="number"
              min="0"
              value={minOrderValue}
              onChange={(e) => {
                setMinOrderValue(e.target.value);
                revalidate("minOrderValue", e.target.value);
              }}
              onBlur={() => handleBlur("minOrderValue", minOrderValue)}
              placeholder="e.g. 999"
              className={`form-input ${invalid("minOrderValue")}`}
            />
          </Field>

          <Field
            label="Expiry Date"
            required
            htmlFor="coupon-expiry"
            error={err("expiryDate")}
            hint="Last day the coupon can be used at checkout."
          >
            <input
              id="coupon-expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => {
                setExpiryDate(e.target.value);
                revalidate("expiryDate", e.target.value);
              }}
              onBlur={() => handleBlur("expiryDate", expiryDate)}
              className={`form-input ${invalid("expiryDate")}`}
            />
          </Field>
        </div>

        {/* Quick Expiry Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-(--ink-faint) font-medium">
            Expiry presets:
          </span>
          {[
            { label: "+7 Days", days: 7 },
            { label: "+30 Days", days: 30 },
            { label: "+90 Days", days: 90 },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleDatePreset(preset.days)}
              className="px-2 py-0.5 text-[11px] font-semibold rounded border border-(--border) text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken) transition-colors cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
          <button
            type="button"
            onClick={handleEndOfYear}
            className="px-2 py-0.5 text-[11px] font-semibold rounded border border-(--border) text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken) transition-colors cursor-pointer"
          >
            End of Year
          </button>
        </div>

        <div className="form-row">
          <Field
            label="Total Usage Limit"
            optional
            htmlFor="coupon-usage-limit"
            error={err("usageLimit")}
            hint="Maximum total times this coupon can be used across all shoppers. Leave blank for unlimited."
          >
            <input
              id="coupon-usage-limit"
              type="number"
              min="1"
              value={usageLimit}
              onChange={(e) => {
                setUsageLimit(e.target.value);
                revalidate("usageLimit", e.target.value);
              }}
              onBlur={() => handleBlur("usageLimit", usageLimit)}
              placeholder="e.g. 100 (unlimited if empty)"
              className={`form-input ${invalid("usageLimit")}`}
            />
          </Field>

          <Field
            label="Per-Customer Limit"
            optional
            htmlFor="coupon-user-limit"
            error={err("perUserLimit")}
            hint="Max times a single customer can apply it. Leave blank for unlimited."
          >
            <input
              id="coupon-user-limit"
              type="number"
              min="1"
              value={perUserLimit}
              onChange={(e) => {
                setPerUserLimit(e.target.value);
                revalidate("perUserLimit", e.target.value);
              }}
              onBlur={() => handleBlur("perUserLimit", perUserLimit)}
              placeholder="e.g. 1 (recommended)"
              className={`form-input ${invalid("perUserLimit")}`}
            />
          </Field>
        </div>

        <Field
          label="Coupon Status"
          htmlFor="coupon-status"
          hint="Paused coupons stay preserved in your dashboard but cannot be redeemed at checkout."
        >
          <select
            id="coupon-status"
            value={isActive ? "active" : "inactive"}
            onChange={(e) => setIsActive(e.target.value === "active")}
            className="form-select"
          >
            <option value="active">Active (Usable by customers)</option>
            <option value="inactive">Paused (Temporarily disabled)</option>
          </select>
        </Field>
      </form>
    </Drawer>
  );
};

export default CouponModal;
