import { expect, test } from "@playwright/test";

test(
  "creates a catalog product, builds a quote, and opens the public quote",
  async ({ page }) => {
    test.setTimeout(90_000);

    const uniqueId = Date.now();

    const productName = `E2E Analytics ${uniqueId}`;
    const featureName = `E2E Single Sign-On ${uniqueId}`;
    const quoteName = `E2E Customer Proposal ${uniqueId}`;
    const customerName = `Acme Test Customer ${uniqueId}`;

    // ==========================================
    // Part 1: Create a catalog product
    // ==========================================

    await page.goto("/catalog/new");

    await expect(
      page.getByRole("heading", {
        name: "Create product",
        exact: true,
      }),
    ).toBeVisible();

    const productNameInput = page
      .locator("label")
      .filter({
        hasText: "Product name",
      })
      .locator('input[type="text"]')
      .first();

    await expect(productNameInput).toBeVisible();
    await productNameInput.fill(productName);

    const tierNameInput = page
      .locator("label")
      .filter({
        hasText: "Tier name",
      })
      .locator('input[type="text"]')
      .first();

    await expect(tierNameInput).toBeVisible();
    await tierNameInput.fill("Growth");

    const basePriceInput = page
      .locator("label")
      .filter({
        hasText: "Base price per seat/month",
      })
      .locator('input[type="number"]')
      .first();

    await expect(basePriceInput).toBeVisible();
    await basePriceInput.fill("50");

    const featureNameInput = page.getByPlaceholder(
      "Example: Single Sign-On",
    );

    await expect(featureNameInput).toBeVisible();
    await featureNameInput.fill(featureName);

    const availabilitySelect = page
      .locator("label")
      .filter({
        hasText: "Availability",
      })
      .locator("select")
      .first();

    await expect(availabilitySelect).toBeVisible();
    await availabilitySelect.selectOption("ADD_ON");

    const pricingModelSelect = page
      .locator("label")
      .filter({
        hasText: "Pricing model",
      })
      .locator("select")
      .first();

    await expect(pricingModelSelect).toBeVisible();

    await pricingModelSelect.selectOption(
      "FIXED_MONTHLY",
    );

    const monthlyPriceInput = page
      .locator("label")
      .filter({
        hasText: "Monthly price",
      })
      .locator('input[type="number"]')
      .first();

    await expect(monthlyPriceInput).toBeVisible();
    await monthlyPriceInput.fill("200");

    await page
      .getByRole("button", {
        name: "Create product",
        exact: true,
      })
      .click();

    await expect(page).toHaveURL(/\/catalog$/);

    await expect(
      page.getByRole("heading", {
        name: productName,
        exact: true,
      }),
    ).toBeVisible();

    // ==========================================
    // Part 2: Build a customer quote
    // ==========================================

    await page.goto("/quotes/new");

    await expect(
      page.getByRole("heading", {
        name: "Create customer quote",
        exact: true,
      }),
    ).toBeVisible();

    const quoteNameInput = page
      .locator("label")
      .filter({
        hasText: "Quote name",
      })
      .locator("input")
      .first();

    await expect(quoteNameInput).toBeVisible();
    await quoteNameInput.fill(quoteName);

    const customerNameInput = page
      .locator("label")
      .filter({
        hasText: "Customer name",
      })
      .locator("input")
      .first();

    await expect(customerNameInput).toBeVisible();
    await customerNameInput.fill(customerName);

    const productSelect = page
      .locator("label")
      .filter({
        hasText: "Product",
      })
      .locator("select")
      .first();

    await expect(productSelect).toBeVisible();

    await productSelect.selectOption({
      label: productName,
    });

    const tierSelect = page
      .locator("label")
      .filter({
        hasText: "Tier",
      })
      .locator("select")
      .first();

    await expect(tierSelect).toBeEnabled();

    const growthOption = tierSelect
      .locator("option")
      .filter({
        hasText: "Growth",
      });

    await expect(growthOption).toHaveCount(1);

    const growthTierValue =
      await growthOption.getAttribute("value");

    if (!growthTierValue) {
      throw new Error(
        "Growth tier option does not contain a value.",
      );
    }

    await tierSelect.selectOption(growthTierValue);

    const productSeatsInput = page
      .locator("label")
      .filter({
        hasText: "Product seats",
      })
      .locator('input[type="number"]')
      .first();

    await expect(productSeatsInput).toBeVisible();
    await productSeatsInput.fill("2");

    const termSelect = page
      .locator("label")
      .filter({
        hasText: "Term",
      })
      .locator("select")
      .first();

    await expect(termSelect).toBeVisible();
    await termSelect.selectOption("ANNUAL");

    const addOnCheckbox = page.getByRole("checkbox", {
      name: new RegExp(featureName),
    });

    await expect(addOnCheckbox).toBeVisible();
    await addOnCheckbox.check();

    const quoteDiscountInput = page
      .locator("label")
      .filter({
        hasText: "Optional quote discount (%)",
      })
      .locator('input[type="number"]')
      .first();

    await expect(quoteDiscountInput).toBeVisible();
    await quoteDiscountInput.fill("10");

    /*
     * Expected pricing:
     *
     * Base product:
     * 2 seats × $50 × 12 months = $1,200
     *
     * Annual discount:
     * $1,200 × 15% = $180
     *
     * Discounted base:
     * $1,200 - $180 = $1,020
     *
     * Fixed monthly add-on:
     * $200 × 12 months = $2,400
     *
     * Subtotal:
     * $1,020 + $2,400 = $3,420
     *
     * Quote-level discount:
     * $3,420 × 10% = $342
     *
     * Final total:
     * $3,420 - $342 = $3,078
     */

    await expect(
      page.getByText("$3,078.00", {
        exact: true,
      }),
    ).toBeVisible();

    await page
      .getByRole("button", {
        name: "Save and view quote",
        exact: true,
      })
      .click();

    // ==========================================
    // Part 3: Verify the public quote
    // ==========================================

    await expect(page).toHaveURL(
      /\/quotes\/[0-9a-f-]+$/,
    );

    await expect(
      page.getByRole("heading", {
        name: quoteName,
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(customerName, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(productName, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText(featureName, {
        exact: true,
      }),
    ).toBeVisible();

    await expect(
      page.getByText("$3,078.00", {
        exact: true,
      }),
    ).toBeVisible();
  },
);