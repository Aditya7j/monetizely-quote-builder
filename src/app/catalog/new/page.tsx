import Link from "next/link";

import ProductForm from "@/components/ProductForm";

import styles from "../catalog.module.css";

export default function NewProductPage() {
    return (
        <main className={styles.page}>
            <div className={styles.container}>
                <Link
                    className={styles.backLink}
                    href="/catalog"
                >
                    ← Back to catalog
                </Link>

                <header className={styles.pageHeader}>
                    <div>
                        <p className={styles.eyebrow}>
                            Catalog setup
                        </p>

                        <h1>Create product</h1>

                        <p>
                            Define tiers, base pricing, features and
                            add-on rules.
                        </p>
                    </div>
                </header>

                <ProductForm mode="create" />
            </div>
        </main>
    );
}