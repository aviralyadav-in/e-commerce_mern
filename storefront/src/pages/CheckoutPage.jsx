import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  CreditCard,
  Plus,
  Check,
  AlertCircle,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Banknote,
  Smartphone,
  Tag,
  X,
  ChevronDown,
  Truck,
  ClipboardList,
} from "lucide-react";
import { useAuthStore } from "../stores/authStore";
import { useCartStore } from "../stores/cartStore";
import { useSettingsStore } from "../stores/settingsStore";
import { api } from "../lib/api";
import { cn, formatCurrency, getProductImages, pluralize } from "../lib/utils";
import usePageTitle from "../hooks/usePageTitle";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import ImageWithFallback from "../components/common/ImageWithFallback";
import FormField from "../components/common/FormField";
import TrustStrip from "../components/common/TrustStrip";
import StatusBadge from "../components/common/StatusBadge";
import PageLoader, { Spinner } from "../components/common/PageLoader";

/* -------------------------------------------------------------------------- */
/* Static config                                                              */
/* -------------------------------------------------------------------------- */

const STEPS = [
  { id: 1, label: "Address" },
  { id: 2, label: "Payment" },
  { id: 3, label: "Review" },
];

const EMPTY_ADDRESS_FORM = {
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
  isDefault: true,
};

// Field order drives the two-column layout: [first, last] [phone, pincode]
// [line 1 — full width] [line 2, landmark] [city, state].
const ADDRESS_FIELDS = [
  { key: "firstName", label: "First name", required: true, autoComplete: "given-name" },
  { key: "lastName", label: "Last name", required: true, autoComplete: "family-name" },
  {
    key: "phone",
    label: "Mobile number",
    required: true,
    type: "tel",
    maxLength: 10,
    inputMode: "numeric",
    placeholder: "10-digit mobile",
    hint: "10 digits, starting with 6–9",
    autoComplete: "tel-national",
  },
  {
    key: "zipCode",
    label: "Pincode",
    required: true,
    maxLength: 6,
    inputMode: "numeric",
    placeholder: "6 digits",
    autoComplete: "postal-code",
  },
  {
    key: "addressLine1",
    label: "Address line 1",
    required: true,
    span: 2,
    placeholder: "Flat, house no., building",
    autoComplete: "address-line1",
  },
  { key: "addressLine2", label: "Address line 2", placeholder: "Area, street", autoComplete: "address-line2" },
  { key: "landmark", label: "Landmark", placeholder: "Near…" },
  { key: "city", label: "City", required: true, autoComplete: "address-level2" },
  { key: "state", label: "State", required: true, autoComplete: "address-level1" },
];

const ADDRESS_TYPES = ["HOME", "WORK", "OTHER"];

/* -------------------------------------------------------------------------- */
/* Small local building blocks                                                */
/* -------------------------------------------------------------------------- */

