/**
 * InfoPageShell — saare static/info pages ka common editorial header.
 * Consistent eyebrow → title → intro hierarchy deta hai.
 */
export default function InfoPageShell({ eyebrow, title, intro, children }) {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <header className="mb-10 text-center">
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h1 className="section-title">{title}</h1>
        {intro && (
          <p
            className="mx-auto mt-4 max-w-xl text-sm leading-relaxed"
            style={{ color: "var(--ink-muted)" }}
          >
            {intro}
          </p>
        )}
      </header>
      {children}
    </div>
  );
}
