"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

import type {
    AddOnPricingModel,
    FeatureAvailability,
    Product,
} from "@/types/catalog";

import styles from "./ProductForm.module.css";

interface TierFormState {
    id: string;
    name: string;
    basePrice: string;
}

interface TierConfigurationFormState {
    tierId: string;
    availability: FeatureAvailability;
    pricingModel: AddOnPricingModel;
    price: string;
    percentage: string;
}

interface FeatureFormState {
    id: string;
    name: string;
    tierConfigurations: TierConfigurationFormState[];
}

interface ProductFormState {
    name: string;
    tiers: TierFormState[];
    features: FeatureFormState[];
}

interface ProductFormProps {
    mode: "create" | "edit";
    productId?: string;
    initialProduct?: Product;
}

interface ApiErrorResponse {
    error?: string;
    issues?: {
        message: string;
    }[];
}

const DEFAULT_TIER_ID = "starter-tier";
const DEFAULT_FEATURE_ID = "feature-1";

function createInitialForm(): ProductFormState {
    return {
        name: "",
        tiers: [
            {
                id: DEFAULT_TIER_ID,
                name: "Starter",
                basePrice: "",
            },
        ],
        features: [
            {
                id: DEFAULT_FEATURE_ID,
                name: "",
                tierConfigurations: [
                    {
                        tierId: DEFAULT_TIER_ID,
                        availability: "NOT_AVAILABLE",
                        pricingModel: "FIXED_MONTHLY",
                        price: "",
                        percentage: "",
                    },
                ],
            },
        ],
    };
}

function convertProductToForm(
    product: Product,
): ProductFormState {
    return {
        name: product.name,
        tiers: product.tiers.map((tier) => ({
            id: tier.id,
            name: tier.name,
            basePrice: String(tier.basePriceCents / 100),
        })),
        features: product.features.map((feature) => ({
            id: feature.id,
            name: feature.name,
            tierConfigurations:
                feature.tierConfigurations.map(
                    (configuration) => ({
                        tierId: configuration.tierId,
                        availability: configuration.availability,
                        pricingModel:
                            configuration.pricingModel ??
                            "FIXED_MONTHLY",
                        price:
                            configuration.priceCents === undefined
                                ? ""
                                : String(
                                    configuration.priceCents / 100,
                                ),
                        percentage:
                            configuration.percentage === undefined
                                ? ""
                                : String(configuration.percentage),
                    }),
                ),
        })),
    };
}

