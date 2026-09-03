import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import useFormSync from "../../hooks/useFormSync";
import { addCoupon, updateCoupon } from "../../features/coupons/couponsSlice";
import Drawer from "../common/Drawer";
import { Field, FormAlert } from "../common/Field";
import { formatCurrency } from "../../utils/format";
import { TagIcon } from "../common/Icon";

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

  // Re-seed form state whenever the drawer opens for a different record.
  // (Render-phase sync via useFormSync — replaces the old setState-in-effect.)
  useFormSync(`${isOpen}|${editData?._id ?? ""}`, () => {
    if (editData) {
      setCode(editData.code || "");
      setDiscountType(editData.discountType || "percentage");
      setDiscountValue(editData.discountValue || "");
      setMinOrderValue(editData.minOrderValue || "");
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
      if (new Date(ed) < today)
        errs.expiryDate = "Expiry date must be today or in the future.";
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
    setTouched({
      code: true,
      discountValue: true,
      minOrderValue: true,
      expiryDate: true,
    });
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

    const action = editData
      ? updateCoupon({ id: editData._id, data: couponData })
      : addCoupon(couponData);

    dispatch(action).then((res) => {
      if (!res.error) onClose();
    });
  };

  /** Plain-English restatement of the rule, so mistakes are obvious pre-save. */
  const preview = () => {
    if (!code.trim() || !discountValue || Number(discountValue) <= 0)
      return null;
    const off =
      discountType === "percentage"
        ? `${discountValue}% off`
        : `${formatCurrency(discountValue)} off`;
    const floor =
      Number(minOrderValue) > 0
        ? ` on orders above ${formatCurrency(minOrderValue)}`
        : " with no minimum spend";
    return `${code.toUpperCase()} gives ${off}${floor}.`;
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      icon={<TagIcon className="w-4 h-4" />}
      title={editData ? "Edit coupon" : "New coupon"}
      subtitle={
        editData
          ? "Change the discount, floor or expiry for this code."
          : "Create a discount code customers can apply at checkout."
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
        <Field
          label="Coupon code"
          required
          htmlFor="coupon-code"
          error={err("code")}
          hint={err("code") ? undefined : "Shoppers type this at checkout."}
        >
          <input
            id="coupon-code"
            type="text"
            value={code}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setCode(val);
              revalidate("code", val);
            }}
            onBlur={() => handleBlur("code", code)}
            placeholder="SUMMER50"
            className={`form-input form-input-mono font-bold uppercase ${invalid(
              "code",
            )}`}
          />
        </Field>

        <div className="form-row">
          <Field label="Discount type" required htmlFor="coupon-type">
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
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat amount (₹)</option>
            </select>
          </Field>

          <Field
            label={discountType === "percentage" ? "Percent off" : "Amount off"}
            required
            htmlFor="coupon-value"
            error={err("discountValue")}
          >
            <input
              id="coupon-value"
              type="number"
              min="0"
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

        <div className="form-row">
          <Field
            label="Minimum order (₹)"
            optional
            htmlFor="coupon-min"
            error={err("minOrderValue")}
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
              placeholder="999"
              className={`form-input ${invalid("minOrderValue")}`}
            />
          </Field>

          <Field
            label="Expires on"
            required
            htmlFor="coupon-expiry"
            error={err("expiryDate")}
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

        <Field
          label="Status"
          htmlFor="coupon-status"
          hint="Paused coupons stay in the list but stop working at checkout."
        >
          <select
            id="coupon-status"
            value={isActive ? "active" : "inactive"}
            onChange={(e) => setIsActive(e.target.value === "active")}
            className="form-select"
          >
            <option value="active">Active</option>
            <option value="inactive">Paused</option>
          </select>
        </Field>

        {preview() && (
          <div className="flex items-start gap-2 px-3 py-2.5 rounded-(--radius) bg-(--brand-soft) border border-orange-200">
            <TagIcon className="w-4 h-4 text-(--brand) shrink-0 mt-px" />
            <p className="text-[12.5px] text-(--ink-soft)">{preview()}</p>
          </div>
        )}
      </form>
    </Drawer>
  );
};

export default CouponModal;
