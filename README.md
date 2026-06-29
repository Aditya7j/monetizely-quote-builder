# SaaS Quote Builder

A full-stack SaaS quoting application built for the Monetizely take-home exercise.

The application allows an analyst to configure a SaaS product catalog with multiple pricing tiers and tier-specific feature availability, then generate transparent customer quotes with public, read-only URLs.

## Live Application

`https://monetizely-quote-builder-smoky.vercel.app/`

## GitHub Repository

`https://github.com/Aditya7j/monetizely-quote-builder`

---

## Features

### Catalog Setup

Analysts can:

* Create multiple products
* Add multiple pricing tiers to each product
* Configure a monthly base price per seat for every tier
* Add multiple features to each product
* Configure feature availability independently for every tier
* Edit existing products, tiers, features, availability rules, and prices

Supported feature availability options:

* **Included** — available without an additional charge
* **Paid add-on** — available for an additional price
* **Not available** — cannot be purchased for the selected tier

Supported add-on pricing models:

* **Fixed monthly**
* **Per-seat monthly**
* **Percentage of product price**

Catalog deletion is intentionally not included because it was outside the requested scope.

### Quote Builder

Analysts can create a quote by entering:

* Quote name
* Customer name
* Product
* Tier
* Number of product seats
* Term length
* Selected paid add-ons
* Add-on seat quantities when required
* Optional quote-level discount percentage

The quote builder provides a live pricing preview before the quote is saved.

### Supported Terms

| Term     |  Duration | Base Product Discount |
| -------- | --------: | --------------------: |
| Monthly  |   1 month |                    0% |
| Annual   | 12 months |                   15% |
| Two-year | 24 months |                   25% |

### Public Quote Page

After a quote is saved, the application creates a public, read-only URL.

The public quote page displays:

* Quote name
* Customer name
* Quote creation date
* Valid-until date
* Product
* Tier
* Product seat quantity
* Term
* Individual pricing line items
* Human-readable calculation for every line item
* Subtotal
* Quote-level discount
* Final total

The public quote can be opened without authentication.

---

## Technology Stack

* Next.js App Router
* React
* TypeScript
* Node.js
* MongoDB Atlas
* Mongoose
* Zod
* CSS Modules
* Vitest
* Playwright
* Vercel

---

## Application Routes

| Route                | Description                      |
| -------------------- | -------------------------------- |
| `/`                  | Application home page            |
| `/catalog`           | View configured products         |
| `/catalog/new`       | Create a new product catalog     |
| `/catalog/[id]`      | Edit an existing product catalog |
| `/quotes/new`        | Build and save a customer quote  |
| `/quotes/[publicId]` | View a public read-only quote    |

---

## API Routes

| Method  | Route                | Description                |
| ------- | -------------------- | -------------------------- |
| `GET`   | `/api/products`      | Retrieve all products      |
| `POST`  | `/api/products`      | Create a product           |
| `GET`   | `/api/products/[id]` | Retrieve one product       |
| `PATCH` | `/api/products/[id]` | Update a product           |
| `POST`  | `/api/quotes`        | Calculate and save a quote |

The quote API performs pricing calculations on the server and does not trust totals submitted by the browser.

---

## Local Setup

### Prerequisites

* Node.js 20 or later
* npm
* MongoDB Atlas account

### 1. Clone the repository

```bash
git clone https://github.com/Aditya7j/monetizely-quote-builder
cd monetizely-quote-builder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
```