function createId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID()}`;
}

function dollarsToCents(value: string): number {
    return Math.round(Number(value) * 100);
}

export default function ProductForm({
    mode,
    productId,
    initialProduct,
}: ProductFormProps) {
    const router = useRouter();

    const [form, setForm] = useState<ProductFormState>(
        initialProduct
            ? convertProductToForm(initialProduct)
            : createInitialForm(),
    );

    const [error, setError] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    function updateTier(
        tierId: string,
        field: "name" | "basePrice",
        value: string,
    ) {
        setForm((currentForm) => ({
            ...currentForm,
            tiers: currentForm.tiers.map((tier) =>
                tier.id === tierId
                    ? {
                        ...tier,
                        [field]: value,
                    }
                    : tier,
            ),
        }));
    }

    function addTier() {
        const tierId = createId("tier");

        setForm((currentForm) => ({
            ...currentForm,
            tiers: [
                ...currentForm.tiers,
                {
                    id: tierId,
                    name: "",
                    basePrice: "",
                },
            ],
            features: currentForm.features.map(
                (feature) => ({
                    ...feature,
                    tierConfigurations: [
                        ...feature.tierConfigurations,
                        {
                            tierId,
                            availability: "NOT_AVAILABLE",
                            pricingModel: "FIXED_MONTHLY",
                            price: "",
                            percentage: "",
                        },
                    ],
                }),
            ),
        }));
    }

    function updateFeatureName(
        featureId: string,
        name: string,
    ) {
        setForm((currentForm) => ({
            ...currentForm,
            features: currentForm.features.map(
                (feature) =>
                    feature.id === featureId
                        ? {
                            ...feature,
                            name,
                        }
                        : feature,
            ),
        }));
    }

    function addFeature() {
        const featureId = createId("feature");

        setForm((currentForm) => ({
            ...currentForm,
            features: [
                ...currentForm.features,
                {
                    id: featureId,
                    name: "",
                    tierConfigurations:
                        currentForm.tiers.map((tier) => ({
                            tierId: tier.id,
                            availability: "NOT_AVAILABLE",
                            pricingModel: "FIXED_MONTHLY",
                            price: "",
                            percentage: "",
                        })),
                },
            ],
        }));
    }

    function updateConfiguration(
        featureId: string,
        tierId: string,
        updates: Partial<TierConfigurationFormState>,
    ) {
        setForm((currentForm) => ({
            ...currentForm,
            features: currentForm.features.map(
                (feature) =>
                    feature.id === featureId
                        ? {
                            ...feature,
                            tierConfigurations:
                                feature.tierConfigurations.map(
                                    (configuration) =>
                                        configuration.tierId === tierId
                                            ? {
                                                ...configuration,
                                                ...updates,
                                            }
                                            : configuration,
                                ),
                        }
                        : feature,
            ),
        }));
    }

    function validateForm(): string | null {
        if (form.name.trim().length < 2) {
            return "Enter a valid product name.";
        }

        for (const tier of form.tiers) {
            if (!tier.name.trim()) {
                return "Every tier must have a name.";
            }

            if (
                tier.basePrice.trim() === "" ||
                !Number.isFinite(Number(tier.basePrice)) ||
                Number(tier.basePrice) < 0
            ) {
                return `Enter a valid base price for ${tier.name || "each tier"}.`;
            }
        }

        for (const feature of form.features) {
            if (!feature.name.trim()) {
                return "Every feature must have a name.";
            }

            for (const configuration of feature.tierConfigurations) {
                if (
                    configuration.availability !== "ADD_ON"
                ) {
                    continue;
                }

                if (
                    configuration.pricingModel ===
                    "PERCENT_OF_PRODUCT" &&
                    (configuration.percentage.trim() === "" ||
                        Number(configuration.percentage) <= 0 ||
                        Number(configuration.percentage) > 100)
                ) {
                    return `Enter a valid percentage for ${feature.name}.`;
                }

                if (
                    configuration.pricingModel !==
                    "PERCENT_OF_PRODUCT" &&
                    (configuration.price.trim() === "" ||
                        Number(configuration.price) <= 0)
                ) {
                    return `Enter a valid add-on price for ${feature.name}.`;
                }
            }
        }

        return null;
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const validationError = validateForm();

        if (validationError) {
            setError(validationError);
            return;
        }

        const payload = {
            name: form.name.trim(),

            tiers: form.tiers.map((tier) => ({
                id: tier.id,
                name: tier.name.trim(),
                basePriceCents: dollarsToCents(
                    tier.basePrice,
                ),
            })),

            features: form.features.map((feature) => ({
                id: feature.id,
                name: feature.name.trim(),

                tierConfigurations:
                    feature.tierConfigurations.map(
                        (configuration) => {
                            if (
                                configuration.availability !==
                                "ADD_ON"
                            ) {
                                return {
                                    tierId: configuration.tierId,
                                    availability:
                                        configuration.availability,
                                };
                            }

                            if (
                                configuration.pricingModel ===
                                "PERCENT_OF_PRODUCT"
                            ) {
                                return {
                                    tierId: configuration.tierId,
                                    availability: "ADD_ON" as const,
                                    pricingModel:
                                        configuration.pricingModel,
                                    percentage: Number(
                                        configuration.percentage,
                                    ),
                                };
                            }

                            return {
                                tierId: configuration.tierId,
                                availability: "ADD_ON" as const,
                                pricingModel:
                                    configuration.pricingModel,
                                priceCents: dollarsToCents(
                                    configuration.price,
                                ),
                            };
                        },
                    ),
            })),
        };

        setError("");
        setIsSaving(true);

        try {
            const endpoint =
                mode === "edit" && productId
                    ? `/api/products/${productId}`
                    : "/api/products";

            const response = await fetch(endpoint, {
                method: mode === "edit" ? "PATCH" : "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const responseData =
                (await response.json()) as ApiErrorResponse;

            if (!response.ok) {
                throw new Error(
                    responseData.issues?.[0]?.message ??
                    responseData.error ??
                    "Unable to save the product.",
                );
            }

            router.push("/catalog");
            router.refresh();
        } catch (saveError) {
            setError(
                saveError instanceof Error
                    ? saveError.message
                    : "Unable to save the product.",
            );
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <form
            className={styles.form}
            onSubmit={handleSubmit}
        >
            {error && (
                <div className={styles.errorMessage}>
                    {error}
                </div>
            )}

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <p className={styles.step}>Step 1</p>
                        <h2>Product information</h2>
                    </div>
                </div>

                <label className={styles.field}>
                    <span>Product name</span>

                    <input
                        type="text"
                        value={form.name}
                        onChange={(event) =>
                            setForm((currentForm) => ({
                                ...currentForm,
                                name: event.target.value,
                            }))
                        }
                        placeholder="Example: Analytics Suite"
                    />
                </label>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <p className={styles.step}>Step 2</p>
                        <h2>Pricing tiers</h2>
                        <p>
                            Define the monthly price per seat for
                            each tier.
                        </p>
                    </div>

                    <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={addTier}
                    >
                        + Add tier
                    </button>
                </div>

                <div className={styles.tierGrid}>
                    {form.tiers.map((tier, index) => (
                        <article
                            className={styles.tierCard}
                            key={tier.id}
                        >
                            <strong>Tier {index + 1}</strong>

                            <label className={styles.field}>
                                <span>Tier name</span>

                                <input
                                    type="text"
                                    value={tier.name}
                                    onChange={(event) =>
                                        updateTier(
                                            tier.id,
                                            "name",
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Growth"
                                />
                            </label>

                            <label className={styles.field}>
                                <span>
                                    Base price per seat/month
                                </span>

                                <div className={styles.moneyInput}>
                                    <span>$</span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={tier.basePrice}
                                        onChange={(event) =>
                                            updateTier(
                                                tier.id,
                                                "basePrice",
                                                event.target.value,
                                            )
                                        }
                                        placeholder="50"
                                    />
                                </div>
                            </label>
                        </article>
                    ))}
                </div>
            </section>

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <div>
                        <p className={styles.step}>Step 3</p>
                        <h2>Features and availability</h2>
                        <p>
                            Configure how each feature is offered
                            in every tier.
                        </p>
                    </div>

                    <button
                        className={styles.secondaryButton}
                        type="button"
                        onClick={addFeature}
                    >
                        + Add feature
                    </button>
                </div>

                <div className={styles.featureList}>
                    {form.features.map(
                        (feature, featureIndex) => (
                            <article
                                className={styles.featureCard}
                                key={feature.id}
                            >
                                <div
                                    className={styles.featureHeader}
                                >
                                    <strong>
                                        Feature {featureIndex + 1}
                                    </strong>

                                    <input
                                        type="text"
                                        value={feature.name}
                                        onChange={(event) =>
                                            updateFeatureName(
                                                feature.id,
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Example: Single Sign-On"
                                    />
                                </div>

                                <div
                                    className={
                                        styles.configurationList
                                    }
                                >
                                    {form.tiers.map((tier) => {
                                        const configuration =
                                            feature.tierConfigurations.find(
                                                (item) =>
                                                    item.tierId === tier.id,
                                            );

                                        if (!configuration) {
                                            return null;
                                        }

                                        return (
                                            <div
                                                className={
                                                    styles.configurationRow
                                                }
                                                key={tier.id}
                                            >
                                                <div
                                                    className={styles.tierName}
                                                >
                                                    {tier.name || "Unnamed tier"}
                                                </div>

                                                <label
                                                    className={styles.field}
                                                >
                                                    <span>Availability</span>

                                                    <select
                                                        value={
                                                            configuration.availability
                                                        }
                                                        onChange={(event) =>
                                                            updateConfiguration(
                                                                feature.id,
                                                                tier.id,
                                                                {
                                                                    availability:
                                                                        event.target
                                                                            .value as FeatureAvailability,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        <option value="INCLUDED">
                                                            Included
                                                        </option>

                                                        <option value="ADD_ON">
                                                            Paid add-on
                                                        </option>

                                                        <option value="NOT_AVAILABLE">
                                                            Not available
                                                        </option>
                                                    </select>
                                                </label>

                                                {configuration.availability ===
                                                    "ADD_ON" && (
                                                        <>
                                                            <label
                                                                className={styles.field}
                                                            >
                                                                <span>
                                                                    Pricing model
                                                                </span>

                                                                <select
                                                                    value={
                                                                        configuration.pricingModel
                                                                    }
                                                                    onChange={(event) =>
                                                                        updateConfiguration(
                                                                            feature.id,
                                                                            tier.id,
                                                                            {
                                                                                pricingModel:
                                                                                    event.target
                                                                                        .value as AddOnPricingModel,
                                                                            },
                                                                        )
                                                                    }
                                                                >
                                                                    <option value="FIXED_MONTHLY">
                                                                        Fixed monthly
                                                                    </option>

                                                                    <option value="PER_SEAT_MONTHLY">
                                                                        Per seat/month
                                                                    </option>

                                                                    <option value="PERCENT_OF_PRODUCT">
                                                                        Percentage of product
                                                                    </option>
                                                                </select>
                                                            </label>

                                                            {configuration.pricingModel ===
                                                                "PERCENT_OF_PRODUCT" ? (
                                                                <label
                                                                    className={
                                                                        styles.field
                                                                    }
                                                                >
                                                                    <span>Percentage</span>

                                                                    <div
                                                                        className={
                                                                            styles.moneyInput
                                                                        }
                                                                    >
                                                                        <input
                                                                            type="number"
                                                                            min="0.01"
                                                                            max="100"
                                                                            step="0.01"
                                                                            value={
                                                                                configuration.percentage
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateConfiguration(
                                                                                    feature.id,
                                                                                    tier.id,
                                                                                    {
                                                                                        percentage:
                                                                                            event.target
                                                                                                .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                            placeholder="10"
                                                                        />

                                                                        <span>%</span>
                                                                    </div>
                                                                </label>
                                                            ) : (
                                                                <label
                                                                    className={
                                                                        styles.field
                                                                    }
                                                                >
                                                                    <span>
                                                                        Monthly price
                                                                    </span>

                                                                    <div
                                                                        className={
                                                                            styles.moneyInput
                                                                        }
                                                                    >
                                                                        <span>$</span>

                                                                        <input
                                                                            type="number"
                                                                            min="0.01"
                                                                            step="0.01"
                                                                            value={
                                                                                configuration.price
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) =>
                                                                                updateConfiguration(
                                                                                    feature.id,
                                                                                    tier.id,
                                                                                    {
                                                                                        price:
                                                                                            event.target
                                                                                                .value,
                                                                                    },
                                                                                )
                                                                            }
                                                                            placeholder="200"
                                                                        />
                                                                    </div>
                                                                </label>
                                                            )}
                                                        </>
                                                    )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </article>
                        ),
                    )}
                </div>
            </section>

            <div className={styles.actions}>
                <Link
                    className={styles.cancelButton}
                    href="/catalog"
                >
                    Cancel
                </Link>

                <button
                    className={styles.saveButton}
                    type="submit"
                    disabled={isSaving}
                >
                    {isSaving
                        ? "Saving..."
                        : mode === "edit"
                            ? "Save changes"
                            : "Create product"}
                </button>
            </div>
        </form>
    );
}