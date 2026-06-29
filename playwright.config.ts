import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: false,

  workers: 1,

  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ["list"],
    ["html", { open: "never" }],
  ],

  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});