import { useState } from "react";
import { useDispatch } from "react-redux";
import { pushToast } from "../../features/ui/uiSlice";
import { NEWSLETTER } from "../../data/siteContent";

/**
 * NewsletterSection — "Join the Niya Circle" email capture.
 * Backend endpoint nahi hai toh client-side success toast dikhate hain.
 */
export default function NewsletterSection() {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      dispatch(pushToast("Please enter a valid email address", "error"));
      return;
    }
    dispatch(
      pushToast("Welcome to the Niya Circle! 🎉 Keep an eye on your inbox."),
    );
    setEmail("");
  };

  return (
    <section style={{ background: "var(--bg-deep)" }}>
      <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-8 px-4 py-14 sm:px-6 md:flex-row md:items-center">
        <div>
          <p className="eyebrow mb-2">{NEWSLETTER.eyebrow}</p>
          <h2
            className="font-display text-3xl font-medium md:text-4xl"
            style={{ color: "#f2efe7" }}
          >
            {NEWSLETTER.title}
          </h2>
          <p
            className="mt-3 max-w-md text-xs leading-6"
            style={{ color: "rgba(242,239,231,0.65)" }}
          >
            {NEWSLETTER.description}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex h-11 w-full max-w-sm rounded-full p-1"
          style={{ background: "var(--bg-raised)" }}
        >
          <input
            type="email"
            placeholder="Your email address"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="min-w-0 flex-1 bg-transparent px-4 text-xs outline-none"
            style={{ color: "#f2efe7" }}
          />
          <button
            type="submit"
            className="rounded-full px-5 text-[10px] font-bold uppercase tracking-[0.12em] transition hover:opacity-90"
            style={{ background: "var(--accent)", color: "#101d1d" }}
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
