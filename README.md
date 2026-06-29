# SaaS Quote Builder

A full-stack SaaS quoting application built for the Monetizely take-home exercise.

The application allows an analyst to configure a SaaS product catalog with pricing tiers and feature availability, then create transparent customer quotes with shareable read-only URLs.

## Live Application

The deployed application URL will be added here after deployment.

## Repository

The GitHub repository contains the complete source code, unit tests, end-to-end test, and setup instructions.

## Features

### Catalog Setup

- Create multiple products
- Add multiple pricing tiers to each product
- Configure a monthly base price per seat for every tier
- Add product features
- Configure feature availability separately for every tier
- Edit previously created catalog entries

Supported feature availability options:

- Included
- Paid add-on
- Not available

Supported add-on pricing models:

- Fixed monthly price
- Per-seat monthly price
- Percentage of the product price

### Quote Builder

- Enter a customer name
- Enter a quote name
- Select a product
- Select a pricing tier
- Enter the number of product seats
- Select a monthly, annual, or two-year term
- Select available paid add-ons
- Enter an independent seat quantity for per-seat add-ons
- Apply an optional quote-level discount
- Preview pricing before saving
- Save the quote to MongoDB
- Generate a public read-only quote URL

### Public Quote

The public quote page displays:

- Quote name
- Customer name
- Creation date
- Valid-until date
- Product
- Tier
- Product seats
- Term
- Individual price components
- Calculation used for every line item
- Subtotal
- Quote-level discount
- Final total

Public quote URLs can be viewed without authentication.

## Technology Stack

- Next.js App Router
- React
- TypeScript
- Node.js
- MongoDB Atlas
- Mongoose
- Zod
- CSS Modules
- Vitest
- Playwright
- Vercel

## Local Setup

### 1. Clone the repository

```bash
git clone "https://github.com/Aditya7j/monetizely-quote-builder"
cd monetizely-quote-builder

