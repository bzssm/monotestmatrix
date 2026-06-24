import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

/**
 * account-management.spec.ts
 *
 * Tests the ZavaAccountManager (.NET WebForms) account management console:
 *   Login → /accounts/ → customer list loads → select customer → view balance
 *
 * ASP.NET WebForms ID convention with MasterPage (MainContentPlaceHolder):
 *   ctl00_MainContentPlaceHolder_<controlId>
 */

test.describe('Account Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/accounts/Default.aspx');
    await expect(page).toHaveURL(/\/accounts\/Default\.aspx/, { timeout: 30000 });
  });

  test('authenticated user sees account management console with customer list', async ({ page }) => {
    // Should show the Customer List section header
    await expect(page.locator('td:has-text("Customer List")')).toBeVisible({ timeout: 15000 });

    // gvCustomers grid should have rendered — look for table data rows
    // The grid renders with seed customers (at least one row expected)
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_gvCustomers')
    ).toBeVisible({ timeout: 15000 });
  });

  test('selecting a customer loads their account details', async ({ page }) => {
    // Wait for the customer grid to populate
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_gvCustomers')
    ).toBeVisible({ timeout: 15000 });

    // Click the Select link/button for the first customer row
    const selectBtn = page.locator('#ctl00_MainContentPlaceHolder_gvCustomers tr').nth(1).locator('a, input[type="submit"]').first();
    await selectBtn.click();

    // Account Detail section should now show the selected customer ID
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_lblSelectedCustomer')
    ).toContainText('Customer ID', { timeout: 15000 });

    // gvAccounts should now have data
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_gvAccounts')
    ).toBeVisible({ timeout: 15000 });
  });

  test('balance button shows balance result for selected account', async ({ page }) => {
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_gvCustomers')
    ).toBeVisible({ timeout: 15000 });

    // Select first customer
    const selectBtn = page.locator('#ctl00_MainContentPlaceHolder_gvCustomers tr').nth(1).locator('a, input[type="submit"]').first();
    await selectBtn.click();

    // Wait for account grid to load
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_gvAccounts')
    ).toBeVisible({ timeout: 15000 });

    // Click Balance for first account
    const balanceBtn = page.locator('#ctl00_MainContentPlaceHolder_gvAccounts tr').nth(1).locator('input[value="Balance"], a:has-text("Balance")').first();
    await balanceBtn.click();

    // lblBalanceResult should show something (balance or "unavailable")
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_lblBalanceResult')
    ).not.toBeEmpty({ timeout: 15000 });
  });

  test('open new account form is present and accepts input', async ({ page }) => {
    const customerIdInput = page.locator('#ctl00_MainContentPlaceHolder_fvOpenAccount_txtNewCustomerId');
    await expect(customerIdInput).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Open New Account')).toBeVisible();
  });

  test('unauthenticated access to /accounts/ redirects to login', async ({ page: freshPage }) => {
    await freshPage.goto('/accounts/Default.aspx');
    await expect(freshPage).toHaveURL(/Login\.aspx/, { timeout: 30000 });
  });
});
