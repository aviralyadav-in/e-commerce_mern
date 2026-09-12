import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSettings,
  updateSettings,
  resetSettings,
} from "../features/settings/settingsSlice";
import PageHeader from "../components/common/PageHeader";
import ErrorBanner from "../components/common/ErrorBanner";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  TruckIcon,
  PhoneIcon,
  MailIcon,
  MessageSquareIcon,
  WhatsAppIcon,
  CheckIcon,
  InfoIcon,
  XIcon,
  RefreshIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
} from "../components/common/Icon";
import { getStorefrontUrl } from "../utils/storefrontUrl";
import toast from "react-hot-toast";

// Clean Indian Phone Formatter
const formatIndianPhone = (phone) => {
  if (!phone) return "";
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    const raw = cleaned.slice(2);
    return `+91 ${raw.slice(0, 5)} ${raw.slice(5)}`;
  }
  return phone;
};

const SettingsPage = () => {
  const dispatch = useDispatch();
  const { settings, loading, saving, error } = useSelector(
    (state) => state.settings,
  );

  const [activeTab, setActiveTab] = useState("shipping");
  const [showGuide, setShowGuide] = useState(() => {
    return localStorage.getItem("niya_settings_guide_dismissed") !== "true";
  });
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  // Form State
  const [formData, setFormData] = useState({
    storeName: "Niya Bags",
    supportEmail: "support@niyabags.com",
    supportPhone: "+91 98765 43210",
    storeAddress: "Bandra West, Mumbai, Maharashtra 400050",
    gstin: "27AAACN1234F1Z5",
    freeShippingThreshold: 500,
    shippingFee: 50,
    codEnabled: true,
    codFee: 0,
    estimatedDeliveryDays: "3-5 Business Days",
    announcementText: "✨ Free shipping on all orders above ₹500 across India!",
    announcementEnabled: true,
    socialLinks: {
      instagram: "https://instagram.com/niyabags",
      facebook: "https://facebook.com/niyabags",
      twitter: "https://twitter.com/niyabags",
      youtube: "https://youtube.com/@niyabags",
      whatsapp: "+91 98765 43210",
    },
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings) {
      setFormData({
        storeName: settings.storeName || "Niya Bags",
        supportEmail: settings.supportEmail || "support@niyabags.com",
        supportPhone: formatIndianPhone(settings.supportPhone || "9876543210"),
        storeAddress:
          settings.storeAddress || "Bandra West, Mumbai, Maharashtra 400050",
        gstin: settings.gstin || "27AAACN1234F1Z5",
        freeShippingThreshold: settings.freeShippingThreshold ?? 500,
        shippingFee: settings.shippingFee ?? 50,
        codEnabled: settings.codEnabled ?? true,
        codFee: settings.codFee ?? 0,
        estimatedDeliveryDays:
          settings.estimatedDeliveryDays || "3-5 Business Days",
        announcementText:
          settings.announcementText ||
          "✨ Free shipping on all orders above ₹500 across India!",
        announcementEnabled: settings.announcementEnabled ?? true,
        socialLinks: {
          instagram:
            settings.socialLinks?.instagram || "https://instagram.com/niyabags",
          facebook:
            settings.socialLinks?.facebook || "https://facebook.com/niyabags",
          twitter:
            settings.socialLinks?.twitter || "https://twitter.com/niyabags",
          youtube:
            settings.socialLinks?.youtube || "https://youtube.com/@niyabags",
          whatsapp: formatIndianPhone(
            settings.socialLinks?.whatsapp ||
              settings.supportPhone ||
              "9876543210",
          ),
        },
      });
      setHasChanges(false);
      setErrors({});
    }
  }, [settings]);

  const dismissGuide = () => {
    setShowGuide(false);
    localStorage.setItem("niya_settings_guide_dismissed", "true");
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSocialChange = (platform, value) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
    setHasChanges(true);
    const socialKey = `social_${platform}`;
    if (errors[socialKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[socialKey];
        return next;
      });
    }
  };

  // Comprehensive Client-Side Validation
  const validateForm = () => {
    const errs = {};

    // 1. Store Name
    if (!formData.storeName || formData.storeName.trim().length < 2) {
      errs.storeName = "Store brand name is required (minimum 2 characters)";
    }

    // 2. Support Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.supportEmail || !emailRegex.test(formData.supportEmail.trim())) {
      errs.supportEmail = "Please enter a valid customer support email address";
    }

    // 3. Support Phone
    const digitsOnly = String(formData.supportPhone || "").replace(/\D/g, "");
    if (formData.supportPhone && digitsOnly.length < 10) {
      errs.supportPhone = "Please enter a valid 10-digit Indian phone number";
    }

    // 4. GSTIN (15 characters)
    if (formData.gstin && formData.gstin.trim()) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formData.gstin.trim().toUpperCase())) {
        errs.gstin =
          "Invalid GSTIN. Format: 2 state digits + 10 PAN chars + 1 entity + Z + 1 check digit (e.g. 27AAACN1234F1Z5)";
      }
    }

    // 5. Shipping Threshold
    const threshold = Number(formData.freeShippingThreshold);
    if (isNaN(threshold) || threshold < 0) {
      errs.freeShippingThreshold = "Threshold must be a valid number (>= 0)";
    }

    // 6. Shipping Fee
    const fee = Number(formData.shippingFee);
    if (isNaN(fee) || fee < 0) {
      errs.shippingFee = "Shipping fee must be a valid number (>= 0)";
    }

    // 7. COD Fee
    const codFeeNum = Number(formData.codFee);
    if (isNaN(codFeeNum) || codFeeNum < 0) {
      errs.codFee = "COD fee must be a valid number (>= 0)";
    }

    // 8. Announcement Banner Text
    if (formData.announcementEnabled && (!formData.announcementText || !formData.announcementText.trim())) {
      errs.announcementText = "Banner text is required when the announcement ribbon is enabled";
    }

    // 9. Social Links URLs
    const socialFields = ["instagram", "facebook", "twitter", "youtube"];
    for (const platform of socialFields) {
      const url = formData.socialLinks?.[platform];
      if (url && url.trim()) {
        const trimmed = url.trim();
        if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
          errs[`social_${platform}`] = `${platform.charAt(0).toUpperCase() + platform.slice(1)} URL must start with http:// or https://`;
        }
      }
    }

    setErrors(errs);
    return errs;
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const validationErrors = validateForm();
    const errorKeys = Object.keys(validationErrors);

    if (errorKeys.length > 0) {
      // Auto-navigate to tab containing the first error
      const firstError = errorKeys[0];
      if (
        ["freeShippingThreshold", "shippingFee", "codFee"].includes(firstError)
      ) {
        setActiveTab("shipping");
      } else if (
        [
          "storeName",
          "supportEmail",
          "supportPhone",
          "gstin",
          "social_instagram",
          "social_facebook",
          "social_twitter",
          "social_youtube",
        ].includes(firstError)
      ) {
        setActiveTab("identity");
      } else if (firstError === "announcementText") {
        setActiveTab("announcement");
      }

      toast.error(validationErrors[firstError], { duration: 4000 });
      return;
    }

    dispatch(updateSettings(formData)).then((res) => {
      if (!res.error) {
        setHasChanges(false);
        setErrors({});
      }
    });
  };

  const handleDiscard = () => {
    if (settings) {
      setFormData({
        storeName: settings.storeName || "Niya Bags",
        supportEmail: settings.supportEmail || "support@niyabags.com",
        supportPhone: formatIndianPhone(settings.supportPhone || "9876543210"),
        storeAddress:
          settings.storeAddress || "Bandra West, Mumbai, Maharashtra 400050",
        gstin: settings.gstin || "27AAACN1234F1Z5",
        freeShippingThreshold: settings.freeShippingThreshold ?? 500,
        shippingFee: settings.shippingFee ?? 50,
        codEnabled: settings.codEnabled ?? true,
        codFee: settings.codFee ?? 0,
        estimatedDeliveryDays:
          settings.estimatedDeliveryDays || "3-5 Business Days",
        announcementText:
          settings.announcementText ||
          "✨ Free shipping on all orders above ₹500 across India!",
        announcementEnabled: settings.announcementEnabled ?? true,
        socialLinks: {
          instagram:
            settings.socialLinks?.instagram || "https://instagram.com/niyabags",
          facebook:
            settings.socialLinks?.facebook || "https://facebook.com/niyabags",
          twitter:
            settings.socialLinks?.twitter || "https://twitter.com/niyabags",
          youtube:
            settings.socialLinks?.youtube || "https://youtube.com/@niyabags",
          whatsapp: formatIndianPhone(
            settings.socialLinks?.whatsapp ||
              settings.supportPhone ||
              "9876543210",
          ),
        },
      });
      setHasChanges(false);
      setErrors({});
      toast.success("Changes discarded. Restored saved settings.");
    }
  };

  const handleConfirmReset = () => {
    dispatch(resetSettings()).then((res) => {
      setIsResetModalOpen(false);
      if (!res.error) {
        setHasChanges(false);
        setErrors({});
      }
    });
  };

  return (
    <div className="page-shell">
      <PageHeader
        title="Store Settings"
        subtitle="Configure shipping thresholds, tax compliance (GSTIN), contact channels, and live announcement ribbons."
        meta={
          <>
            <span className="meta-chip meta-chip-success">
              <b>₹{formData.freeShippingThreshold}</b> free shipping limit
            </span>
            <span className="meta-chip">
              <b>₹{formData.shippingFee}</b> standard fee
            </span>
            <span className="meta-chip meta-chip-brand">
              <b>{formData.estimatedDeliveryDays}</b> ETA
            </span>
            {formData.codEnabled ? (
              <span className="meta-chip meta-chip-info">
                <b>COD Active</b> (₹{formData.codFee} fee)
              </span>
            ) : (
              <span className="meta-chip meta-chip-warning">
                <b>COD Disabled</b>
              </span>
            )}
            {formData.announcementEnabled && (
              <span className="meta-chip meta-chip-success">
                <b>Live Banner</b> active
              </span>
            )}
          </>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <a
              href={getStorefrontUrl("/")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary text-indigo-600 dark:text-indigo-400 hover:border-indigo-300"
              title="Preview live storefront"
            >
              <ExternalLinkIcon className="w-3.5 h-3.5 text-indigo-500" />
              Preview Storefront
            </a>

            <button
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              disabled={saving}
              className="btn btn-secondary"
              title="Reset all store settings to recommended defaults"
            >
              <RefreshIcon className="w-3.5 h-3.5 text-neutral-500" />
              Reset Defaults
            </button>

            {hasChanges && (
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving}
                className="btn btn-secondary"
              >
                Discard Changes
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <CheckIcon className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        }
      />

      {error && <ErrorBanner message={error} />}

      {/* 5-10 Second Non-Technical Admin Guide Banner */}
      {showGuide && (
        <div className="mb-4 p-3.5 sm:p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-linear-to-r from-indigo-50/90 via-violet-50/70 to-slate-50/80 dark:from-indigo-950/40 dark:via-violet-950/20 dark:to-slate-900/40 shadow-xs relative">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <InfoIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[13px] font-bold tracking-tight">
                  Store Operations & Checkout Settings Guide
                </h3>
                <p className="text-[11.5px] text-indigo-700/80 dark:text-indigo-300/80 font-normal">
                  Configure real-world delivery charges, legal tax info, support channels, and promotional banners:
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissGuide}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Dismiss guide"
              aria-label="Dismiss guide"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40 text-[12px]">
            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">🚚</span>
              <div>
                <span className="font-semibold text-(--ink) block">Free Shipping Rule</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Orders reaching the minimum threshold get ₹0 delivery fee automatically at checkout.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">🏢</span>
              <div>
                <span className="font-semibold text-(--ink) block">Tax & Legal Identity</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Your registered business name, GSTIN, and address are printed on customer tax invoices.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">📞</span>
              <div>
                <span className="font-semibold text-(--ink) block">Support Channels</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Customer helpline WhatsApp & Email links are displayed in the storefront footer.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-white/70 dark:bg-slate-900/60 p-2.5 rounded-lg border border-indigo-100/60 dark:border-indigo-900/30">
              <span className="text-base leading-none">📢</span>
              <div>
                <span className="font-semibold text-(--ink) block">Announcement Ribbon</span>
                <span className="text-(--ink-muted) text-[11px] leading-tight block mt-0.5">
                  Display active coupon codes, sale alerts, or urgent shipping notices at the top of the storefront.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-(--surface-card) border border-(--border) rounded-xl overflow-x-auto max-w-full mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("shipping")}
          className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "shipping"
              ? "bg-(--brand) text-white shadow-xs"
              : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
          }`}
        >
          <TruckIcon className="w-4 h-4" />
          Delivery & Shipping Rules
          {errors.freeShippingThreshold || errors.shippingFee || errors.codFee ? (
            <span className="w-2 h-2 rounded-full bg-red-400" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("identity")}
          className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "identity"
              ? "bg-(--brand) text-white shadow-xs"
              : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
          }`}
        >
          <PhoneIcon className="w-4 h-4" />
          Store Identity & Support Info
          {errors.storeName || errors.supportEmail || errors.supportPhone || errors.gstin ? (
            <span className="w-2 h-2 rounded-full bg-red-400" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("announcement")}
          className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-semibold transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === "announcement"
              ? "bg-(--brand) text-white shadow-xs"
              : "text-(--ink-muted) hover:text-(--ink) hover:bg-(--surface-sunken)"
          }`}
        >
          <MessageSquareIcon className="w-4 h-4" />
          Announcement Bar
          {errors.announcementText ? (
            <span className="w-2 h-2 rounded-full bg-red-400" />
          ) : null}
        </button>
      </div>

      {loading && !settings ? (
        <div className="p-12 text-center text-(--ink-muted) text-sm animate-pulse">
          Loading store settings…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: SHIPPING & DELIVERY */}
          {activeTab === "shipping" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Delivery Rules Card */}
              <div className="admin-card p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-(--border)">
                  <TruckIcon className="w-4 h-4 text-(--brand)" />
                  <h3 className="admin-card-title">Delivery Charges & Thresholds</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="form-label" htmlFor="freeShippingThreshold">
                      Free Shipping Minimum Order (₹) <span className="form-required">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--ink-faint) text-sm font-semibold">
                        ₹
                      </span>
                      <input
                        id="freeShippingThreshold"
                        type="number"
                        min="0"
                        value={formData.freeShippingThreshold}
                        onChange={(e) =>
                          handleChange("freeShippingThreshold", e.target.value)
                        }
                        className={`form-input pl-8 font-mono font-bold ${
                          errors.freeShippingThreshold ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        placeholder="500"
                        required
                      />
                    </div>
                    {errors.freeShippingThreshold ? (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.freeShippingThreshold}</p>
                    ) : (
                      <span className="text-[11.5px] text-(--ink-faint) mt-1 block">
                        Customers ordering at or above this cart value get 100% Free Shipping.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="form-label" htmlFor="shippingFee">
                      Standard Shipping Fee (₹) <span className="form-required">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--ink-faint) text-sm font-semibold">
                        ₹
                      </span>
                      <input
                        id="shippingFee"
                        type="number"
                        min="0"
                        value={formData.shippingFee}
                        onChange={(e) =>
                          handleChange("shippingFee", e.target.value)
                        }
                        className={`form-input pl-8 font-mono font-bold ${
                          errors.shippingFee ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        placeholder="50"
                        required
                      />
                    </div>
                    {errors.shippingFee ? (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.shippingFee}</p>
                    ) : (
                      <span className="text-[11.5px] text-(--ink-faint) mt-1 block">
                        Applied automatically when cart total is below the free shipping threshold.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="form-label" htmlFor="estimatedDeliveryDays">
                      Estimated Delivery Timeline
                    </label>
                    <input
                      id="estimatedDeliveryDays"
                      type="text"
                      value={formData.estimatedDeliveryDays}
                      onChange={(e) =>
                        handleChange("estimatedDeliveryDays", e.target.value)
                      }
                      className="form-input"
                      placeholder="e.g. 3-5 Business Days"
                    />
                    <span className="text-[11.5px] text-(--ink-faint) mt-1 block">
                      Shown to buyers under product cards, cart summary, and checkout.
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment & COD Options */}
              <div className="admin-card p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-(--border)">
                  <span className="text-base">💵</span>
                  <h3 className="admin-card-title">Payment & Cash On Delivery</h3>
                </div>

                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-3.5 rounded-(--radius) border border-(--border) bg-(--surface-sunken)">
                    <div>
                      <h4 className="text-[13px] font-bold text-(--ink)">
                        Enable Cash on Delivery (COD)
                      </h4>
                      <p className="text-[11.5px] text-(--ink-muted) mt-0.5">
                        Allow customers to pay in cash when parcel arrives at doorstep.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.codEnabled}
                        onChange={(e) =>
                          handleChange("codEnabled", e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--brand)" />
                    </label>
                  </div>

                  <div>
                    <label className="form-label" htmlFor="codFee">
                      COD Convenience Fee (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--ink-faint) text-sm font-semibold">
                        ₹
                      </span>
                      <input
                        id="codFee"
                        type="number"
                        min="0"
                        value={formData.codFee}
                        onChange={(e) =>
                          handleChange("codFee", e.target.value)
                        }
                        disabled={!formData.codEnabled}
                        className={`form-input pl-8 font-mono font-bold disabled:opacity-50 ${
                          errors.codFee ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        placeholder="0"
                      />
                    </div>
                    {errors.codFee ? (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.codFee}</p>
                    ) : (
                      <span className="text-[11.5px] text-(--ink-faint) mt-1 block">
                        Optional handling charge added to COD orders (Set to 0 for free COD).
                      </span>
                    )}
                  </div>

                  {/* Live Simulation Card */}
                  <div className="p-3.5 rounded-(--radius) border border-emerald-500/20 bg-emerald-500/5 text-[12px] text-emerald-900 dark:text-emerald-200 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span>✨</span>
                      <span>Live Customer Checkout Simulation:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 rounded bg-white/80 dark:bg-slate-900/60 border border-emerald-500/20">
                        <span className="text-(--ink-muted) block">Cart of ₹399 (Below limit)</span>
                        <span className="font-bold text-(--ink)">
                          Delivery: +₹{formData.shippingFee || 50}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-white/80 dark:bg-slate-900/60 border border-emerald-500/20">
                        <span className="text-(--ink-muted) block">
                          Cart of ₹{Number(formData.freeShippingThreshold || 500) + 100} (Above limit)
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Delivery: ₹0 FREE!
                        </span>
                      </div>
                    </div>
                    <p className="text-[10.5px] text-emerald-700/80 dark:text-emerald-300/80">
                      COD Status:{" "}
                      <b>
                        {formData.codEnabled
                          ? `Active (Convenience Fee: ₹${formData.codFee || 0})`
                          : "Disabled (Online Payment Only)"}
                      </b>{" "}
                      | ETA: <b>{formData.estimatedDeliveryDays || "3-5 Business Days"}</b>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STORE IDENTITY & SUPPORT */}
          {activeTab === "identity" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Identity & Legal Info */}
              <div className="admin-card p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-(--border)">
                  <span className="text-base">🏢</span>
                  <h3 className="admin-card-title">Store Identity & Legal Details</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="form-label" htmlFor="storeName">
                      Store Brand Name <span className="form-required">*</span>
                    </label>
                    <input
                      id="storeName"
                      type="text"
                      value={formData.storeName}
                      onChange={(e) => handleChange("storeName", e.target.value)}
                      className={`form-input ${errors.storeName ? "border-red-500 ring-1 ring-red-500" : ""}`}
                      placeholder="Niya Bags"
                      required
                    />
                    {errors.storeName && (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.storeName}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label" htmlFor="gstin">
                      Registered GSTIN (Tax Identification)
                    </label>
                    <input
                      id="gstin"
                      type="text"
                      value={formData.gstin}
                      onChange={(e) =>
                        handleChange("gstin", e.target.value.toUpperCase())
                      }
                      className={`form-input form-input-mono uppercase ${
                        errors.gstin ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      placeholder="27AAACN1234F1Z5"
                      maxLength={15}
                    />
                    {errors.gstin ? (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.gstin}</p>
                    ) : (
                      <span className="text-[11.5px] text-(--ink-faint) mt-1 block">
                        15-character GST number (State Code + PAN + Entity + Z + Checksum) printed on invoices.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="form-label" htmlFor="storeAddress">
                      Store / Warehouse Physical Address
                    </label>
                    <textarea
                      id="storeAddress"
                      rows={3}
                      value={formData.storeAddress}
                      onChange={(e) =>
                        handleChange("storeAddress", e.target.value)
                      }
                      className="form-textarea"
                      placeholder="Bandra West, Mumbai, Maharashtra 400050"
                    />
                  </div>

                  {/* Live Tax Invoice Simulation Card */}
                  <div className="p-3.5 rounded-(--radius) border border-indigo-500/20 bg-indigo-500/5 text-[12px] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                      <span>🧾</span>
                      <span>Customer Tax Invoice Header Preview:</span>
                    </div>
                    <div className="p-3 rounded bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 text-[11.5px] text-(--ink) space-y-0.5 shadow-2xs font-sans">
                      <div className="font-bold text-[13px] text-(--brand)">
                        {formData.storeName || "Niya Bags"}
                      </div>
                      <div className="text-(--ink-muted) text-[11px]">
                        {formData.storeAddress || "Bandra West, Mumbai, Maharashtra 400050"}
                      </div>
                      <div className="text-[11px] pt-1 flex items-center gap-3">
                        <span className="font-mono font-semibold bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                          GSTIN: {formData.gstin || "27AAACN1234F1Z5"}
                        </span>
                        <span className="text-(--ink-muted)">
                          Support: {formData.supportEmail || "support@niyabags.com"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Support Channels & Social */}
              <div className="admin-card p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-(--border)">
                  <PhoneIcon className="w-4 h-4 text-(--brand)" />
                  <h3 className="admin-card-title">Customer Support & Social Links</h3>
                </div>

                <div className="space-y-3.5">
                  <div>
                    <label className="form-label" htmlFor="supportEmail">
                      Customer Support Email <span className="form-required">*</span>
                    </label>
                    <div className="relative">
                      <MailIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-(--ink-faint)" />
                      <input
                        id="supportEmail"
                        type="email"
                        value={formData.supportEmail}
                        onChange={(e) =>
                          handleChange("supportEmail", e.target.value)
                        }
                        className={`form-input pl-10 ${
                          errors.supportEmail ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        placeholder="support@niyabags.com"
                        required
                      />
                    </div>
                    {errors.supportEmail && (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.supportEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label" htmlFor="supportPhone">
                      WhatsApp Helpline / Phone Number
                    </label>
                    <div className="relative">
                      <WhatsAppIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                      <input
                        id="supportPhone"
                        type="text"
                        value={formData.supportPhone}
                        onChange={(e) =>
                          handleChange("supportPhone", e.target.value)
                        }
                        className={`form-input pl-10 font-mono ${
                          errors.supportPhone ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    {errors.supportPhone ? (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.supportPhone}</p>
                    ) : (
                      <span className="text-[11.5px] text-(--ink-faint) mt-1 block">
                        10-digit Indian phone number with +91 country code for direct WhatsApp chat.
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="form-label" htmlFor="social_instagram">
                      Instagram Profile URL
                    </label>
                    <input
                      id="social_instagram"
                      type="url"
                      value={formData.socialLinks.instagram}
                      onChange={(e) =>
                        handleSocialChange("instagram", e.target.value)
                      }
                      className={`form-input ${
                        errors.social_instagram ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      placeholder="https://instagram.com/niyabags"
                    />
                    {errors.social_instagram && (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.social_instagram}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label" htmlFor="social_facebook">
                      Facebook Page URL
                    </label>
                    <input
                      id="social_facebook"
                      type="url"
                      value={formData.socialLinks.facebook}
                      onChange={(e) =>
                        handleSocialChange("facebook", e.target.value)
                      }
                      className={`form-input ${
                        errors.social_facebook ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      placeholder="https://facebook.com/niyabags"
                    />
                    {errors.social_facebook && (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.social_facebook}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label" htmlFor="social_twitter">
                      Twitter / X Profile URL
                    </label>
                    <input
                      id="social_twitter"
                      type="url"
                      value={formData.socialLinks.twitter}
                      onChange={(e) =>
                        handleSocialChange("twitter", e.target.value)
                      }
                      className={`form-input ${
                        errors.social_twitter ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      placeholder="https://twitter.com/niyabags"
                    />
                    {errors.social_twitter && (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.social_twitter}</p>
                    )}
                  </div>

                  <div>
                    <label className="form-label" htmlFor="social_youtube">
                      YouTube Channel URL
                    </label>
                    <input
                      id="social_youtube"
                      type="url"
                      value={formData.socialLinks.youtube}
                      onChange={(e) =>
                        handleSocialChange("youtube", e.target.value)
                      }
                      className={`form-input ${
                        errors.social_youtube ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      placeholder="https://youtube.com/@niyabags"
                    />
                    {errors.social_youtube && (
                      <p className="text-[11.5px] text-red-500 mt-1">{errors.social_youtube}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANNOUNCEMENT BAR */}
          {activeTab === "announcement" && (
            <div className="admin-card p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-(--border)">
                <div className="flex items-center gap-2">
                  <span className="text-base">📢</span>
                  <h3 className="admin-card-title">Storefront Announcement Banner</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.announcementEnabled}
                    onChange={(e) =>
                      handleChange("announcementEnabled", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-300 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-(--brand)" />
                </label>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="form-label" htmlFor="announcementText">
                    Announcement Banner Text
                  </label>
                  <input
                    id="announcementText"
                    type="text"
                    value={formData.announcementText}
                    onChange={(e) =>
                      handleChange("announcementText", e.target.value)
                    }
                    placeholder="e.g. ✨ Free shipping on all orders above ₹500 across India!"
                    className={`form-input ${
                      errors.announcementText ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                  />
                  {errors.announcementText ? (
                    <p className="text-[11.5px] text-red-500 mt-1">{errors.announcementText}</p>
                  ) : (
                    <span className="text-[11.5px] text-(--ink-faint) mt-1 block">
                      Keep messages punchy and include coupon codes or urgent delivery notices.
                    </span>
                  )}
                </div>

                {/* Live Simulation Preview */}
                <div className="pt-2">
                  <label className="form-label text-(--ink-muted)">
                    👁️ Storefront Live Preview:
                  </label>
                  <div className="p-4 rounded-(--radius) border border-dashed border-(--border) bg-(--surface-sunken) space-y-2.5">
                    {formData.announcementEnabled ? (
                      <div className="py-2.5 px-4 rounded-(--radius-sm) bg-(--brand-gradient) text-white text-[12px] font-semibold text-center tracking-wide shadow-xs flex items-center justify-center gap-2 animate-fadeIn">
                        <span>📢</span>
                        <span>{formData.announcementText || "Sample Announcement Text Here"}</span>
                      </div>
                    ) : (
                      <div className="py-3 px-4 rounded-(--radius-sm) bg-(--surface-card) border border-(--border) text-(--ink-muted) text-[12px] font-medium text-center">
                        (Announcement banner is currently disabled. Toggle switch ON to activate.)
                      </div>
                    )}
                    <p className="text-[11px] text-center text-(--ink-faint)">
                      This banner renders fixed at the very top of the customer website.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Save Bar */}
          <div className="admin-card p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-[12px] text-(--ink-muted)">
              <InfoIcon className="w-4 h-4 text-(--brand)" />
              <span>
                {hasChanges
                  ? "⚠️ You have unsaved changes. Click 'Save Settings' to apply."
                  : "✅ All store settings are up to date and live."}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              {hasChanges && (
                <button
                  type="button"
                  onClick={handleDiscard}
                  disabled={saving}
                  className="btn btn-secondary btn-sm"
                >
                  Discard
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary btn-sm"
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ConfirmDialog for Reset to Factory Defaults */}
      <ConfirmDialog
        isOpen={isResetModalOpen}
        title="Reset Store Settings to Defaults?"
        message="Are you sure you want to reset all store operations, shipping fees, GSTIN, and announcement settings to standard recommended Niya Bags defaults?"
        confirmLabel="Reset to Defaults"
        cancelLabel="Cancel"
        variant="danger"
        busy={saving}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};

export default SettingsPage;
