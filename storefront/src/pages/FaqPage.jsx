import { useState } from "react";
import InfoPageShell from "../components/common/InfoPageShell";
import { ChevronDownIcon } from "../components/common/Icons";
import { FAQ_PAGE } from "../data/siteContent";

/** /faq — accordion style Q&A */
export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <InfoPageShell
      eyebrow={FAQ_PAGE.eyebrow}
      title={FAQ_PAGE.title}
      intro={FAQ_PAGE.intro}
    >
      <div className="space-y-3">
        {FAQ_PAGE.faqs.map((faq, index) => {
          const open = openIndex === index;
          return (
            <div key={faq.question} className="card overflow-hidden">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  {faq.question}
                </span>
                <ChevronDownIcon
                  size={16}
                  className="shrink-0 transition-transform duration-300"
                  style={{
                    transform: open ? "rotate(180deg)" : "rotate(0deg)",
                    color: "var(--accent)",
                  }}
                />
              </button>
              {open && (
                <p
                  className="px-5 pb-5 text-sm leading-7"
                  style={{ color: "var(--ink-muted)" }}
                >
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </InfoPageShell>
  );
}
