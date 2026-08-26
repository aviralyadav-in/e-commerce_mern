import InfoPageShell from "../components/common/InfoPageShell";
import { OUR_STORY_PAGE } from "../data/siteContent";

/** /our-story — brand story + closing quote */
export default function OurStoryPage() {
  return (
    <InfoPageShell
      eyebrow={OUR_STORY_PAGE.eyebrow}
      title={OUR_STORY_PAGE.title}
      intro={OUR_STORY_PAGE.intro}
    >
      <div className="space-y-10">
        {OUR_STORY_PAGE.sections.map((section) => (
          <section key={section.title}>
            <h2 className="font-display mb-3 text-2xl font-medium" style={{ color: "var(--ink)" }}>
              {section.title}
            </h2>
            <p className="text-sm leading-7" style={{ color: "var(--ink-muted)" }}>
              {section.content}
            </p>
          </section>
        ))}
      </div>

      {OUR_STORY_PAGE.quote && (
        <blockquote
          className="mt-14 border-l-2 py-2 pl-6"
          style={{ borderColor: "var(--accent)" }}
        >
          <p
            className="font-display text-2xl font-medium leading-snug"
            style={{ color: "var(--ink)" }}
          >
            “{OUR_STORY_PAGE.quote}”
          </p>
        </blockquote>
      )}
    </InfoPageShell>
  );
}
