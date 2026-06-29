import type { Metadata } from "next";

import "./global.css";

export const metadata: Metadata = {
    title: "Monetizely Quote Builder",
    description: "Create SaaS product catalogs and customer quotes",
};

interface RootLayoutProps {
    children: React.ReactNode;
}

export default function RootLayout({
    children,
}: Readonly<RootLayoutProps>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}