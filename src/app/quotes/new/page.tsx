import Link from "next/link";
import QuoteBuilder from "@/components/QuoteBuilder";
import catalogStyles from "../../catalog/catalog.module.css";

export default function NewQuotePage() {
    return (
        <main className={catalogStyles.page}>
            <div className={catalogStyles.container}>
                <Link
                    className={catalogStyles.backLink}
                    href="/"
                >
                    ← Back to home
                </Link>

                <header
                    className={
                        catalogStyles.pageHeader
                    }
                >
                    <div>
                        <p className={catalogStyles.eyebrow}>
                            Quote builder
                        </p>

                        <h1>Create customer quote</h1>

                        <p>
                            Select catalog pricing and generate
                            a transparent shareable quote.
                        </p>
                    </div>
                </header>

                <QuoteBuilder />
            </div>
        </main>
    );
}