Example format:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/monetizely_quote_builder?retryWrites=true&w=majority
```

Do not commit `.env.local` to GitHub.

A safe example is available in:

```text
.env.example
```

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Available Commands

### Start development server

```bash
npm run dev
```

### Create production build

```bash
npm run build
```

### Start production server

```bash
npm run start
```

### Run ESLint

```bash
npm run lint
```

### Run unit tests in watch mode

```bash
npm run test
```

### Run unit tests once

```bash
npm run test:run
```

### Run the Playwright end-to-end test

```bash
npm run test:e2e
```

### Open the Playwright HTML report

```bash
npm run test:e2e:report
```

---

## Pricing Rules

All money values are stored and calculated using integer cents.

For example:

```text
$50.00 = 5000 cents
```

This avoids JavaScript floating-point precision problems.

### Base Product Price

```text
base product before discount
=
product seats
× monthly price per seat
× term months
```

The term discount is applied only to the base product:

```text
term discount amount
=
base product before discount
× term discount percentage
```

```text
discounted base product
=
base product before discount
- term discount amount
```

### Fixed Monthly Add-on

```text
add-on total
=
fixed monthly price
× term months
```

### Per-seat Monthly Add-on

```text
add-on total
=
add-on seat quantity
× add-on price per seat per month
× term months
```

The add-on seat quantity can be different from the product seat quantity.

### Percentage Add-on

```text
add-on total
=
discounted base product total
× add-on percentage
```

### Quote-level Discount

```text
subtotal
=
discounted base product
+ all selected add-ons
```

```text
quote discount amount
=
subtotal
× quote discount percentage
```

```text
final total
=
subtotal
- quote discount amount
```

---

## Sample Pricing Calculation

Example quote:

* Product: Analytics Suite
* Tier: Growth
* Product seats: 25
* Monthly base price: $50 per seat
* Term: Annual
* Single Sign-On: $200 fixed monthly
* API access: $50 per add-on seat per month
* API add-on seats: 5

### Base Product

```text
25 seats × $50 × 12 months
= $15,000
```

### Annual Term Discount

```text
$15,000 × 15%
= $2,250
```

### Discounted Base Product

```text
$15,000 - $2,250
= $12,750
```

### Single Sign-On Add-on

```text
$200 × 12 months
= $2,400
```

### API Access Add-on

```text
5 add-on seats × $50 × 12 months
= $3,000
```

### Final Total

```text
$12,750 + $2,400 + $3,000
= $18,150
```

---

## Testing

### Unit Tests

The pricing engine is implemented as isolated TypeScript functions so that business rules can be tested independently from the UI and database.

Vitest unit tests cover:

* Monthly pricing without a term discount
* Annual pricing with a 15% discount
* Two-year pricing with a 25% discount
* Fixed monthly add-ons
* Per-seat monthly add-ons
* Independent add-on seat quantities
* Percentage-of-product add-ons
* Multiple pricing components
* Quote-level discounts
* Invalid product seat quantities
* Invalid discount percentages
* The supplied sample quote total of `$18,150`

Run the unit tests with:

```bash
npm run test:run
```

### End-to-End Test

The Playwright test covers the complete required workflow:

```text
Create a catalog product
→ configure a paid add-on
→ save the product
→ create a customer quote
→ select the saved product and tier
→ select an add-on
→ verify the pricing preview
→ save the quote
→ open the public quote URL
→ verify the saved line items and total
```

Run the end-to-end test with:

```bash
npm run test:e2e
```

---

## Technical Decisions

### MongoDB Document Structure

MongoDB was selected because the catalog has a naturally nested structure.

Each product document contains:

* Product name
* Pricing tiers
* Features
* Tier-specific feature availability
* Tier-specific add-on pricing

Embedding this information inside a product document keeps catalog creation, retrieval, and editing simple for the scope of this exercise.

### Mongoose Connection Caching

The MongoDB connection is cached during development to prevent Next.js hot reloads from repeatedly creating new database connections.

### Zod Validation

Incoming product and quote data is validated on the server using Zod.

Validation includes:

* Required names
* Positive seat quantities
* Valid discount percentages
* Unique tier names
* Unique feature names
* A configuration for every feature and tier
* Required prices for paid add-ons
* Required seat quantities for per-seat add-ons

### Server-side Quote Calculation

The frontend calculates a live preview for the analyst.

When the quote is saved, the server:

1. Loads the product from MongoDB
2. Finds the selected tier
3. Verifies that every selected add-on is valid
4. Reads pricing values from the stored catalog
5. Recalculates the complete quote
6. Saves the verified result

The server does not accept product prices, add-on prices, or totals directly from the browser.

### Quote Snapshot

A saved quote stores a snapshot containing:

* Product name
* Tier name
* Pricing line items
* Calculation descriptions
* Subtotal
* Quote discount
* Final total

This prevents future catalog edits from changing previously issued quotes.

### Public Quote Identifier

Each quote receives a randomly generated public identifier.

The public URL uses this identifier instead of exposing the MongoDB document ID.

### Immutable Saved Quotes

Saved quotes are treated as read-only snapshots.

Quote editing was not implemented because it was outside the requested scope and could introduce ambiguity around historical pricing.

---

## Assumptions

The following assumptions were made where the specification allowed interpretation:

* Prices are displayed in USD.
* Taxes are not included.
* Quotes are valid for 30 days.
* Term discounts apply only to the base product.
* Term discounts do not apply directly to add-ons.
* Percentage-based add-ons use the discounted base product amount.
* The quote-level discount applies after the base product and all add-ons are added.
* Per-seat add-on quantities are independent of product seat quantities.
* Included features do not create additional quote line items.
* Features marked as not available cannot be selected in the quote builder.
* Saved quotes are immutable.
* Authentication is outside the exercise scope.
* Catalog deletion is outside the exercise scope.
* Quote editing and deletion are outside the exercise scope.
* PDF generation and email delivery are outside the exercise scope.

---

## Questions I Would Ask Product Stakeholders

Given access to the product team, I would clarify:

* Should the quote-validity period be configurable?
* Should term discounts also apply to add-ons?
* Should percentage-based add-ons use the product cost before or after the term discount?
* Should included features appear on the public quote?
* Should included features appear in a separate feature-summary section?
* Should customers be stored as reusable entities?
* Should quotes support multiple revisions?
* Should revised quotes retain a full pricing history?
* Should taxes be calculated based on customer location?
* Should the application support currencies other than USD?
* Should quote-level discounts require approval above a certain percentage?
* Should add-on seat quantities be restricted to the product seat quantity?
* Should analysts be able to set a custom expiration date for each quote?

---

## What I Would Build Next

With additional time, I would add:

* Analyst authentication
* Organization workspaces
* Role-based permissions
* Reusable customer records
* Quote editing
* Quote revisions and version history
* Quote approval workflows
* PDF generation
* Email delivery
* Audit logs
* Multiple currencies
* Tax configuration
* Configurable quote-validity periods
* Catalog deletion with dependency checks
* Product duplication
* Catalog import and export
* Additional API integration tests
* Additional accessibility testing
* Improved loading and error states

---

## Project Structure

```text
monetizely-quote-builder/
├── e2e/
│   └── quote-flow.spec.ts
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── products/
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts
│   │   │   │   └── route.ts
│   │   │   └── quotes/
│   │   │       └── route.ts
│   │   │
│   │   ├── catalog/
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   ├── catalog.module.css
│   │   │   └── page.tsx
│   │   │
│   │   ├── quotes/
│   │   │   ├── [publicId]/
│   │   │   │   ├── page.tsx
│   │   │   │   └── quote.module.css
│   │   │   └── new/
│   │   │       └── page.tsx
│   │   │
│   │   ├── global.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ProductForm.tsx
│   │   ├── ProductForm.module.css
│   │   ├── QuoteBuilder.tsx
│   │   └── QuoteBuilder.module.css
│   │
│   ├── lib/
│   │   ├── pricing/
│   │   │   ├── calculateQuote.ts
│   │   │   └── calculateQuote.test.ts
│   │   └── mongodb.ts
│   │
│   ├── models/
│   │   ├── Product.ts
│   │   └── Quote.ts
│   │
│   ├── types/
│   │   ├── catalog.ts
│   │   └── quote.ts
│   │
│   └── validations/
│       ├── product.ts
│       └── quote.ts
│
├── .env.example
├── .gitignore
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── playwright.config.ts
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## Deployment

The application is designed for deployment on Vercel.

### Vercel Configuration

1. Import the GitHub repository into Vercel.
2. Keep the detected framework as **Next.js**.
3. Add the following environment variable:

```text
MONGODB_URI
```

4. Use the complete MongoDB Atlas connection string as its value.
5. Enable the variable for Production, Preview, and Development.
6. Deploy the application.

After deployment, verify:

* The catalog page loads
* A product can be created
* An existing product can be edited
* A quote can be created
* The public quote URL loads in an Incognito window
* The public quote does not require authentication

---

## Scope Exclusions

The following features were intentionally not implemented because they were outside the assignment requirements:

* Authentication
* Product deletion
* Quote editing
* Quote deletion
* Payments
* Electronic signatures
* PDF generation
* Email sending
* Excel import
* Tax calculation
* Multiple currencies

---

## License

This project was created as a take-home technical exercise.
