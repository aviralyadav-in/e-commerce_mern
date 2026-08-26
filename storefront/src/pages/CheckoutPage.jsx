import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { createOrder } from "../features/orders/ordersSlice";
import { clearCart } from "../features/cart/cartSlice";
import {
  fetchAddresses,
  addAddress,
} from "../features/addresses/addressesSlice";
import { pushToast } from "../features/ui/uiSlice";
import CheckoutSummary from "../components/cart/CheckoutSummary";
import {
  MapPinIcon,
  PhoneIcon,
  CardIcon,
  TruckIcon,
  CheckIcon,
  CheckCircleIcon,
} from "../components/common/Icons";

const PAYMENT_METHODS = [
  {
    value: "COD",
    title: "Cash on Delivery (COD)",
    desc: "Pay cash when your handbag order arrives.",
    Icon: TruckIcon,
  },
  {
    value: "UPI",
    title: "UPI (GPay / PhonePe / Paytm)",
    desc: "Fast and instant UPI payment.",
    Icon: PhoneIcon,
  },
  {
    value: "Card",
    title: "Credit / Debit Card",
    desc: "Secure card gateway checkout.",
    Icon: CardIcon,
  },
];

const EMPTY_FORM = {
  full_name: "",
  phone: "",
  street: "",
  city: "",
  state: "",
  pincode: "",
};

