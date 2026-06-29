import { notFound } from "next/navigation";

import { connectToDatabase } from "@/lib/mongodb";
import { formatUsd } from "@/lib/pricing/calculateQuote";
import QuoteModel from "@/models/Quote";

import styles from "./quote.module.css";

export const dynamic = "force-dynamic";

interface PublicQuotePageProps {
    params: Promise<{
        publicId: string;
    }>;
}

const TERM_LABELS = {
    MONTHLY: "Monthly",
    ANNUAL: "Annual",
    TWO_YEAR: "Two-year",
} as const;

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

export default async function PublicQuotePage({
    params,
}: PublicQuotePageProps) {
    const { publicId } = await params;

    await connectToDatabase();

    const quote = await QuoteModel.findOne({
        publicId,
    });

    if (!quote) {
        notFound();
    }

    return (
        <main className={styles.page}>
            <article className={styles.quote}>
                <header className={styles.header}>
                    <div>
                        <p className={styles.eyebrow}>
                            Customer quote
                        </p>

                        <h1>{quote.quoteName}</h1>

                        <p>
                            Prepared for{" "}
                            <strong>
                                {quote.customerName}
                            </strong>
                        </p>
                    </div>

                    <div className={styles.dates}>
                        <span>
                            Created{" "}
                            {formatDate(quote.createdAt)}
                        </span>

                        <span>
                            Valid until{" "}
                            {formatDate(quote.validUntil)}
                        </span>
                    </div>
                </header>

                <section className={styles.details}>
                    <div>
                        <span>Product</span>
                        <strong>
                            {quote.productName}
                        </strong>
                    </div>

                    <div>
                        <span>Tier</span>
                        <strong>{quote.tierName}</strong>
                    </div>

                    <div>
                        <span>Seats</span>
                        <strong>
                            {quote.productSeats}
                        </strong>
                    </div>

                    <div>
                        <span>Term</span>
                        <strong>
                            {TERM_LABELS[quote.term]}
                        </strong>
                    </div>
                </section>

                <section className={styles.pricing}>
                    <div className={styles.tableHeader}>
                        <span>Item and calculation</span>
                        <span>Amount</span>
                    </div>

                    {quote.lineItems.map(
                        (lineItem, index) => (
                            <div
                                className={styles.lineItem}
                                key={`${lineItem.name}-${index}`}
                            >
                                <div>
                                    <strong>
                                        {lineItem.name}
                                    </strong>

                                    <span>
                                        {lineItem.calculation}
                                    </span>
                                </div>

                                <strong>
                                    {formatUsd(
                                        lineItem.amountCents,
                                    )}
                                </strong>
                            </div>
                        ),
                    )}

                    <div className={styles.summary}>
                        <div>
                            <span>Subtotal</span>

                            <strong>
                                {formatUsd(
                                    quote.subtotalCents,
                                )}
                            </strong>
                        </div>

                        {quote.quoteDiscountPercent >
                            0 && (
                                <div>
                                    <span>
                                        Quote discount (
                                        {
                                            quote.quoteDiscountPercent
                                        }
                                        %)
                                    </span>

                                    <strong>
                                        -
                                        {formatUsd(
                                            quote.quoteDiscountAmountCents,
                                        )}
                                    </strong>
                                </div>
                            )}

                        <div className={styles.total}>
                            <span>Total</span>

                            <strong>
                                {formatUsd(
                                    quote.totalCents,
                                )}
                            </strong>
                        </div>
                    </div>
                </section>

                <footer className={styles.footer}>
                    Prices are shown in USD. Taxes are not
                    included.
                </footer>
            </article>
        </main>
    );
}