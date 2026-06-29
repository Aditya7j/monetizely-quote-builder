"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
    calculateQuote,
    formatUsd,
} from "@/lib/pricing/calculateQuote";

import type {
    AddOnPricingModel,
    Product,
} from "@/types/catalog";

import type {
    QuoteTerm,
    SelectedAddOn,
} from "@/types/quote";

import styles from "./QuoteBuilder.module.css";

interface ProductsResponse {
    products: Product[];
}

interface AvailableAddOn {
    featureId: string;
    featureName: string;
    pricingModel: AddOnPricingModel;
    priceCents?: number;
    percentage?: number;
}

interface AddOnState {
    selected: boolean;
    quantity: string;
}

interface QuoteResponse {
    quote?: {
        publicId: string;
    };
    error?: string;
    issues?: {
        message: string;
    }[];
}

const TERM_LABELS: Record<
    QuoteTerm,
    string
> = {
    MONTHLY: "Monthly",
    ANNUAL: "Annual — 15% base discount",
    TWO_YEAR: "Two-year — 25% base discount",
};

export default function QuoteBuilder() {
    const router = useRouter();

    const [products, setProducts] =
        useState<Product[]>([]);

    const [quoteName, setQuoteName] =
        useState("");

    const [customerName, setCustomerName] =
        useState("");

    const [productId, setProductId] =
        useState("");

    const [tierId, setTierId] = useState("");

    const [productSeats, setProductSeats] =
        useState("1");

    const [term, setTerm] =
        useState<QuoteTerm>("MONTHLY");

    const [
        quoteDiscountPercent,
        setQuoteDiscountPercent,
    ] = useState("0");

    const [addOnState, setAddOnState] =
        useState<Record<string, AddOnState>>({});

    const [isLoading, setIsLoading] =
        useState(true);

    const [isSaving, setIsSaving] =
        useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        async function loadProducts() {
            try {
                const response = await fetch(
                    "/api/products",
                );

                if (!response.ok) {
                    throw new Error(
                        "Unable to load products.",
                    );
                }

                const data =
                    (await response.json()) as ProductsResponse;

                setProducts(data.products);
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Unable to load products.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadProducts();
    }, []);

    const selectedProduct = useMemo(
        () =>
            products.find(
                (product) =>
                    product._id === productId,
            ),
        [productId, products],
    );

    const selectedTier = useMemo(
        () =>
            selectedProduct?.tiers.find(
                (tier) => tier.id === tierId,
            ),
        [selectedProduct, tierId],
    );

    const availableAddOns =
        useMemo<AvailableAddOn[]>(() => {
            if (!selectedProduct || !tierId) {
                return [];
            }

            const addOns: AvailableAddOn[] = [];

            for (const feature of selectedProduct.features) {
                const configuration =
                    feature.tierConfigurations.find(
                        (item) => item.tierId === tierId,
                    );

                if (
                    configuration?.availability ===
                    "ADD_ON" &&
                    configuration.pricingModel
                ) {
                    addOns.push({
                        featureId: feature.id,
                        featureName: feature.name,
                        pricingModel:
                            configuration.pricingModel,
                        priceCents:
                            configuration.priceCents,
                        percentage:
                            configuration.percentage,
                    });
                }
            }

            return addOns;
        }, [selectedProduct, tierId]);

    const selectedPricingAddOns =
        useMemo<SelectedAddOn[]>(() => {
            return availableAddOns
                .filter(
                    (addOn) =>
                        addOnState[addOn.featureId]
                            ?.selected,
                )
                .map((addOn) => ({
                    ...addOn,
                    quantity:
                        addOn.pricingModel ===
                            "PER_SEAT_MONTHLY"
                            ? Number(
                                addOnState[addOn.featureId]
                                    ?.quantity,
                            )
                            : undefined,
                }));
        }, [addOnState, availableAddOns]);

    const preview = useMemo(() => {
        if (
            !selectedProduct ||
            !selectedTier ||
            Number(productSeats) <= 0
        ) {
            return null;
        }

        try {
            return calculateQuote({
                productName: selectedProduct.name,
                tierName: selectedTier.name,
                productSeats: Number(productSeats),
                basePricePerSeatCents:
                    selectedTier.basePriceCents,
                term,
                selectedAddOns:
                    selectedPricingAddOns,
                quoteDiscountPercent:
                    Number(quoteDiscountPercent) || 0,
            });
        } catch {
            return null;
        }
    }, [
        productSeats,
        quoteDiscountPercent,
        selectedPricingAddOns,
        selectedProduct,
        selectedTier,
        term,
    ]);

    function handleProductChange(value: string) {
        setProductId(value);
        setTierId("");
        setAddOnState({});
    }

    function handleTierChange(value: string) {
        setTierId(value);
        setAddOnState({});
    }

    function toggleAddOn(
        featureId: string,
        selected: boolean,
    ) {
        setAddOnState((current) => ({
            ...current,
            [featureId]: {
                selected,
                quantity:
                    current[featureId]?.quantity ?? "1",
            },
        }));
    }

    function updateAddOnQuantity(
        featureId: string,
        quantity: string,
    ) {
        setAddOnState((current) => ({
            ...current,
            [featureId]: {
                selected: true,
                quantity,
            },
        }));
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        if (
            !quoteName.trim() ||
            !customerName.trim() ||
            !productId ||
            !tierId ||
            Number(productSeats) <= 0
        ) {
            setError(
                "Complete all required quote fields.",
            );
            return;
        }

        for (const addOn of selectedPricingAddOns) {
            if (
                addOn.pricingModel ===
                "PER_SEAT_MONTHLY" &&
                (!addOn.quantity ||
                    addOn.quantity <= 0)
            ) {
                setError(
                    `Enter a valid seat quantity for ${addOn.featureName}.`,
                );
                return;
            }
        }

        setError("");
        setIsSaving(true);

        try {
            const response = await fetch(
                "/api/quotes",
                {
                    method: "POST",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify({
                        quoteName: quoteName.trim(),
                        customerName:
                            customerName.trim(),
                        productId,
                        tierId,
                        productSeats:
                            Number(productSeats),
                        term,
                        selectedAddOns:
                            selectedPricingAddOns.map(
                                (addOn) => ({
                                    featureId:
                                        addOn.featureId,
                                    quantity:
                                        addOn.quantity,
                                }),
                            ),
                        quoteDiscountPercent:
                            Number(
                                quoteDiscountPercent,
                            ) || 0,
                    }),
                },
            );

            const data =
                (await response.json()) as QuoteResponse;

            if (!response.ok || !data.quote) {
                throw new Error(
                    data.issues?.[0]?.message ??
                    data.error ??
                    "Unable to create quote.",
                );
            }

            router.push(
                `/quotes/${data.quote.publicId}`,
            );
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Unable to create quote.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <div className={styles.message}>
                Loading catalog...
            </div>
        );
    }

    return (
        <form
            className={styles.layout}
            onSubmit={handleSubmit}
        >
            <div className={styles.formColumn}>
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <section className={styles.card}>
                    <h2>Quote details</h2>

                    <label className={styles.field}>
                        <span>Quote name</span>

                        <input
                            value={quoteName}
                            onChange={(event) =>
                                setQuoteName(
                                    event.target.value,
                                )
                            }
                            placeholder="Acme Corp - Q3 proposal"
                        />
                    </label>

                    <label className={styles.field}>
                        <span>Customer name</span>

                        <input
                            value={customerName}
                            onChange={(event) =>
                                setCustomerName(
                                    event.target.value,
                                )
                            }
                            placeholder="Acme Corporation"
                        />
                    </label>
                </section>

                <section className={styles.card}>
                    <h2>Product and term</h2>

                    <label className={styles.field}>
                        <span>Product</span>

                        <select
                            value={productId}
                            onChange={(event) =>
                                handleProductChange(
                                    event.target.value,
                                )
                            }
                        >
                            <option value="">
                                Select product
                            </option>

                            {products.map((product) => (
                                <option
                                    key={product._id}
                                    value={product._id}
                                >
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className={styles.field}>
                        <span>Tier</span>

                        <select
                            value={tierId}
                            disabled={!selectedProduct}
                            onChange={(event) =>
                                handleTierChange(
                                    event.target.value,
                                )
                            }
                        >
                            <option value="">
                                Select tier
                            </option>

                            {selectedProduct?.tiers.map(
                                (tier) => (
                                    <option
                                        key={tier.id}
                                        value={tier.id}
                                    >
                                        {tier.name} —{" "}
                                        {formatUsd(
                                            tier.basePriceCents,
                                        )}{" "}
                                        per seat/month
                                    </option>
                                ),
                            )}
                        </select>
                    </label>

                    <div className={styles.twoColumns}>
                        <label className={styles.field}>
                            <span>Product seats</span>

                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={productSeats}
                                onChange={(event) =>
                                    setProductSeats(
                                        event.target.value,
                                    )
                                }
                            />
                        </label>

                        <label className={styles.field}>
                            <span>Term</span>

                            <select
                                value={term}
                                onChange={(event) =>
                                    setTerm(
                                        event.target
                                            .value as QuoteTerm,
                                    )
                                }
                            >
                                {Object.entries(
                                    TERM_LABELS,
                                ).map(([value, label]) => (
                                    <option
                                        key={value}
                                        value={value}
                                    >
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </section>

                {selectedTier && (
                    <section className={styles.card}>
                        <h2>Available add-ons</h2>

                        {availableAddOns.length ===
                            0 ? (
                            <p className={styles.muted}>
                                No paid add-ons are available for
                                this tier.
                            </p>
                        ) : (
                            <div
                                className={styles.addOnList}
                            >
                                {availableAddOns.map(
                                    (addOn) => {
                                        const state =
                                            addOnState[
                                            addOn.featureId
                                            ];

                                        return (
                                            <article
                                                className={
                                                    styles.addOnCard
                                                }
                                                key={addOn.featureId}
                                            >
                                                <label
                                                    className={
                                                        styles.checkboxLabel
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            state?.selected ??
                                                            false
                                                        }
                                                        onChange={(event) =>
                                                            toggleAddOn(
                                                                addOn.featureId,
                                                                event.target
                                                                    .checked,
                                                            )
                                                        }
                                                    />

                                                    <span>
                                                        <strong>
                                                            {
                                                                addOn.featureName
                                                            }
                                                        </strong>

                                                        <small>
                                                            {addOn.pricingModel ===
                                                                "FIXED_MONTHLY"
                                                                ? `${formatUsd(
                                                                    addOn.priceCents ??
                                                                    0,
                                                                )} monthly`
                                                                : addOn.pricingModel ===
                                                                    "PER_SEAT_MONTHLY"
                                                                    ? `${formatUsd(
                                                                        addOn.priceCents ??
                                                                        0,
                                                                    )} per seat/month`
                                                                    : `${addOn.percentage}% of product price`}
                                                        </small>
                                                    </span>
                                                </label>

                                                {state?.selected &&
                                                    addOn.pricingModel ===
                                                    "PER_SEAT_MONTHLY" && (
                                                        <label
                                                            className={
                                                                styles.quantity
                                                            }
                                                        >
                                                            Add-on seats

                                                            <input
                                                                type="number"
                                                                min="1"
                                                                step="1"
                                                                value={
                                                                    state.quantity
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateAddOnQuantity(
                                                                        addOn.featureId,
                                                                        event.target
                                                                            .value,
                                                                    )
                                                                }
                                                            />
                                                        </label>
                                                    )}
                                            </article>
                                        );
                                    },
                                )}
                            </div>
                        )}
                    </section>
                )}

                <section className={styles.card}>
                    <label className={styles.field}>
                        <span>
                            Optional quote discount (%)
                        </span>

                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={quoteDiscountPercent}
                            onChange={(event) =>
                                setQuoteDiscountPercent(
                                    event.target.value,
                                )
                            }
                        />
                    </label>
                </section>

                <button
                    className={styles.submitButton}
                    type="submit"
                    disabled={
                        isSaving || !selectedTier
                    }
                >
                    {isSaving
                        ? "Saving quote..."
                        : "Save and view quote"}
                </button>
            </div>

            <aside className={styles.preview}>
                <h2>Pricing preview</h2>

                {!preview ? (
                    <p className={styles.muted}>
                        Select a product, tier and valid
                        quantities to preview pricing.
                    </p>
                ) : (
                    <>
                        <div className={styles.lineItems}>
                            {preview.lineItems.map(
                                (lineItem, index) => (
                                    <div
                                        className={styles.lineItem}
                                        key={`${lineItem.name}-${index}`}
                                    >
                                        <div>
                                            <strong>
                                                {lineItem.name}
                                            </strong>

                                            <small>
                                                {
                                                    lineItem.calculation
                                                }
                                            </small>
                                        </div>

                                        <span>
                                            {formatUsd(
                                                lineItem.amountCents,
                                            )}
                                        </span>
                                    </div>
                                ),
                            )}
                        </div>

                        <div className={styles.summaryRow}>
                            <span>Subtotal</span>
                            <strong>
                                {formatUsd(
                                    preview.subtotalCents,
                                )}
                            </strong>
                        </div>

                        {preview.quoteDiscountPercent >
                            0 && (
                                <div className={styles.summaryRow}>
                                    <span>
                                        Quote discount (
                                        {
                                            preview.quoteDiscountPercent
                                        }
                                        %)
                                    </span>

                                    <strong>
                                        -
                                        {formatUsd(
                                            preview.quoteDiscountAmountCents,
                                        )}
                                    </strong>
                                </div>
                            )}

                        <div className={styles.totalRow}>
                            <span>Total</span>

                            <strong>
                                {formatUsd(
                                    preview.totalCents,
                                )}
                            </strong>
                        </div>
                    </>
                )}
            </aside>
        </form>
    );
}