/** Section heading — gold icon circle + eyebrow + serif title */
function SectionHead({ icon: Icon, eyebrow, title }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
      >
        <Icon size={18} />
      </span>
      <span>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="font-display text-xl font-medium leading-tight">
          {title}
        </h2>
      </span>
    </div>
  );
}

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, coupon } = useSelector((s) => s.cart);
  const { placing, error } = useSelector((s) => s.orders);
  const { addresses, loading: addrLoading } = useSelector(
    (s) => s.addresses,
  );
  // Receiver (delivery) details profile se pre-fill karne ke liye
  const user = useSelector((s) => s.auth.user);

  // User dwara manually pick kiya gaya address (null = auto-select default)
  const [pickedId, setPickedId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    full_name: user?.name || "",
    phone: user?.phone || "",
  });
  const [errors, setErrors] = useState({});
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    dispatch(fetchAddresses());
  }, [dispatch]);

  // Default address auto-select — effect ki jagah render ke dauraan derive karte
  // hain (react-hooks/set-state-in-effect fix). Jab tak user ne khud address pick
  // nahi kiya, default (ya pehla) saved address active rahega.
  const defaultAddressId = addresses.length
    ? (addresses.find((a) => a.is_default) || addresses[0])._id
    : null;
  const selectedAddress = pickedId ?? defaultAddressId;

  // Addresses na hon (aur load complete ho) toh form khula rakho
  const formVisible = showForm || (!addrLoading && addresses.length === 0);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const validateForm = () => {
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

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSavingAddr(true);
    const result = await dispatch(addAddress(form));
    setSavingAddr(false);
    if (addAddress.fulfilled.match(result)) {
      dispatch(pushToast("Address saved"));
      setPickedId(result.payload._id);
      setForm({
        ...EMPTY_FORM,
        full_name: user?.name || "",
        phone: user?.phone || "",
      });
      setErrors({});
      setShowForm(false);
    } else {
      dispatch(
        pushToast(result.payload || "Could not save address", "error"),
      );
    }
  };

  const err = (key) =>
    errors[key] ? (
      <p className="mt-1 text-xs" style={{ color: "var(--danger)" }}>
        {errors[key]}
      </p>
    ) : null;

  // Empty cart guard
  if (!cart?.items?.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <p className="eyebrow mb-3">Complete Your Order</p>
        <h1 className="section-title">Your bag is empty</h1>
        <Link to="/shop" className="btn btn-accent mt-8">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      dispatch(pushToast("Please select a shipping address", "error"));
      return;
    }
    const orderItems = cart.items.map((item) => ({
      product: item.product?._id || item.product,
      quantity: item.quantity,
    }));
    const result = await dispatch(
      createOrder({
        shippingAddress: selectedAddress,
        orderItems,
        paymentMethod,
        couponCode: coupon?.code || undefined,
      }),
    );
    if (createOrder.fulfilled.match(result)) {
      dispatch(clearCart());
      dispatch(pushToast("Order placed successfully! 🎉"));
      navigate(`/orders/${result.payload._id}?placed=1`);
    } else {
      dispatch(pushToast(result.payload || "Could not place order", "error"));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      {/* Centered header */}
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <p className="eyebrow mb-3">Complete Your Order</p>
        <h1 className="section-title">Order Details &amp; Checkout</h1>
        <p className="mt-3 text-sm" style={{ color: "var(--ink-muted)" }}>
          Review your selection and enter your delivery details to place your
          order securely.
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        {/* Left: sections */}
        <div className="space-y-6">
          {/* 1. Shipping Details */}
          <section className="card p-6">
            <SectionHead
              icon={MapPinIcon}
              eyebrow="Delivery Address"
              title="Shipping Details"
            />

            {/* Saved addresses */}
            {addresses.length > 0 && (
              <div className="mb-5 space-y-3">
                {addresses.map((addr) => {
                  const active = selectedAddress === addr._id;
                  return (
                    <button
                      key={addr._id}
                      type="button"
                      onClick={() => setPickedId(addr._id)}
                      className="flex w-full items-start justify-between gap-3 rounded-xl p-4 text-left transition-all"
                      style={{
                        background: "var(--bg-raised)",
                        border: active
                          ? "2px solid var(--accent)"
                          : "1px solid var(--border)",
                      }}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">
                          {addr.full_name}
                          {addr.is_default && (
                            <span
                              className="eyebrow ml-2 align-middle"
                              style={{ fontSize: 9 }}
                            >
                              Default
                            </span>
                          )}
                        </p>
                        <p
                          className="mt-0.5 text-xs"
                          style={{ color: "var(--ink-muted)" }}
                        >
                          Phone: {addr.phone}
                        </p>
                        <p
                          className="mt-1 text-sm leading-relaxed"
                          style={{ color: "var(--ink-soft)" }}
                        >
                          {addr.street}, {addr.city}, {addr.state} —{" "}
                          {addr.pincode}
                        </p>
                      </div>
                      <span
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                        style={
                          active
                            ? {
                                background: "var(--accent)",
                                color: "#101d1d",
                              }
                            : {
                                border: "1.5px solid var(--border-strong)",
                                color: "transparent",
                              }
                        }
                      >
                        <CheckIcon size={13} />
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Toggle add-new */}
            {!formVisible && (
              <button
                type="button"
                className="text-xs font-bold underline"
                style={{ color: "var(--accent)" }}
                onClick={() => setShowForm(true)}
              >
                + Add New Address
              </button>
            )}

            {/* Add-new form */}
            {formVisible && (
              <form
                onSubmit={handleSaveAddress}
                className="space-y-4"
                style={{
                  borderTop: addresses.length
                    ? "1px solid var(--border)"
                    : "none",
                  paddingTop: addresses.length ? 20 : 0,
                }}
              >
                {addresses.length > 0 && (
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.16em]"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    New Address
                  </p>
                )}
                <p className="text-xs" style={{ color: "var(--ink-muted)" }}>
                  Receiver's name &amp; phone for delivery — pre-filled from
                  your profile.
                </p>
                <div>
                  <label className="field-label">Full Name *</label>
                  <input
                    className="field"
                    placeholder="Enter your full name"
                    value={form.full_name}
                    onChange={set("full_name")}
                  />
                  {err("full_name")}
                </div>
                <div>
                  <label className="field-label">
                    Street Address / House No. *
                  </label>
                  <textarea
                    rows={2}
                    className="field resize-none"
                    placeholder="House no., street, area"
                    value={form.street}
                    onChange={set("street")}
                  />
                  {err("street")}
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="field-label">City *</label>
                    <input
                      className="field"
                      placeholder="Enter city"
                      value={form.city}
                      onChange={set("city")}
                    />
                    {err("city")}
                  </div>
                  <div>
                    <label className="field-label">State *</label>
                    <input
                      className="field"
                      placeholder="Enter state"
                      value={form.state}
                      onChange={set("state")}
                    />
                    {err("state")}
                  </div>
                  <div>
                    <label className="field-label">PIN Code *</label>
                    <input
                      className="field"
                      maxLength={6}
                      placeholder="Enter PIN code"
                      value={form.pincode}
                      onChange={set("pincode")}
                    />
                    {err("pincode")}
                  </div>
                </div>
                <div>
                  <label className="field-label">Mobile Number *</label>
                  <input
                    className="field"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    value={form.phone}
                    onChange={set("phone")}
                  />
                  {err("phone")}
                </div>
                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    type="submit"
                    className="btn btn-accent"
                    disabled={savingAddr}
                  >
                    {savingAddr ? "Saving…" : "Save & Use This Address"}
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        setShowForm(false);
                        setErrors({});
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>

          {/* 2. Payment Method */}
          <section className="card p-6">
            <SectionHead
              icon={CardIcon}
              eyebrow="Payment Method"
              title="Choose Payment Option"
            />
            <div className="space-y-3">
              {PAYMENT_METHODS.map(({ value, title, desc, Icon }) => {
                const active = paymentMethod === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className="flex w-full items-center justify-between gap-4 rounded-xl p-4 text-left transition-all"
                    style={{
                      background: "var(--bg-raised)",
                      border: active
                        ? "2px solid var(--accent)"
                        : "1px solid var(--border)",
                    }}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={{
                          background: "var(--accent-soft)",
                          color: "var(--accent)",
                        }}
                      >
                        <Icon size={16} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold">
                          {title}
                        </span>
                        <span
                          className="block text-xs"
                          style={{ color: "var(--ink-muted)" }}
                        >
                          {desc}
                        </span>
                      </span>
                    </span>
                    <CheckCircleIcon
                      size={22}
                      filled={active}
                      className="shrink-0"
                      style={{
                        color: active ? "var(--accent)" : "var(--ink-faint)",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right: Order Summary */}
        <aside>
          <CheckoutSummary
            placing={placing}
            canPlace={!!selectedAddress}
            onPlace={handlePlaceOrder}
          />
          {error && (
            <p
              className="mt-3 text-center text-xs"
              style={{ color: "var(--danger)" }}
            >
              {error}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
