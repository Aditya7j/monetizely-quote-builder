"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { Product } from "@/types/catalog";

import styles from "./catalog.module.css";

interface ProductsResponse {
    products: Product[];
}

export default function CatalogPage() {
    const [products, setProducts] = useState<Product[]>(
        [],
    );

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadProducts() {
            try {
                const response = await fetch("/api/products");

                if (!response.ok) {
                    throw new Error(
                        "Unable to load the catalog.",
                    );
                }

                const data =
                    (await response.json()) as ProductsResponse;

                setProducts(data.products);
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Unable to load the catalog.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadProducts();
    }, []);

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <Link className={styles.backLink} href="/">
                    ← Back to home
                </Link>

                <header className={styles.pageHeader}>
                    <div>
                        <p className={styles.eyebrow}>
                            Catalog setup
                        </p>

                        <h1>Products and pricing</h1>

                        <p>
                            Create products, tiers, features and
                            add-on pricing.
                        </p>
                    </div>

                    <Link
                        className={styles.primaryLink}
                        href="/catalog/new"
                    >
                        + Add product
                    </Link>
                </header>

                {isLoading && (
                    <div className={styles.loadingState}>
                        Loading catalog...
                    </div>
                )}

                {error && (
                    <div className={styles.errorState}>
                        {error}
                    </div>
                )}

                {!isLoading &&
                    !error &&
                    products.length === 0 && (
                        <section className={styles.emptyState}>
                            <h2>No products yet</h2>

                            <p>
                                Create your first product and define
                                its pricing catalog.
                            </p>

                            <Link
                                className={styles.primaryLink}
                                href="/catalog/new"
                            >
                                Create product
                            </Link>
                        </section>
                    )}

                {!isLoading && products.length > 0 && (
                    <section className={styles.productGrid}>
                        {products.map((product) => (
                            <article
                                className={styles.productCard}
                                key={product._id}
                            >
                                <h2>{product.name}</h2>

                                <div className={styles.productStats}>
                                    <span>
                                        {product.tiers.length} tiers
                                    </span>

                                    <span>
                                        {product.features.length} features
                                    </span>
                                </div>

                                <Link
                                    className={styles.editLink}
                                    href={`/catalog/${product._id}`}
                                >
                                    Edit catalog →
                                </Link>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </main>
    );
}