import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

/**
 * payment-processing.spec.ts
 *
 * Tests the ZavaPayGateway (Java Struts) payment flow.
 *
 * SSO note: ZavaPayGateway is a Java/Struts app that validates sessions by
 * looking up the raw session token GUID in the SessionTokens table.
 * After logging into ZavaAuthGateway, the browser holds the .ZAVAAUTH
 * FormsAuth cookie. The Java SSO reads this cookie value, but it contains an
 * encrypted FormsAuth ticket — not the raw GUID. As a result, Java apps do NOT
 * auto-authenticate from the FormsAuth cookie alone; they redirect to their own
 * login page requiring a session token.
 *
 * These tests access the PayGateway login page and supply a known-valid seed
 * session token for admin (Token ID 3, valid 2026-05-14):
 *   C3D4E5F6-A7B8-9012-CDEF-123456789012
 */

const ADMIN_SESSION_TOKEN = 'C3D4E5F6-A7B8-9012-CDEF-123456789012';

test.describe('Payment Processing', () => {
  test('unauthenticated access to /payments/ shows Java login form', async ({ page }) => {
    await page.goto('/payments/');
    // PayGateway redirects to login when no valid session is found
    await expect(page.locator('text=ZavaPayGateway')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Session Token')).toBeVisible();
  });

  test('entering valid session token authenticates and shows payment form', async ({ page }) => {
    await page.goto('/payments/login.do');
    await expect(page.locator('text=Session Token')).toBeVisible({ timeout: 30000 });

    // The session token input (Struts html:text property="sessionToken")
    await page.fill('input[name="sessionToken"]', ADMIN_SESSION_TOKEN);
    await page.click('input[type="submit"][value="Sign In"]');

    // Successful auth forwards to makePayment.do
    await expect(page).toHaveURL(/\/payments\/makePayment\.do/, { timeout: 30000 });
    await expect(page.locator('text=ZavaPayGateway - Make Payment')).toBeVisible();
    await expect(page.locator('text=User: admin')).toBeVisible();
  });

  test('make a payment and verify confirmation message', async ({ page }) => {
    // Authenticate via session token
    await page.goto('/payments/login.do');
    await page.fill('input[name="sessionToken"]', ADMIN_SESSION_TOKEN);
    await page.click('input[type="submit"][value="Sign In"]');
    await expect(page).toHaveURL(/makePayment\.do/, { timeout: 30000 });

    // Select first available account, enter amount and payment type
    await page.selectOption('select[name="accountId"]', { index: 0 });
    await page.fill('input[name="amount"]', '100.00');
    await page.selectOption('select[name="paymentType"]', 'ACH');
    await page.fill('input[name="memo"]', 'Playwright test payment');
    await page.click('input[type="submit"][value="Post Payment"]');

    // Success: status message in green, or page reloads with payment listed
    await expect(
      page.locator('font[color="#006600"]').or(page.locator('text=posted'))
    ).toBeVisible({ timeout: 30000 });
  });

  test('payment history page shows posted transactions', async ({ page }) => {
    await page.goto(`/payments/login.do?sessionToken=${ADMIN_SESSION_TOKEN}`);
    // The LoginAction accepts sessionToken as a query param too
    await page.waitForURL(/makePayment\.do|paymentHistory\.do/, { timeout: 30000 });

    await page.goto('/payments/paymentHistory.do');
    await expect(page.locator('text=ZavaPayGateway - Payment History')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('th:has-text("Transaction ID")')).toBeVisible();
  });

  test('invalid session token shows error message', async ({ page }) => {
    await page.goto('/payments/login.do');
    await page.fill('input[name="sessionToken"]', 'INVALID-TOKEN-0000-0000-000000000000');
    await page.click('input[type="submit"][value="Sign In"]');

    await expect(page.locator('font[color="#cc0000"]')).toContainText('not found or has expired', {
      timeout: 15000,
    });
  });
});
