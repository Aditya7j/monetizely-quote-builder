"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import ProductForm from "@/components/ProductForm";
import type { Product } from "@/types/catalog";

import styles from "../catalog.module.css";

interface ProductResponse {
    product: Product;
}

export default function EditProductPage() {
    const params = useParams<{ id: string }>();
    const productId = params.id;

    const [product, setProduct] =
        useState<Product | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadProduct() {
            try {
                const response = await fetch(
                    `/api/products/${productId}`,
                );

                const data =
                    (await response.json()) as ProductResponse & {
                        error?: string;
                    };

                if (!response.ok) {
                    throw new Error(
                        data.error ?? "Unable to load product.",
                    );
                }

                setProduct(data.product);
            } catch (loadError) {
                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : "Unable to load product.",
                );
            } finally {
                setIsLoading(false);
            }
        }

        void loadProduct();
    }, [productId]);

    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <Link
                    className={styles.backLink}
                    href="/catalog"
                >
                    ← Back to catalog
                </Link>

                {isLoading && (
                    <div className={styles.loadingState}>
                        Loading product...
                    </div>
                )}

                {error && (
                    <div className={styles.errorState}>
                        {error}
                    </div>
                )}

                {product && (
                    <>
                        <header className={styles.pageHeader}>
                            <div>
                                <p className={styles.eyebrow}>
                                    Catalog setup
                                </p>

                                <h1>Edit {product.name}</h1>

                                <p>
                                    Update tiers, features and add-on
                                    pricing.
                                </p>
                            </div>
                        </header>

                        <ProductForm
                            mode="edit"
                            productId={productId}
                            initialProduct={product}
                        />
                    </>
                )}
            </div>
        </main>
    );
}