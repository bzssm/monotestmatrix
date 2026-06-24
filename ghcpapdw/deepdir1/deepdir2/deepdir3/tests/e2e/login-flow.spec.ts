import { test, expect } from '@playwright/test';
import { loginAsAdmin, logout, ADMIN_USER } from '../helpers/auth';

/**
 * login-flow.spec.ts
 *
 * Verifies the end-to-end login redirect chain:
 *   1. Any protected .NET app redirects unauthenticated users to /auth/Login.aspx
 *   2. Entering valid credentials at the login form issues the .ZAVAAUTH cookie
 *   3. The browser is redirected back to the protected resource
 *   4. Logout clears the session and returns to the login page
 */

test.describe('Login Flow', () => {
  test('navigating to a protected app redirects to ZavaAuthGateway login', async ({ page }) => {
    // .NET apps redirect unauthenticated users to ~/Login.aspx,
    // which then links to ZavaAuthGateway
    await page.goto('/loans/');
    // LoanPortal Login.aspx should be visible
    await expect(page).toHaveURL(/\/loans\/Login\.aspx/, { timeout: 30000 });
    await expect(page.locator('text=ZavaAuthGateway')).toBeVisible();
  });

  test('successful login at /auth/ issues auth cookie and shows authenticated page', async ({ page }) => {
    await page.goto('/auth/Login.aspx');
    await expect(page).toHaveTitle(/Zava Bank - Login/);
    await expect(page.locator('h1')).toContainText('Zava Bank - Employee Login');

    await page.fill('#txtUsername', ADMIN_USER.username);
    await page.fill('#txtPassword', ADMIN_USER.password);
    await page.click('#btnLogin');

    await page.waitForURL(/\/auth\/Default\.aspx/, { timeout: 30000 });
    await expect(page.locator('text=Authenticated user: admin')).toBeVisible();
    await expect(page.locator('a[href="Logout.aspx"]')).toBeVisible();
  });

  test('invalid credentials show an error message', async ({ page }) => {
    await page.goto('/auth/Login.aspx');
    await page.fill('#txtUsername', 'admin');
    await page.fill('#txtPassword', 'WrongPassword!');
    await page.click('#btnLogin');

    // Stay on Login.aspx with an error label
    await expect(page).toHaveURL(/\/auth\/Login\.aspx/, { timeout: 15000 });
    await expect(page.locator('#lblError')).toContainText('Invalid username or password');
  });

  test('empty credentials show a validation error', async ({ page }) => {
    await page.goto('/auth/Login.aspx');
    await page.click('#btnLogin');

    await expect(page).toHaveURL(/\/auth\/Login\.aspx/, { timeout: 15000 });
    await expect(page.locator('#lblError')).toContainText('required');
  });

  test('logout clears session and redirects to login', async ({ page }) => {
    await loginAsAdmin(page);

    await logout(page);

    // Should be back on Login.aspx with loggedOut flag
    await expect(page).toHaveURL(/Login\.aspx/, { timeout: 15000 });

    // Protected page should now redirect again (cookie was cleared)
    await page.goto('/auth/Default.aspx');
    await expect(page).toHaveURL(/Login\.aspx/, { timeout: 15000 });
  });

  test('after login, navigating directly to protected .NET app works without re-login', async ({ page }) => {
    await loginAsAdmin(page);

    // Shared .ZAVAAUTH cookie (same machineKey) lets .NET apps accept the session
    await page.goto('/loans/Default.aspx');
    await expect(page).toHaveURL(/\/loans\/Default\.aspx/, { timeout: 30000 });
    // Authenticated - should NOT redirect back to Login.aspx
    await expect(page).not.toHaveURL(/Login\.aspx/);
  });
});