function StepIndicator({ current, className }) {
  return (
    <ol aria-label="Checkout progress" className={cn("flex items-center", className)}>
      {STEPS.map((step, i) => {
        const done = step.id < current;
        const active = step.id === current;
        return (
          <React.Fragment key={step.id}>
            <li
              aria-current={active ? "step" : undefined}
              className="flex items-center gap-2 sm:gap-2.5"
            >
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-300",
                  active && "bg-primary text-primary-foreground shadow-soft",
                  done && "bg-gold-soft text-gold-ink",
                  !active && !done && "border border-line-strong text-ink-soft"
                )}
              >
                {done ? <Check className="size-4" strokeWidth={2.5} aria-hidden="true" /> : step.id}
                <span className="sr-only">{done ? " completed" : active ? " current" : ""}</span>
              </span>
              <span
                className={cn(
                  "text-micro whitespace-nowrap",
                  active ? "text-foreground" : done ? "text-gold-ink" : "text-ink-soft",
                  // On narrow screens only the current step keeps its label
                  !active && "sr-only sm:not-sr-only"
                )}
              >
                {step.label}
              </span>
            </li>
            {i < STEPS.length - 1 && (
              <li role="presentation" aria-hidden="true" className="mx-1.5 h-px w-5 shrink-0 bg-line sm:mx-3 sm:w-10" />
            )}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function SectionHead({ step, icon: Icon, title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-line pb-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-ink">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-micro text-ink-soft">Step {step}</p>
          <h2 className="text-h3 text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-small text-ink-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/** Arrow-key movement for the custom radio groups (address / payment cards). */
function moveRadioFocus(e, values, currentValue, select) {
  const delta = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
  if (!delta || values.length === 0) return;
  e.preventDefault();
  const idx = Math.max(0, values.indexOf(currentValue));
  const nextValue = values[(idx + delta + values.length) % values.length];
  select(nextValue);
  const group = e.currentTarget.closest('[role="radiogroup"]');
  const target = group?.querySelector(`[role="radio"][data-value="${nextValue}"]`);
  target?.focus();
}

function formatAddressLines(addr) {
  const first = [addr.addressLine1, addr.addressLine2, addr.landmark ? `Near ${addr.landmark}` : ""]
    .filter(Boolean)
    .join(", ");
  const second = `${addr.city}, ${addr.state} — ${addr.zipCode}`;
  return [first, second];
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CheckoutPage() {
  usePageTitle("Checkout");

  const { user, authChecked } = useAuthStore();
  const {
    cart,
    clearCart,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon,
    couponLoading,
    loading: cartLoading,
    openCart,
  } = useCartStore();
  const { settings } = useSettingsStore();

  const freeShippingFloor = Number(settings?.freeShippingThreshold ?? 500);
  const standardShippingFee = Number(settings?.shippingFee ?? 50);
  const codEnabled = settings?.codEnabled !== undefined ? Boolean(settings.codEnabled) : true;
  const codFee = Number(settings?.codFee ?? 0);
  const deliveryEta = settings?.estimatedDeliveryDays || "2–4 business days";

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(codEnabled ? "COD" : "UPI");
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [confirmedItems, setConfirmedItems] = useState([]);

  // Inline "add a new address" form state
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressFormError, setAddressFormError] = useState("");
  const [addressFormData, setAddressFormData] = useState(EMPTY_ADDRESS_FORM);

  // Coupon + mobile summary UI state
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [couponOpen, setCouponOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const items = cart?.items || [];
  const itemCount = items.reduce((s, it) => s + (it.quantity || 1), 0);
  const subtotal = cart?.totalPrice || 0;
  const afterDiscount = Math.max(0, subtotal - (discountAmount || 0));
  const isFreeShipping = subtotal > 0 && afterDiscount >= freeShippingFloor;
  const shippingFee = subtotal > 0 ? (isFreeShipping ? 0 : standardShippingFee) : 0;
  const extraCodCharge = paymentMethod === "COD" ? codFee : 0;
  const totalAmount = Math.max(0, afterDiscount + shippingFee + extraCodCharge);

  // Derived step (there is no explicit step state in the flow)
  const addressDone = Boolean(selectedAddressId);
  const paymentDone = addressDone && Boolean(paymentMethod);
  const currentStep = !addressDone ? 1 : !paymentDone ? 2 : 3;

  const canPlaceOrder = !placingOrder && items.length > 0 && Boolean(selectedAddressId);

  // Fetch addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoadingAddresses(true);
        const res = await api.get("/addresses");
        const list = res.data?.addresses || [];
        setAddresses(list);
        // Select default address or first address
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddressId(def._id);
      } catch (err) {
        console.error("Failed to load addresses:", err);
      } finally {
        setLoadingAddresses(false);
      }
    };

    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const updateAddressField = (key, value) =>
    setAddressFormData((prev) => ({ ...prev, [key]: value }));

  // Handle New Address Form Submit
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setAddressFormError("");

    // Validate 10-digit phone
    if (!/^[6-9]\d{9}$/.test(addressFormData.phone)) {
      setAddressFormError("Please enter a valid 10-digit Indian mobile number (starts with 6-9)");
      return;
    }

    // Validate 6-digit pincode
    if (!/^[1-9][0-9]{5}$/.test(addressFormData.zipCode)) {
      setAddressFormError("Please enter a valid 6-digit Indian Pincode");
      return;
    }

    try {
      setSavingAddress(true);
      const res = await api.post("/addresses", addressFormData);
      if (res.data?.address) {
        const newAddress = res.data.address;
        setAddresses((prev) => [newAddress, ...prev]);
        setSelectedAddressId(newAddress._id);
        setIsAddressFormOpen(false);
        // Reset form
        setAddressFormData({ ...EMPTY_ADDRESS_FORM, isDefault: false });
      }
    } catch (err) {
      setAddressFormError(
        err.response?.data?.message || "Failed to save address. Please check all fields."
      );
    } finally {
      setSavingAddress(false);
    }
  };

  // Coupon (same store calls as the bag drawer)
  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError("");
    setCouponSuccess("");
    if (!couponInput.trim()) return;

    const res = await applyCoupon(couponInput.trim());
    if (res.success) {
      setCouponSuccess(res.message);
      setCouponInput("");
      setCouponOpen(false);
    } else {
      setCouponError(res.message);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponSuccess("");
    setCouponError("");
  };

  // Place Order
  const handlePlaceOrder = async () => {
    setOrderError("");

    if (!selectedAddressId) {
      setOrderError("Please select or add a delivery address.");
      return;
    }

    if (items.length === 0) {
      setOrderError("Your shopping bag is empty.");
      return;
    }

    try {
      setPlacingOrder(true);
      const payload = {
        shippingAddress: selectedAddressId,
        orderItems: items.map((it) => ({
          product: it.product?._id || it.product?.id || it.product,
          variantName: it.variantName || null,
          quantity: it.quantity || 1,
        })),
        paymentMethod,
        couponCode: appliedCoupon?.code || undefined,
      };

      const res = await api.post("/orders", payload);
      if (res.data?.order) {
        setConfirmedItems(items);
        setConfirmedOrder(res.data.order);
        clearCart();
      }
    } catch (err) {
      setOrderError(
        err.response?.data?.message || "Order placement failed. Please verify stock availability."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* Gates                                                                    */
  /* ------------------------------------------------------------------------ */

  if (!authChecked) {
    return <PageLoader label="Preparing your checkout" />;
  }

  // If not logged in, prompt sign in
  if (!user) {
    return (
      <div className="container-x page-top section-tight">
        <div className="surface-card mx-auto max-w-md p-8 text-center sm:p-10">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold-soft text-gold-ink">
            <Lock className="size-6" aria-hidden="true" />
          </div>
          <p className="eyebrow mt-6">Secure checkout</p>
          <h1 className="text-h2 mt-3 text-foreground">Sign in to continue</h1>
          <p className="mx-auto mt-3 max-w-sm text-small text-ink-muted">
            Your bag is saved. Sign in or create an account so we can keep your order details and
            delivery addresses safe.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link to="/login?redirect=/checkout" className="btn btn-primary btn-lg btn-block btn-luxury">
              <span>Sign in to continue</span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/signup?redirect=/checkout" className="btn btn-secondary btn-block">
              Create an account
            </Link>
          </div>
          <TrustStrip variant="row" className="mt-8 justify-center" />
        </div>
      </div>
    );
  }

  // Order Confirmation
  if (confirmedOrder) {
    const firstName = String(user?.name || "").trim().split(" ")[0];
    const confirmedCount = confirmedItems.reduce((s, it) => s + (it.quantity || 1), 0);
    return (
      <div className="container-x page-top section-tight">
        <div className="surface-card mx-auto max-w-2xl animate-fade-up p-8 text-center sm:p-12">
          <div className="gold-glow mx-auto flex size-16 items-center justify-center rounded-full bg-champagne text-onyx">
            <Check className="size-8" strokeWidth={2.5} aria-hidden="true" />
          </div>
          <p className="eyebrow mt-7 flex items-center justify-center gap-3">
            <span className="inline-block h-px w-7 bg-champagne" aria-hidden="true" />
            Order confirmed
            <span className="inline-block h-px w-7 bg-champagne" aria-hidden="true" />
          </p>
          <h1 className="text-h1 mt-3 text-foreground">
            Thank you{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-body text-ink-muted">
            Your order has been received and our atelier is preparing it with care. Estimated
            delivery: <span className="font-semibold text-foreground">{deliveryEta}</span>.
          </p>
          <p className="mt-4 inline-flex flex-wrap items-center justify-center gap-2 text-small text-ink-muted">
            <span>Order number</span>
            <span className="rounded-lg bg-surface-2 px-2.5 py-1 font-mono text-xs font-semibold tracking-wide text-foreground">
              #{confirmedOrder._id}
            </span>
          </p>

          <div className="surface-panel mt-8 p-5 text-left">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <p className="text-small font-semibold text-foreground">
                {pluralize(confirmedCount, "item")}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="pill pill-muted">{confirmedOrder.paymentMethod}</span>
                <StatusBadge status={confirmedOrder.paymentStatus} type="payment" />
              </div>
            </div>
            {confirmedItems.length > 0 && (
              <ul className="divide-y divide-line">
                {confirmedItems.map((it, idx) => {
                  const prod = it.product || {};
                  const price = it.price || prod.discountPrice || prod.price || 0;
                  return (
                    <li key={idx} className="flex items-center gap-3 py-3">
                      <ImageWithFallback
                        src={getProductImages(prod, it.variantName)[0]}
                        alt=""
                        ratio="1/1"
                        className="w-12 shrink-0 rounded-lg border border-line"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-small font-semibold text-foreground">
                          {prod.name || "Handcrafted leather bag"}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {it.variantName ? `${it.variantName} · ` : ""}Qty {it.quantity || 1}
                        </p>
                      </div>
                      <span className="price text-small text-foreground">
                        {formatCurrency(price * (it.quantity || 1))}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <dl className="space-y-1.5 border-t border-line pt-3 text-small">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="price text-foreground">{formatCurrency(confirmedOrder.itemsPrice)}</dd>
              </div>
              {Number(confirmedOrder.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">
                    Discount{confirmedOrder.couponCode ? ` · ${confirmedOrder.couponCode}` : ""}
                  </dt>
                  <dd className="price text-gold-ink">−{formatCurrency(confirmedOrder.discountAmount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-muted">Shipping</dt>
                <dd>
                  {Number(confirmedOrder.shippingPrice) > 0 ? (
                    <span className="price text-foreground">{formatCurrency(confirmedOrder.shippingPrice)}</span>
                  ) : (
                    <span className="font-semibold text-success">Complimentary</span>
                  )}
                </dd>
              </div>
              {Number(confirmedOrder.codFee) > 0 && (
                <div className="flex justify-between">
                  <dt className="text-ink-muted">COD fee</dt>
                  <dd className="price text-foreground">{formatCurrency(confirmedOrder.codFee)}</dd>
                </div>
              )}
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-serif text-base font-semibold text-foreground">Total</dt>
                <dd className="price text-2xl text-foreground">{formatCurrency(confirmedOrder.totalAmount)}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/account/orders" className="btn btn-primary btn-lg btn-luxury">
              <span>Track your order</span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <Link to="/shop" className="btn btn-secondary btn-lg">
              Continue shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty bag
  if (items.length === 0) {
    if (cartLoading) {
      return <PageLoader label="Fetching your bag" />;
    }
    return (
      <div className="container-x page-top section-tight">
        <PageHeader
          size="compact"
          breadcrumbs={[{ label: "Home", to: "/" }, { label: "Bag" }, { label: "Checkout" }]}
          title="Checkout"
          description="Secure checkout · encrypted"
        />
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          description="Add a piece or two before heading to checkout — every bag is handcrafted in full-grain leather."
          action={{ label: "Explore the collection", to: "/shop" }}
        />
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Main checkout                                                            */
  /* ------------------------------------------------------------------------ */

  const addressIds = addresses.map((a) => a._id);
  const showAddressForm = isAddressFormOpen || (!loadingAddresses && addresses.length === 0);

  const paymentOptions = [
    {
      value: "COD",
      label: "Cash on delivery",
      icon: Banknote,
      disabled: !codEnabled,
      hint: !codEnabled
        ? "Currently unavailable"
        : codFee > 0
          ? `Pay when it arrives · +${formatCurrency(codFee)} COD fee`
          : "Pay cash or UPI when your order arrives",
    },
    { value: "UPI", label: "UPI", icon: Smartphone, hint: "Google Pay, PhonePe, Paytm, BHIM" },
    { value: "Card", label: "Card", icon: CreditCard, hint: "Visa, Mastercard, RuPay & Amex" },
  ];
  const enabledPaymentValues = paymentOptions.filter((o) => !o.disabled).map((o) => o.value);

  const placeOrderButton = (extraClass) => (
    <button
      type="button"
      onClick={handlePlaceOrder}
      disabled={!canPlaceOrder}
      aria-busy={placingOrder || undefined}
      className={cn("btn btn-primary btn-lg btn-block btn-luxury", extraClass)}
    >
      {placingOrder ? (
        <Spinner className="size-4 border-current/30 border-t-current" />
      ) : (
        <Lock aria-hidden="true" />
      )}
      <span>{placingOrder ? "Placing order" : "Place order"}</span>
    </button>
  );

  const orderErrorBox = orderError ? (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-small text-danger"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{orderError}</span>
    </div>
  ) : null;

  return (
    <div className="container-x page-top section-tight pb-32 lg:pb-14">
      <PageHeader
        size="compact"
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Bag" }, { label: "Checkout" }]}
        title="Checkout"
        description={
          <span className="inline-flex items-center gap-2">
            <Lock className="size-3.5 text-gold-ink" aria-hidden="true" />
            Secure checkout · encrypted
          </span>
        }
        action={<StepIndicator current={currentStep} />}
      />

      {/* Mobile: collapsible order summary bar */}
      <button
        type="button"
        onClick={() => setSummaryOpen((v) => !v)}
        aria-expanded={summaryOpen}
        aria-controls="checkout-summary"
        className="surface-panel mb-5 flex h-14 w-full items-center justify-between px-4 text-left lg:hidden"
      >
        <span className="inline-flex items-center gap-2 text-small font-semibold text-foreground">
          <ShoppingBag className="size-4 text-gold-ink" aria-hidden="true" />
          Order summary
          <span className="font-normal text-ink-soft">· {pluralize(itemCount, "item")}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="price text-base text-foreground">{formatCurrency(totalAmount)}</span>
          <ChevronDown
            className={cn("size-4 text-ink-soft transition-transform duration-300", summaryOpen && "rotate-180")}
            aria-hidden="true"
          />
        </span>
      </button>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
        {/* ================================================================ */}
        {/* RIGHT: order summary (first in DOM so it sits on top on mobile) */}
        {/* ================================================================ */}
        <aside
          id="checkout-summary"
          aria-label="Order summary"
          className={cn("lg:order-last lg:sticky lg:top-28", !summaryOpen && "hidden lg:block")}
        >
          <div className="surface-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <h2 className="text-h3 text-foreground">Order summary</h2>
              <span className="pill pill-muted">{pluralize(itemCount, "item")}</span>
            </div>

            {/* Coupon */}
            <div className="mt-4">
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="pill pill-success h-8 pl-3 pr-1.5 text-[11px]">
                    <Tag className="size-3" aria-hidden="true" />
                    <span>{appliedCoupon.code}</span>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="ml-0.5 inline-flex size-5 items-center justify-center rounded-full transition-colors hover:bg-success/15"
                      aria-label={`Remove coupon ${appliedCoupon.code}`}
                    >
                      <X className="size-3" aria-hidden="true" />
                    </button>
                  </span>
                  <span className="text-small text-ink-muted">{couponSuccess || "Promo applied"}</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setCouponOpen((v) => !v)}
                    aria-expanded={couponOpen}
                    aria-controls="checkout-coupon-form"
                    className="flex w-full items-center justify-between rounded-lg py-1 text-small font-semibold text-foreground transition-colors hover:text-gold-ink"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Tag className="size-4 text-gold-ink" aria-hidden="true" />
                      Have a promo code?
                    </span>
                    <ChevronDown
                      className={cn("size-4 text-ink-soft transition-transform duration-300", couponOpen && "rotate-180")}
                      aria-hidden="true"
                    />
                  </button>
                  {couponOpen && (
                    <form id="checkout-coupon-form" onSubmit={handleApplyCoupon} className="mt-3 flex gap-2">
                      <label htmlFor="checkout-coupon-input" className="sr-only">
                        Promo code
                      </label>
                      <input
                        id="checkout-coupon-input"
                        type="text"
                        autoComplete="off"
                        autoFocus
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value);
                          setCouponError("");
                        }}
                        placeholder="Enter code"
                        aria-invalid={couponError ? "true" : undefined}
                        aria-describedby={couponError ? "checkout-coupon-error" : undefined}
                        className="input-luxury h-11 text-sm uppercase tracking-wider"
                      />
                      <button
                        type="submit"
                        disabled={couponLoading || !couponInput.trim()}
                        aria-busy={couponLoading || undefined}
                        className="btn btn-primary btn-sm h-11 shrink-0"
                      >
                        {couponLoading && <Spinner className="size-4 border-current/30 border-t-current" />}
                        <span>Apply</span>
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <p id="checkout-coupon-error" role="alert" className="field-error">
                      {couponError}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Totals */}
            <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-small">
              <div className="flex items-center justify-between">
                <dt className="text-ink-muted">Subtotal</dt>
                <dd className="price text-foreground">{formatCurrency(subtotal)}</dd>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">
                    Discount{appliedCoupon?.code ? ` · ${appliedCoupon.code}` : ""}
                  </dt>
                  <dd className="price text-gold-ink">−{formatCurrency(discountAmount)}</dd>
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <dt className="text-ink-muted">
                  Shipping
                  <span className="mt-0.5 block text-xs text-ink-soft">
                    Complimentary above {formatCurrency(freeShippingFloor)}
                  </span>
                </dt>
                <dd className="text-right">
                  {shippingFee === 0 ? (
                    <span className="font-semibold text-success">Complimentary</span>
                  ) : (
                    <span className="price text-foreground">{formatCurrency(shippingFee)}</span>
                  )}
                </dd>
              </div>
              {extraCodCharge > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-ink-muted">COD fee</dt>
                  <dd className="price text-foreground">{formatCurrency(extraCodCharge)}</dd>
                </div>
              )}
              {subtotal > 0 && !isFreeShipping && (
                <p className="flex items-center gap-2 rounded-lg bg-gold-soft px-3 py-2 text-xs text-gold-ink">
                  <Truck className="size-3.5 shrink-0" aria-hidden="true" />
                  Add {formatCurrency(freeShippingFloor - afterDiscount)} more for complimentary delivery
                </p>
              )}
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <dt className="font-serif text-lg font-semibold text-foreground">Total</dt>
                <dd className="price text-2xl text-foreground">{formatCurrency(totalAmount)}</dd>
              </div>
            </dl>

            <div className="mt-5 space-y-3">
              <div className="hidden lg:block">{orderErrorBox}</div>
              <div className="hidden lg:block">{placeOrderButton()}</div>
              {!selectedAddressId && (
                <p className="text-center text-xs text-ink-soft">
                  Select or add a delivery address to place your order.
                </p>
              )}
              <p className="text-center text-xs leading-relaxed text-ink-soft">
                By placing this order you agree to Niya Bags’ Terms of Sale and Privacy Policy.
              </p>
            </div>

            <TrustStrip variant="row" className="mt-5 justify-center gap-x-5 border-t border-line pt-5" />

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={openCart}
                className="link-underline inline-flex items-center gap-1.5 text-small font-semibold text-foreground hover:text-gold-ink"
              >
                <ArrowLeft className="size-3.5" aria-hidden="true" />
                Back to bag
              </button>
            </div>
          </div>
        </aside>

        {/* ================================================================ */}
        {/* LEFT: address, payment, review                                    */}
        {/* ================================================================ */}
        <div className="min-w-0 space-y-6">
          {/* ---------------- Step 1: Address ---------------- */}
          <section aria-labelledby="checkout-address-title" className="surface-card p-5 sm:p-6">
            <SectionHead
              step={1}
              icon={MapPin}
              title={<span id="checkout-address-title">Delivery address</span>}
              description="Where should we send your order?"
              action={
                !showAddressForm && (
                  <button
                    type="button"
                    onClick={() => setIsAddressFormOpen(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Plus aria-hidden="true" />
                    <span>Add a new address</span>
                  </button>
                )
              }
            />

            {loadingAddresses ? (
              <div className="grid gap-3 sm:grid-cols-2" aria-busy="true" aria-label="Loading saved addresses">
                {[0, 1].map((i) => (
                  <div key={i} className="skeleton-shimmer h-32 rounded-2xl" />
                ))}
              </div>
            ) : addresses.length > 0 ? (
              <div role="radiogroup" aria-label="Saved addresses" className="grid gap-3 sm:grid-cols-2">
                {addresses.map((addr, idx) => {
                  const isSelected = selectedAddressId === addr._id;
                  const [line1, line2] = formatAddressLines(addr);
                  const tabbable = isSelected || (!selectedAddressId && idx === 0);
                  return (
                    <button
                      key={addr._id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      data-value={addr._id}
                      tabIndex={tabbable ? 0 : -1}
                      onClick={() => setSelectedAddressId(addr._id)}
                      onKeyDown={(e) => moveRadioFocus(e, addressIds, selectedAddressId, setSelectedAddressId)}
                      className={cn(
                        "relative w-full rounded-2xl border p-4 pr-11 text-left transition-all duration-300",
                        isSelected
                          ? "border-transparent bg-gold-soft/70 ring-2 ring-champagne"
                          : "border-line bg-surface hover:border-line-strong hover:bg-surface-2/60"
                      )}
                    >
                      <p className="text-small font-semibold text-foreground">
                        {addr.firstName} {addr.lastName}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <span className="pill pill-muted">{addr.addressType || "HOME"}</span>
                        {addr.isDefault && <span className="pill pill-gold">Default</span>}
                      </div>
                      <p className="mt-2.5 text-small leading-relaxed text-ink-muted">
                        {line1}
                        <br />
                        {line2}
                      </p>
                      <p className="mt-1 text-small tabular-nums text-ink-muted">{addr.phone}</p>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute right-3.5 top-3.5 flex size-5 items-center justify-center rounded-full border transition-colors duration-300",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-line-strong bg-surface"
                        )}
                      >
                        {isSelected && <Check className="size-3" strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : (
              !showAddressForm && (
                <p className="text-small text-ink-muted">You have no saved addresses yet.</p>
              )
            )}

            {!loadingAddresses && addresses.length > 0 && (
              <p className="mt-4 text-xs text-ink-soft">
                Need to edit an address?{" "}
                <Link to="/account/addresses" className="link-gold">
                  Manage addresses
                </Link>
              </p>
            )}

            {/* Inline add-address form */}
            {showAddressForm && (
              <form
                onSubmit={handleSaveAddress}
                className={cn(
                  "rounded-2xl border border-line bg-surface-2/50 p-4 sm:p-5",
                  addresses.length > 0 && "mt-5"
                )}
                aria-label="Add a new address"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-h4 text-foreground">
                    {addresses.length === 0 ? "Add your delivery address" : "New address"}
                  </h3>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddressFormOpen(false);
                        setAddressFormError("");
                      }}
                      className="icon-btn -mr-2 size-9"
                      aria-label="Close address form"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {ADDRESS_FIELDS.map((f) => (
                    <FormField
                      key={f.key}
                      label={f.label}
                      required={Boolean(f.required)}
                      hint={f.hint}
                      className={cn(f.span === 2 && "sm:col-span-2")}
                    >
                      <input
                        type={f.type || "text"}
                        required={Boolean(f.required)}
                        maxLength={f.maxLength}
                        inputMode={f.inputMode}
                        autoComplete={f.autoComplete}
                        placeholder={f.placeholder}
                        value={addressFormData[f.key]}
                        onChange={(e) => updateAddressField(f.key, e.target.value)}
                        className="input-luxury"
                      />
                    </FormField>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="label-luxury">Address type</p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Address type">
                      {ADDRESS_TYPES.map((type) => {
                        const active = addressFormData.addressType === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            aria-pressed={active}
                            onClick={() => updateAddressField("addressType", type)}
                            className={cn("chip h-9 px-3.5 text-[11px] uppercase tracking-wider", active && "chip-active")}
                          >
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="inline-flex cursor-pointer items-center gap-2.5 text-small text-foreground">
                    <input
                      type="checkbox"
                      checked={addressFormData.isDefault}
                      onChange={(e) => updateAddressField("isDefault", e.target.checked)}
                      className="size-4 accent-champagne"
                    />
                    <span>Set as default</span>
                  </label>
                </div>

                {addressFormError && (
                  <div
                    role="alert"
                    className="mt-4 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2.5 text-small text-danger"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{addressFormError}</span>
                  </div>
                )}

                <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddressFormOpen(false);
                        setAddressFormError("");
                      }}
                      className="btn btn-ghost"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={savingAddress}
                    aria-busy={savingAddress || undefined}
                    className="btn btn-primary btn-luxury"
                  >
                    {savingAddress && <Spinner className="size-4 border-current/30 border-t-current" />}
                    <span>Save address</span>
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* ---------------- Step 2: Payment ---------------- */}
          <section aria-labelledby="checkout-payment-title" className="surface-card p-5 sm:p-6">
            <SectionHead
              step={2}
              icon={CreditCard}
              title={<span id="checkout-payment-title">Payment method</span>}
              description="All payments are processed over an encrypted connection."
            />
            <div role="radiogroup" aria-label="Payment method" className="grid gap-3 sm:grid-cols-3">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = paymentMethod === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    data-value={opt.value}
                    disabled={opt.disabled}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => !opt.disabled && setPaymentMethod(opt.value)}
                    onKeyDown={(e) => moveRadioFocus(e, enabledPaymentValues, paymentMethod, setPaymentMethod)}
                    className={cn(
                      "relative flex w-full items-start gap-3 rounded-2xl border p-4 pr-10 text-left transition-all duration-300",
                      opt.disabled && "cursor-not-allowed opacity-50",
                      isSelected
                        ? "border-transparent bg-gold-soft/70 ring-2 ring-champagne"
                        : "border-line bg-surface hover:border-line-strong hover:bg-surface-2/60"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-surface-2 text-gold-ink"
                      )}
                    >
                      <Icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-small font-semibold text-foreground">{opt.label}</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink-muted">{opt.hint}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute right-3.5 top-3.5 flex size-5 items-center justify-center rounded-full border transition-colors duration-300",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-line-strong bg-surface"
                      )}
                    >
                      {isSelected && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ---------------- Step 3: Review ---------------- */}
          <section aria-labelledby="checkout-review-title" className="surface-card p-5 sm:p-6">
            <SectionHead
              step={3}
              icon={ClipboardList}
              title={<span id="checkout-review-title">Review your order</span>}
              description={`${pluralize(itemCount, "item")} in your bag`}
              action={
                <button type="button" onClick={openCart} className="btn btn-ghost btn-sm">
                  <ShoppingBag aria-hidden="true" />
                  <span>Edit bag</span>
                </button>
              }
            />
            <ul className="divide-y divide-line">
              {items.map((it, idx) => {
                const prod = it.product || {};
                const productId = prod._id || prod.id || prod;
                const price = it.price || prod.discountPrice || prod.price || 0;
                const qty = it.quantity || 1;
                const name = prod.name || "Handcrafted leather bag";
                return (
                  <li key={`${productId}-${it.variantName || "plain"}-${idx}`} className="flex items-center gap-4 py-3.5">
                    <ImageWithFallback
                      src={getProductImages(prod, it.variantName)[0]}
                      alt={name}
                      ratio="1/1"
                      className="w-16 shrink-0 rounded-xl border border-line"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/product/${productId}`}
                        className="line-clamp-2 font-serif text-[15px] font-semibold leading-snug text-foreground transition-colors hover:text-gold-ink"
                      >
                        {name}
                      </Link>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-muted">
                        {it.variantName && <span className="pill pill-muted">{it.variantName}</span>}
                        <span>Qty {qty}</span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatCurrency(price)} each</span>
                      </div>
                    </div>
                    <span className="price text-base text-foreground">{formatCurrency(price * qty)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* Mobile: sticky place-order bar */}
      <div className="surface-glass fixed inset-x-0 bottom-0 z-30 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        {orderError && (
          <p role="alert" className="mb-2 flex items-center gap-2 text-xs text-danger">
            <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
            {orderError}
          </p>
        )}
        <div className="flex items-center gap-4">
          <div className="min-w-0 shrink-0">
            <p className="text-micro text-ink-soft">Total</p>
            <p className="price text-lg leading-tight text-foreground">{formatCurrency(totalAmount)}</p>
          </div>
          {placeOrderButton("h-12 flex-1")}
        </div>
      </div>
    </div>
  );
}
