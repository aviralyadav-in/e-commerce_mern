import { useId, useState } from "react";
import { AlertCircle, Check, Clock, Headset, Mail, MapPin, MessageCircle, PenLine, Phone, Send, Wrench } from "lucide-react";
import { api } from "../lib/api";
import { useSettingsStore } from "../stores/settingsStore";
import { cn, formatCurrency } from "../lib/utils";
import PageHeader from "../components/common/PageHeader";
import FormField from "../components/common/FormField";
import TrustStrip from "../components/common/TrustStrip";
import { Spinner } from "../components/common/PageLoader";
import usePageTitle from "../hooks/usePageTitle";
import { Accordion, AccordionContent, AccordionTrigger } from "../components/ui/accordion";

const INQUIRY_SUBJECTS = [
  "Product Advice & Styling",
  "Custom Bespoke & Monogramming",
  "Order Status & Shipping",
  "Leather Care & Craftsmanship",
  "Corporate & VIP Gifting",
  "General Assistance",
];

/** Mirrors the backend inquiry model limit (maxlength 3000). */
const MESSAGE_MAX = 3000;

/** Concierge-specific trust items (the footer already shows the generic four). */
const CONCIERGE_TRUST = [
  { icon: Headset, title: "A real person replies", desc: "Every message is read by our Mumbai concierge team, never a bot." },
  { icon: Clock, title: "Within 24 hours", desc: "Monday to Saturday. Order questions are answered first." },
  { icon: PenLine, title: "Bespoke & monogramming", desc: "Initials, custom colours and commissions on selected silhouettes." },
  { icon: Wrench, title: "Repairs for life", desc: "3-year stitch guarantee, then atelier repair support for as long as you carry it." },
];

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  subject: INQUIRY_SUBJECTS[0],
  message: "",
};

function buildFaq(floor) {
  return [
    {
      q: "How long does delivery take?",
      a: `Orders leave our Mumbai atelier within 1–2 business days. Metro cities receive pieces in 2–4 days, the rest of India in 4–7. Every parcel is insured and tracked, and delivery is complimentary on orders above ${formatCurrency(floor)}.`,
    },
    {
      q: "What is your return policy?",
      a: "Unused pieces in their original packaging can be returned within 7 days of delivery. We arrange a doorstep pickup and refund the original payment method within 5–7 business days.",
    },
    {
      q: "How do I care for the leather?",
      a: "Wipe with a soft, dry cloth and condition lightly every three to four months. Keep the bag out of prolonged sun and rain, and store it in its linen dust bag, lightly stuffed to hold its shape.",
    },
    {
      q: "Is there a warranty?",
      a: "Every bag carries a 3-year stitch and hardware guarantee, with lifetime repair support from the atelier for anything beyond it.",
    },
    {
      q: "Can I monogram or commission a piece?",
      a: "Yes. We offer blind or gold-foil initials on most silhouettes and bespoke commissions on selected designs. Choose “Custom Bespoke & Monogramming” in the form and tell us what you have in mind.",
    },
  ];
}

/** One FAQ row — drives the shadcn trigger/content explicitly so it is keyboard- and AT-friendly. */
function ContactFaqItem({ id, question, answer, open, onToggle }) {
  const triggerId = `${id}-trigger`;
  const panelId = `${id}-panel`;
  return (
    <div className="border-b border-line last:border-0">
      <AccordionTrigger
        open={open}
        onToggle={onToggle}
        id={triggerId}
        aria-expanded={open}
        aria-controls={panelId}
        className="min-h-12 py-3.5 text-body font-medium text-foreground hover:text-gold-ink"
      >
        {question}
      </AccordionTrigger>
      <AccordionContent
        open={open}
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        aria-hidden={!open}
        inert={!open}
        className="text-small text-ink-muted"
      >
        {answer}
      </AccordionContent>
    </div>
  );
}

