import { test, expect } from '@playwright/test';
import {
  loginAsAdmin,
  loginAs,
  logout,
  TELLER_USER,
  FRAUD_ANALYST_USER,
  CUSTOMER_USER,
} from '../helpers/auth';

/**
 * portal-role-visibility.spec.ts
 *
 * Validates the ZavaBank portal (index.html) role-based link visibility:
 *   - Portal calls /auth/WhoAmI.ashx on page load
 *   - Unauthenticated users see a login prompt, not service links
 *   - Authenticated users see "Welcome, {displayName} | Logout"
 *   - Service link rows show/hide based on data-roles vs the user's role set
 *
 * Portal rows and their required roles (from index.html):
 *   row-loans:       Customer, Teller, LoanOfficer, Admin
 *   row-accounts:    Customer, Teller, LoanOfficer, Admin
 *   row-payments:    Customer, Teller, Admin
 *   row-reports:     Teller, LoanOfficer, Admin
 *   row-fraud:       FraudAnalyst, Admin
 *   row-compliance:  FraudAnalyst, Admin
 */

const ALL_ROWS = ['row-loans', 'row-accounts', 'row-payments', 'row-reports', 'row-fraud', 'row-compliance'];

/** Assert that exactly the named rows are visible in the portal table. */
async function expectVisibleRows(page: import('@playwright/test').Page, visibleIds: string[]) {
  for (const id of ALL_ROWS) {
    const row = page.locator(`#${id}`);
    if (visibleIds.includes(id)) {
      await expect(row).toBeVisible({ timeout: 10000 });
    } else {
      await expect(row).toBeHidden();
    }
  }
}

test.describe('Portal Role-Based Link Visibility', () => {

  test('unauthenticated user sees login message, not service links', async ({ page }) => {
    await page.goto('/');

    // Login prompt should appear
    const loginMsg = page.locator('#loginMessage');
    await expect(loginMsg).toBeVisible({ timeout: 15000 });
    await expect(loginMsg).toContainText('Please');
    await expect(loginMsg).toContainText('log in');

    // Portal table should remain hidden
    await expect(page.locator('#portalTable')).toBeHidden();
  });

  test('authenticated admin sees all service links', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');

    // Welcome banner with display name and logout link
    const subnav = page.locator('#subnav');
    await expect(subnav).toContainText('Welcome,', { timeout: 15000 });
    await expect(subnav).toContainText('System Administrator');
    await expect(subnav.locator('a[href="/auth/Logout.aspx"]')).toBeVisible();

    // Portal table visible
    await expect(page.locator('#portalTable')).toBeVisible();

    // Admin has Admin + Teller + LoanOfficer → all rows visible
    await expectVisibleRows(page, ALL_ROWS);
  });

  test('teller sees loans, accounts, payments, reports but not fraud/compliance', async ({ page }) => {
    // teller.jones has roles: Teller, Customer
    await loginAs(page, TELLER_USER.username, TELLER_USER.password);
    await page.goto('/');

    await expect(page.locator('#subnav')).toContainText('Marcus Jones', { timeout: 15000 });
    await expect(page.locator('#portalTable')).toBeVisible();

    // Teller+Customer sees loans, accounts, payments, reports
    await expectVisibleRows(page, ['row-loans', 'row-accounts', 'row-payments', 'row-reports']);
  });

  test('fraud analyst sees loans, accounts, fraud, compliance but not payments/reports', async ({ page }) => {
    // fraud.analyst.chen has roles: FraudAnalyst, Customer
    await loginAs(page, FRAUD_ANALYST_USER.username, FRAUD_ANALYST_USER.password);
    await page.goto('/');

    await expect(page.locator('#subnav')).toContainText('Wei Chen', { timeout: 15000 });
    await expect(page.locator('#portalTable')).toBeVisible();

    // FraudAnalyst+Customer sees loans, accounts (Customer), fraud, compliance (FraudAnalyst)
    await expectVisibleRows(page, ['row-loans', 'row-accounts', 'row-fraud', 'row-compliance']);
  });

  test('customer sees only loans and accounts', async ({ page }) => {
    // maria.rodriguez has role: Customer only
    await loginAs(page, CUSTOMER_USER.username, CUSTOMER_USER.password);
    await page.goto('/');

    await expect(page.locator('#subnav')).toContainText('Maria Rodriguez', { timeout: 15000 });
    await expect(page.locator('#portalTable')).toBeVisible();

    // Customer sees loans + accounts only
    await expectVisibleRows(page, ['row-loans', 'row-accounts']);
  });

  test('login message is hidden for authenticated users', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');

    // Loading message should be hidden after WhoAmI completes
    await expect(page.locator('#loadingMessage')).toBeHidden({ timeout: 15000 });
    // Login prompt should NOT appear for authenticated user
    await expect(page.locator('#loginMessage')).toBeHidden();
  });

  test('after logout, portal reverts to login prompt', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/');
    await expect(page.locator('#portalTable')).toBeVisible({ timeout: 15000 });

    await logout(page);
    await page.goto('/');

    await expect(page.locator('#loginMessage')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#portalTable')).toBeHidden();
  });
});
