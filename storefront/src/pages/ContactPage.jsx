import { useState } from "react";
import { useDispatch } from "react-redux";
import { pushToast } from "../features/ui/uiSlice";
import InfoPageShell from "../components/common/InfoPageShell";
import { MailIconFallback, ClockIconFallback } from "../components/contact/ContactIcons";
import { CONTACT_PAGE } from "../data/siteContent";

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

/** /contact — contact info cards + validated enquiry form */
export default function ContactPage() {
  const dispatch = useDispatch();
  const [form, setForm] = useState(INITIAL_FORM);

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Form mailto par compose karta hai — user ka email client khulega
    const subject = encodeURIComponent(
      `[${form.subject || "Enquiry"}] ${form.name}`,
    );
    const body = encodeURIComponent(
      `${form.message}\n\n—\n${form.name}\n${form.email}${form.phone ? `\n${form.phone}` : ""}`,
    );
    window.location.href = `mailto:${CONTACT_PAGE.email}?subject=${subject}&body=${body}`;
    dispatch(pushToast("Opening your email app… We'll reply soon!"));
    setForm(INITIAL_FORM);
  };

  return (
    <InfoPageShell
      eyebrow={CONTACT_PAGE.eyebrow}
      title={CONTACT_PAGE.title}
      intro={CONTACT_PAGE.intro}
    >
      {/* Contact info cards */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <a href={`mailto:${CONTACT_PAGE.email}`} className="card flex items-center gap-4 p-5">
          <MailIconFallback />
          <span>
            <span className="eyebrow mb-1 block">Email Us</span>
            <span className="text-sm font-semibold">{CONTACT_PAGE.email}</span>
          </span>
        </a>
        <div className="card flex items-center gap-4 p-5">
          <ClockIconFallback />
          <span>
            <span className="eyebrow mb-1 block">Support Hours</span>
            <span className="text-sm font-semibold">{CONTACT_PAGE.supportHours}</span>
          </span>
        </div>
      </div>

      {/* Enquiry form */}
      <form onSubmit={handleSubmit} className="card space-y-5 p-6 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="contact-name">Full Name *</label>
            <input
              id="contact-name"
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="field"
              value={form.name}
              onChange={setField}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="contact-email">Email Address *</label>
            <input
              id="contact-email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="field"
              value={form.email}
              onChange={setField}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="contact-phone">Phone Number</label>
            <input
              id="contact-phone"
              name="phone"
              type="tel"
              placeholder="+91"
              className="field"
              value={form.phone}
              onChange={setField}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="contact-subject">Subject *</label>
            <select
              id="contact-subject"
              name="subject"
              required
              className="field"
              value={form.subject}
              onChange={setField}
            >
              {CONTACT_PAGE.subjects.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="contact-message">Message *</label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            placeholder="Tell us how we can help…"
            className="field resize-y"
            value={form.message}
            onChange={setField}
          />
        </div>

        <button type="submit" className="btn btn-accent w-full sm:w-auto">
          Send Message →
        </button>
      </form>
    </InfoPageShell>
  );
}
