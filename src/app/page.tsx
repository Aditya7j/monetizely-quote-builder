import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home">
      <section className="homeCard">
        <p className="eyebrow">
          Monetizely take-home exercise
        </p>

        <h1>SaaS Quote Builder</h1>

        <p>
          Configure products and pricing tiers,
          then create transparent customer quotes.
        </p>

        <div className="homeActions">
          <Link
            className="homeButton"
            href="/catalog"
          >
            Catalog setup
          </Link>

          <Link
            className="homeButton secondaryHomeButton"
            href="/quotes/new"
          >
            Create quote
          </Link>
        </div>
      </section>
    </main>
  );
}