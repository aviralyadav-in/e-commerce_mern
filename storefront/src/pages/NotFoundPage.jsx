import { Link, useNavigate } from "react-router";

/**
 * 404 — "Lost in the collection" style page.
 * Take Me Home + history-back Go Back buttons (niyabags jaisa).
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-2xl px-4 py-28 text-center sm:px-6">
      <p
        className="mb-6 flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em]"
        style={{ color: "var(--ink-faint)" }}
      >
        <span className="h-px w-8" style={{ background: "var(--border-strong)" }} />
        404 · Lost in the collection
        <span className="h-px w-8" style={{ background: "var(--border-strong)" }} />
      </p>
      <h1 className="font-display text-5xl font-medium">
        This piece isn't
        <br />
        <span style={{ color: "var(--accent)" }}>in our collection</span>
      </h1>
      <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--ink-muted)" }}>
        The page you're looking for doesn't exist or has moved — but there's a
        whole collection waiting for you.
      </p>
      <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link to="/" className="btn btn-accent">
          Take Me Home →
        </Link>
        <button type="button" className="btn btn-outline" onClick={() => navigate(-1)}>
          ← Go Back
        </button>
      </div>
    </div>
  );
}

