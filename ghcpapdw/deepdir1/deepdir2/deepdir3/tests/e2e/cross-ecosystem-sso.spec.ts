import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

/**
 * cross-ecosystem-sso.spec.ts
 *
 * Covers GitHub Issue #30 — Cross-ecosystem SSO end-to-end flow.
 *
 * Architecture summary:
 *   - ZavaAuthGateway (.NET) issues a .ZAVAAUTH FormsAuthentication cookie.
 *     The cookie value is an AES-encrypted FormsAuth ticket containing the
 *     raw session token GUID in its UserData field.
 *   - All .NET apps share an identical machineKey, so they decrypt the cookie
 *     natively — SSO is transparent for .NET-to-.NET navigation.
 *   - Java apps (ZavaPayGateway, ZavaFraudDetector, ZavaComplianceReporter)
 *     cannot decrypt the .ZAVAAUTH cookie. They validate a raw session token
 *     GUID against the SessionTokens DB table.
 *   - The portal (index.html) calls WhoAmI.ashx to obtain the raw sessionToken
 *     and appends ?sessionToken= to Java app links, bridging the SSO gap.
 *
 * This test suite validates:
 *   1. .NET-to-.NET SSO works (shared machineKey cookie)
 *   2. Java apps correctly redirect when NO session token is available
 *   3. Full cross-ecosystem flow when session token is provided via query param
 */

const ADMIN_SESSION_TOKEN = 'C3D4E5F6-A7B8-9012-CDEF-123456789012';

test.describe('Cross-Ecosystem SSO Flow', () => {
  test('.NET apps share the FormsAuth session — login once, access all .NET apps', async ({ page }) => {
    // Login at ZavaAuthGateway — .ZAVAAUTH cookie is issued
    await loginAsAdmin(page);

    // ZavaAuthGateway itself confirms authenticated
    await expect(page.locator('text=Authenticated user: admin')).toBeVisible();

    // Navigate to ZavaLoanPortal (.NET) — same machineKey, same cookie
    await page.goto('/loans/Default.aspx');
    await expect(page).toHaveURL(/\/loans\/Default\.aspx/, { timeout: 30000 });
    await expect(page).not.toHaveURL(/Login\.aspx/);
    await expect(page.locator('text=Signed in: admin')).toBeVisible({ timeout: 15000 });

    // Navigate to ZavaAccountManager (.NET) — same SSO cookie accepted
    await page.goto('/accounts/Default.aspx');
    await expect(page).toHaveURL(/\/accounts\/Default\.aspx/, { timeout: 30000 });
    await expect(page).not.toHaveURL(/Login\.aspx/);
    await expect(page.locator('text=Signed in: admin')).toBeVisible({ timeout: 15000 });

    // Navigate to ZavaReportDashboard (.NET) — same SSO cookie accepted
    await page.goto('/reports/Default.aspx');
    await expect(page).toHaveURL(/\/reports\/Default\.aspx/, { timeout: 30000 });
    await expect(page).not.toHaveURL(/Login\.aspx/);
  });

  test('Java app (PayGateway) does NOT auto-SSO from FormsAuth cookie alone', async ({ page }) => {
    // Login at ZavaAuthGateway — .ZAVAAUTH cookie is issued
    await loginAsAdmin(page);

    // Navigate to Java PayGateway with the .ZAVAAUTH cookie in scope
    await page.goto('/payments/makePayment.do');

    // The Java SsoSessionService reads .ZAVAAUTH but the encrypted ticket value
    // does not match any raw GUID in the SessionTokens table.
    // Expected: redirect to Java login page (not auto-authenticated)
    await expect(page).toHaveURL(/\/payments\/login\.do/, { timeout: 30000 });
    await expect(page.locator('text=Session Token')).toBeVisible();
  });

  test('full cross-ecosystem flow — .NET then Java (with manual session token)', async ({ page }) => {
    // Step 1: Login at ZavaAuthGateway
    await loginAsAdmin(page);
    await expect(page.locator('text=Authenticated user: admin')).toBeVisible();

    // Step 2: Access .NET LoanPortal — transparent SSO via shared FormsAuth cookie
    await page.goto('/loans/Default.aspx');
    await expect(page).toHaveURL(/\/loans\/Default\.aspx/, { timeout: 30000 });
    await expect(page.locator('text=Signed in: admin')).toBeVisible({ timeout: 15000 });

    // Step 3: Access Java PayGateway — provide raw session token via query param
    // (Bridge: Java apps accept sessionToken query param as an alternative to cookie)
    await page.goto(`/payments/makePayment.do?sessionToken=${ADMIN_SESSION_TOKEN}`);
    // LoginAction checks the param, resolves the user, forwards to makePayment
    await expect(page).toHaveURL(/makePayment\.do/, { timeout: 30000 });
    await expect(page.locator('text=ZavaPayGateway - Make Payment')).toBeVisible();
    await expect(page.locator('text=User: admin')).toBeVisible();

    // Step 4: Navigate to Java FraudDetector — provide token via query param
    await page.goto(`/fraud/flaggedQueue?sessionToken=${ADMIN_SESSION_TOKEN}`);
    await expect(page).toHaveURL(/flaggedQueue/, { timeout: 30000 });
    await expect(page.locator('text=Analyst: admin')).toBeVisible();

    // Both .NET and Java apps confirm admin is the authenticated user
  });

  test('logout clears .NET session — .NET apps redirect to login after logout', async ({ page }) => {
    await loginAsAdmin(page);

    // Confirm .NET app is accessible
    await page.goto('/loans/Default.aspx');
    await expect(page).toHaveURL(/\/loans\/Default\.aspx/, { timeout: 30000 });

    // Logout via ZavaAuthGateway
    await page.goto('/auth/Logout.aspx');
    await page.waitForURL(/Login\.aspx/, { timeout: 30000 });

    // .NET LoanPortal should now redirect unauthenticated user to its Login.aspx
    await page.goto('/loans/Default.aspx');
    await expect(page).toHaveURL(/Login\.aspx/, { timeout: 30000 });

    // ZavaAuthGateway itself should redirect to login
    await page.goto('/auth/Default.aspx');
    await expect(page).toHaveURL(/Login\.aspx/, { timeout: 15000 });
  });

  test('/auth/api/auth/validate endpoint validates a raw session token', async ({ page }) => {
    // The validate API is the intended bridge for Java apps to verify sessions.
    // Java apps should call this endpoint with the raw token to confirm validity.
    const response = await page.request.get(
      `/auth/api/auth/validate?token=${ADMIN_SESSION_TOKEN}`
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.valid).toBe(true);
    expect(body.username).toBe('admin');
  });
});