export default function ContactPage() {
  usePageTitle("Contact");
  const { settings } = useSettingsStore();
  const faqId = useId();
  const subjectLabelId = useId();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openFaq, setOpenFaq] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    if (errorMessage) setErrorMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Client-side validations matching backend rules (same checks as before, shown inline)
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Please provide your full name.";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Please enter a valid email address.";
    }
    if (formData.phone && formData.phone.trim()) {
      const clean = formData.phone.replace(/\D/g, "");
      const isIndian =
        clean.length === 10
          ? /^[6-9]\d{9}$/.test(clean)
          : clean.length === 11 && clean.startsWith("0")
            ? /^[6-9]\d{9}$/.test(clean.slice(1))
            : clean.length === 12 && clean.startsWith("91")
              ? /^[6-9]\d{9}$/.test(clean.slice(2))
              : false;
      if (!isIndian) {
        errors.phone = "Please enter a valid 10-digit Indian phone number.";
      }
    }
    if (!formData.message.trim()) {
      errors.message = "Please write your message or inquiry.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    try {
      setSubmitting(true);
      const res = await api.post("/inquiries", {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      setSuccessMessage(
        res.data?.message ||
          "Thank you for contacting Niya Bags. Your inquiry has been received by our concierge liaison."
      );
      setFormData(EMPTY_FORM);
    } catch (err) {
      console.error("Inquiry submission error:", err);
      const msg =
        err.response?.data?.message ||
        "We could not submit your inquiry. Please check your details or reach out via email.";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const storeName = settings?.storeName || "Niya Bags Atelier";
  const supportEmail = settings?.supportEmail || "care@niyabags.com";
  const supportPhone = settings?.supportPhone || "+91 98190 12345";
  const storeAddress =
    settings?.storeAddress ||
    "Plot 14, Commercial Complex, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051";
  const rawWhatsApp = settings?.socialLinks?.whatsapp || supportPhone;
  const whatsappClean = rawWhatsApp.replace(/\D/g, "");
  const floor = typeof settings?.freeShippingThreshold === "number" ? settings.freeShippingThreshold : 500;

  const contactRows = [
    {
      icon: Mail,
      label: "Email",
      value: supportEmail,
      href: `mailto:${supportEmail}`,
      note: "Replies within 24 hours",
    },
    {
      icon: Phone,
      label: "Concierge desk",
      value: supportPhone,
      href: `tel:${supportPhone}`,
      note: "Monday to Saturday, 10:00 – 19:30 IST",
    },
    {
      icon: MapPin,
      label: "Flagship atelier",
      value: storeAddress,
      note: storeName,
    },
  ];

  const faq = buildFaq(floor);
  const messageCount = `${formData.message.length.toLocaleString("en-IN")} / ${MESSAGE_MAX.toLocaleString("en-IN")} characters`;

  return (
    <div className="container-x page-top section-tight">
      <PageHeader
        breadcrumbs={[{ label: "Home", to: "/" }, { label: "Concierge" }]}
        eyebrow="Client concierge"
        title="We’re here to help"
        description="Styling advice, a bespoke request or a question about an order — write to the atelier and a real person will reply within one business day."
      />

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        {/* Inquiry form */}
        <section aria-labelledby="contact-form-heading" className="surface-card p-6 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-line pb-5">
            <div>
              <h2 id="contact-form-heading" className="text-h3 text-foreground">
                Send a message
              </h2>
              <p className="mt-1 text-small text-ink-muted">
                Tell us how we can help. We reply within 24 hours, Monday to Saturday.
              </p>
            </div>
          </div>

          {errorMessage && (
            <div
              role="alert"
              className="surface-panel mb-6 flex items-start gap-3 border-danger/40 bg-danger-soft px-4 py-3 text-small text-danger"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <p>{errorMessage}</p>
            </div>
          )}

          {successMessage ? (
            <div role="status" className="surface-panel animate-fade-in p-8 text-center sm:p-10">
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold-soft text-gold-ink">
                <Check className="size-7" aria-hidden="true" />
              </span>
              <h3 className="mt-5 text-h3 text-foreground">Thank you — we’ll reply within 24 hours</h3>
              <p className="mx-auto mt-2 max-w-md text-small text-ink-muted">{successMessage}</p>
              <button type="button" onClick={() => setSuccessMessage("")} className="btn btn-secondary mt-6">
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Full name" required error={fieldErrors.name}>
                  <input
                    type="text"
                    name="name"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Eleanor Vance"
                    className="input-luxury"
                  />
                </FormField>

                <FormField label="Email address" required error={fieldErrors.email}>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="input-luxury"
                  />
                </FormField>
              </div>

              <FormField
                label="Contact number"
                error={fieldErrors.phone}
                hint="10-digit Indian mobile, only if you’d like a call back."
              >
                <input
                  type="tel"
                  name="phone"
                  autoComplete="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="e.g. 9876543210"
                  className="input-luxury"
                />
              </FormField>

              <div role="group" aria-labelledby={subjectLabelId}>
                <span id={subjectLabelId} className="label-luxury">
                  Subject
                  <span className="ml-0.5 text-gold-ink" aria-hidden="true">
                    *
                  </span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {INQUIRY_SUBJECTS.map((subject) => {
                    const active = formData.subject === subject;
                    return (
                      <button
                        key={subject}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFormData((prev) => ({ ...prev, subject }))}
                        className={cn("chip min-h-11 sm:min-h-9", active && "chip-active")}
                      >
                        {subject}
                      </button>
                    );
                  })}
                </div>
              </div>

              <FormField label="Your message" required error={fieldErrors.message} hint={messageCount}>
                <textarea
                  name="message"
                  rows={6}
                  maxLength={MESSAGE_MAX}
                  required
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Your question, bespoke specifications or order number…"
                  className="textarea-luxury min-h-40"
                />
              </FormField>

              <div className="flex flex-col gap-4 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-soft">We use your details only to answer this inquiry.</p>
                <button
                  type="submit"
                  disabled={submitting}
                  aria-busy={submitting}
                  className="btn btn-primary btn-lg btn-luxury w-full sm:w-auto"
                >
                  {submitting ? <Spinner className="size-4" /> : <Send aria-hidden="true" />}
                  <span>Send message</span>
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Contact rail */}
        <aside className="space-y-6" aria-label="Contact details">
          <section aria-labelledby="contact-details-heading" className="surface-card p-5 sm:p-6">
            <h2 id="contact-details-heading" className="text-h4 text-foreground">
              Reach the atelier
            </h2>
            <ul className="mt-2 divide-y divide-line">
              {contactRows.map(({ icon: Icon, label, value, href, note }) => (
                <li key={label} className="flex items-start gap-4 py-4 last:pb-0">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-ink">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-micro text-ink-soft">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        className="mt-0.5 inline-block wrap-break-word text-body font-medium text-foreground transition-colors hover:text-gold-ink"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-body text-foreground">{value}</p>
                    )}
                    {note && <p className="mt-0.5 text-xs text-ink-muted">{note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="hours-heading" className="surface-panel p-5">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-gold-ink">
                <Clock className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="hours-heading" className="text-h4 text-foreground">
                  Atelier hours
                </h2>
                <dl className="mt-2 max-w-sm space-y-1.5 text-small">
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-muted">Monday – Saturday</dt>
                    <dd className="font-medium text-foreground tabular-nums">10:00 – 19:30 IST</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-ink-muted">Sunday &amp; national holidays</dt>
                    <dd className="font-medium text-foreground">Closed</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>

          {whatsappClean && (
            <a
              href={`https://wa.me/${whatsappClean}?text=Hello%20Niya%20Bags%20Concierge,%20I%20would%20like%20to%20inquire%20about%20your%20handcrafted%20pieces.`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-block"
            >
              <MessageCircle aria-hidden="true" />
              <span>WhatsApp concierge</span>
            </a>
          )}

          <section aria-labelledby="faq-heading" className="surface-card p-5 sm:p-6">
            <h2 id="faq-heading" className="text-h4 text-foreground">
              Frequently asked
            </h2>
            <Accordion className="mt-2">
              {faq.map((item, i) => (
                <ContactFaqItem
                  key={item.q}
                  id={`${faqId}-${i}`}
                  question={item.q}
                  answer={item.a}
                  open={openFaq === i}
                  onToggle={() => setOpenFaq(openFaq === i ? -1 : i)}
                />
              ))}
            </Accordion>
          </section>
        </aside>
      </div>

      <TrustStrip variant="grid" items={CONCIERGE_TRUST} className="mt-12 sm:mt-16" />
    </div>
  );
}
