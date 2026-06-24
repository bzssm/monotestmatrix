import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAs, logout, ADMIN_USER, TELLER_USER } from '../helpers/auth';

/**
 * whoami-endpoint.spec.ts
 *
 * Validates the /auth/WhoAmI.ashx endpoint contract:
 *   - Unauthenticated: returns { authenticated: false }
 *   - Authenticated: returns { authenticated: true, username, displayName, roles[] }
 *   - Malformed/invalid cookie: returns { authenticated: false } (graceful degradation)
 */

test.describe('WhoAmI.ashx Endpoint', () => {
  test('unauthenticated request returns authenticated false', async ({ page }) => {
    const response = await page.goto('/auth/WhoAmI.ashx');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);
    expect(response!.headers()['content-type']).toContain('application/json');

    const body = await response!.json();
    expect(body).toEqual({ authenticated: false });
  });

  test('authenticated admin request returns correct user info and roles', async ({ page }) => {
    await loginAsAdmin(page);

    const response = await page.goto('/auth/WhoAmI.ashx');
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(200);

    const body = await response!.json();
    expect(body.authenticated).toBe(true);
    expect(body.username).toBe('admin');
    expect(body.displayName).toBe('System Administrator');
    expect(Array.isArray(body.roles)).toBe(true);
    expect(body.roles).toContain('Admin');
    expect(body.roles).toContain('Teller');
    expect(body.roles).toContain('LoanOfficer');
    // sessionToken is the raw GUID used for cross-ecosystem SSO with Java apps
    expect(typeof body.sessionToken).toBe('string');
    expect(body.sessionToken.length).toBeGreaterThan(0);
  });

  test('authenticated teller request returns teller roles', async ({ page }) => {
    await loginAs(page, TELLER_USER.username, TELLER_USER.password);

    const response = await page.goto('/auth/WhoAmI.ashx');
    const body = await response!.json();

    expect(body.authenticated).toBe(true);
    expect(body.username).toBe('teller.jones');
    expect(body.displayName).toBe('Marcus Jones');
    expect(body.roles).toContain('Teller');
    expect(body.roles).toContain('Customer');
    expect(body.roles).not.toContain('Admin');
    expect(body.roles).not.toContain('FraudAnalyst');
  });

  test('malformed cookie returns authenticated false', async ({ page }) => {
    // Set a garbage .ZAVAAUTH cookie before requesting WhoAmI
    await page.context().addCookies([{
      name: '.ZAVAAUTH',
      value: 'not-a-valid-forms-auth-ticket',
      domain: 'localhost',
      path: '/',
    }]);

    const response = await page.goto('/auth/WhoAmI.ashx');
    expect(response!.status()).toBe(200);

    const body = await response!.json();
    expect(body).toEqual({ authenticated: false });
  });

  test('empty cookie value returns authenticated false', async ({ page }) => {
    await page.context().addCookies([{
      name: '.ZAVAAUTH',
      value: '',
      domain: 'localhost',
      path: '/',
    }]);

    const response = await page.goto('/auth/WhoAmI.ashx');
    const body = await response!.json();
    expect(body).toEqual({ authenticated: false });
  });

  test('after logout WhoAmI returns authenticated false', async ({ page }) => {
    await loginAsAdmin(page);

    // Confirm authenticated
    let response = await page.goto('/auth/WhoAmI.ashx');
    let body = await response!.json();
    expect(body.authenticated).toBe(true);

    // Logout and re-check
    await logout(page);
    response = await page.goto('/auth/WhoAmI.ashx');
    body = await response!.json();
    expect(body.authenticated).toBe(false);
  });
});
