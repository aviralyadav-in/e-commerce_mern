import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import usePageTitle from "../hooks/usePageTitle";

export default function NotFoundPage() {
  usePageTitle("Page not found");

  return (
    <section className="section container-narrow flex min-h-[60vh] flex-col items-center justify-center text-center animate-fade-up">
      <p className="eyebrow">Error 404</p>

      <p
        aria-hidden="true"
        className="mt-3 font-serif text-[clamp(6.5rem,20vw,11rem)] font-medium leading-[0.9] tracking-[-0.04em] text-foreground select-none"
      >
        404
      </p>

      <span className="divider-gold mt-6" aria-hidden="true" />

      <h1 className="text-h2 mt-6 text-foreground">This page has wandered off</h1>
      <p className="text-lead mt-3 max-w-md text-ink-muted">
        The piece you were looking for isn&rsquo;t in our atelier &mdash; it may have moved, sold out, or never
        existed.
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
        <Link to="/shop" className="btn btn-primary btn-luxury w-full sm:w-auto">
          <ShoppingBag aria-hidden="true" />
          <span>Browse the collection</span>
        </Link>
        <Link to="/" className="btn btn-secondary w-full sm:w-auto">
          <span>Back to home</span>
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <p className="mt-8 text-small text-ink-muted">
        Need a hand?{" "}
        <Link to="/contact" className="link-gold">
          Contact concierge
        </Link>
        <span className="mx-2 text-ink-soft" aria-hidden="true">
          &middot;
        </span>
        <Link to="/account" className="link-gold">
          Your account
        </Link>
      </p>
    </section>
  );
}
