import InfoPageShell from "../components/common/InfoPageShell";
import { ABOUT_PAGE } from "../data/siteContent";

/** /about — About Niya (sections + values grid) */
export default function AboutPage() {
  return (
    <InfoPageShell
      eyebrow={ABOUT_PAGE.eyebrow}
      title={ABOUT_PAGE.title}
      intro={ABOUT_PAGE.intro}
    >
      <div className="space-y-10">
        {ABOUT_PAGE.sections.map((section) => (
          <section key={section.id || section.title}>
            <h2 className="font-display mb-3 text-2xl font-medium" style={{ color: "var(--ink)" }}>
              {section.title}
            </h2>
            <p className="text-sm leading-7" style={{ color: "var(--ink-muted)" }}>
              {section.content}
            </p>
          </section>
        ))}
      </div>

      {ABOUT_PAGE.values?.length > 0 && (
        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {ABOUT_PAGE.values.map((value) => (
            <div key={value.id} className="card p-6">
              <p className="eyebrow mb-2">{value.title}</p>
              <p className="text-sm leading-6" style={{ color: "var(--ink-muted)" }}>
                {value.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </InfoPageShell>
  );
}
