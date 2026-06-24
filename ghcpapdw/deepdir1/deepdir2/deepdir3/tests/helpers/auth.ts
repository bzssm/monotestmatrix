import { Page, expect } from '@playwright/test';

/**
 * Shared authentication helpers for Zava Bank Playwright tests.
 *
 * All credentials below are verified against infrastructure/sql/44-seed-auth.sql.
 * Login.aspx.cs authenticates via SHA1(salt + password) — these are the plaintext
 * passwords that produce the hashes stored in the Users table.
 */

export const ADMIN_USER = {
  username: 'admin',
  password: 'Password1!',
};

export const TELLER_USER = {
  username: 'teller.jones',
  password: 'Teller2024',
};

export const LOAN_OFFICER_USER = {
  username: 'loan.officer.kim',
  password: 'Loans2024',
};

export const FRAUD_ANALYST_USER = {
  username: 'fraud.analyst.chen',
  password: 'Fraud2024',
};

export const CUSTOMER_USER = {
  username: 'maria.rodriguez',
  password: 'Customer1',
};

/**
 * Log in at ZavaAuthGateway (/auth/Login.aspx) and wait for the redirect
 * to /auth/Default.aspx confirming successful authentication.
 *
 * The .ZAVAAUTH FormsAuthentication cookie (shared machineKey) is then
 * accepted by all .NET apps on the same nginx/domain.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/auth/Login.aspx');
  await expect(page).toHaveTitle(/Zava Bank - Login/);

  await page.fill('#txtUsername', ADMIN_USER.username);
  await page.fill('#txtPassword', ADMIN_USER.password);
  await page.click('#btnLogin');

  // Successful login redirects to Default.aspx (authenticated landing page)
  await page.waitForURL(/\/auth\/Default\.aspx/, { timeout: 30000 });
}

/**
 * Log in with any credentials at ZavaAuthGateway (/auth/Login.aspx).
 */
export async function loginAs(page: Page, username: string, password: string): Promise<void> {
  await page.goto('/auth/Login.aspx');
  await page.fill('#txtUsername', username);
  await page.fill('#txtPassword', password);
  await page.click('#btnLogin');
  await page.waitForURL(/\/auth\/Default\.aspx/, { timeout: 30000 });
}

/**
 * Log out via ZavaAuthGateway (/auth/Logout.aspx).
 * Clears the .ZAVAAUTH cookie and redirects back to Login.aspx.
 */
export async function logout(page: Page): Promise<void> {
  await page.goto('/auth/Logout.aspx');
  await page.waitForURL(/Login\.aspx/, { timeout: 30000 });
}

/**
 * Assert the ZavaAuthGateway /auth/Default.aspx shows authenticated state.
 */
export async function expectAuthGatewayAuthenticated(page: Page): Promise<void> {
  await page.goto('/auth/Default.aspx');
  await expect(page.locator('text=Authenticated user:')).toBeVisible({ timeout: 30000 });
}
