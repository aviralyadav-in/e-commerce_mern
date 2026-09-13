import React, { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";
import { cn } from "../../lib/utils";

const DISMISS_KEY = "niya_concierge_dismissed";

/**
 * Floating "Chat on WhatsApp" concierge. Gentle, dismissible (remembered for the
 * session) and stacked below the floating back-to-top button. Hidden entirely when
 * no WhatsApp number is configured in store settings.
 */
export default function ConciergeButton() {
  // Admin sets WhatsApp under social links; plain whatsappNumber is also accepted.
  const whatsapp = useSettingsStore(
    (s) => s.settings?.whatsappNumber || s.settings?.socialLinks?.whatsapp
  );
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Once the user has scrolled into the page, nudge gently after a short delay.
  const [nudgeVisible, setNudgeVisible] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setNudgeVisible(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  if (!whatsapp) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // session-only dismiss
    }
  };

  const number = String(whatsapp).replace(/\D/g, "");
  const href = `https://wa.me/${number}?text=${encodeURIComponent(
    "Hi! I have a question about a Niya Bags piece."
  )}`;

  return (
    <div
      className={cn(
        "fixed right-5 z-40 flex flex-col items-end gap-2.5 transition-all duration-300 ease-luxury motion-reduce:transition-none sm:right-6",
        "bottom-[calc(4.25rem+env(safe-area-inset-bottom))] sm:bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide chat option"
        className={cn(
          "icon-btn size-8 bg-surface shadow-soft ring-1 ring-line transition-all duration-300 ease-luxury",
          dismissed || !nudgeVisible ? "pointer-events-none scale-75 opacity-0" : "opacity-100"
        )}
        tabIndex={dismissed || !nudgeVisible ? -1 : 0}
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={dismiss}
        aria-label="Chat with us on WhatsApp"
        className="group flex items-center gap-2.5 rounded-full bg-primary py-2 pl-2 pr-2 text-primary-foreground shadow-lift transition-all duration-300 ease-luxury hover:bg-primary-hover active:scale-95 sm:pr-4"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-primary-foreground/15">
          <MessageCircle className="size-5" aria-hidden="true" />
        </span>
        <span className="hidden text-small font-semibold sm:block">Chat with us</span>
      </a>
    </div>
  );
}
