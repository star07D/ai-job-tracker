import { test, expect } from "@playwright/test";

/**
 * One pass through the product: sign up, add an application with an overdue
 * follow-up, see it surface, then move it through the pipeline and confirm the
 * change sticks — across the API and the database.
 */
test("sign up, track an application, and move it through the pipeline", async ({
  page,
}) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = "e2e-password-123";
  const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000)
    .toISOString()
    .slice(0, 10);

  // --- sign up ---
  await page.goto("/signup");
  await page.getByLabel("First name").fill("Ada");
  await page.getByLabel("Last name").fill("Lovelace");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Confirm email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Applications", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("No applications yet")).toBeVisible();

  // --- add an application with an overdue next step ---
  await page.getByRole("button", { name: "Add application" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Add application" });
  await dialog.getByLabel("Role").fill("Staff Engineer");
  await dialog.getByLabel("Company").fill("Kensho");
  await dialog.getByLabel("Next step").fill("Send the take-home");
  await dialog.getByLabel("Due", { exact: true }).fill(twoDaysAgo);
  await dialog.getByRole("button", { name: "Add application" }).click();
  await expect(dialog).toBeHidden();

  // it lands in the list, and the overdue step surfaces in "Needs attention"
  const row = page.getByRole("link", { name: /^Staff Engineer/ });
  await expect(row).toBeVisible();
  await expect(page.getByText("Needs attention")).toBeVisible();
  await expect(page.getByText(/overdue/).first()).toBeVisible();

  // --- open the detail page ---
  await row.click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Staff Engineer" }),
  ).toBeVisible();
  await expect(page.getByText("Send the take-home")).toBeVisible();

  // --- move Applied -> Interview, and confirm it persisted ---
  await page.getByLabel("Change status").selectOption("Interview");
  await page.reload();
  await expect(page.getByLabel("Change status")).toHaveValue("Interview");

  // --- the kanban board reflects the new status ---
  await page.getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("button", { name: "board view" }).click();
  await expect(
    page
      .getByTestId("kanban-column-Interview")
      .getByRole("button", { name: /^Staff Engineer/ }),
  ).toBeVisible();
});
