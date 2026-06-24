import { test, expect } from '@playwright/test';

/**
 * fraud-review.spec.ts
 *
 * Tests the ZavaFraudDetector (Java Struts 2) fraud alert review workflow:
 *   Login with session token → view flagged queue → review transaction → take action
 *
 * ZavaFraudDetector uses Struts 2 + AuthTokenInterceptor.
 * SSO validation reads the session token from the .ZAVAAUTH cookie OR the
 * sessionToken query parameter. Seed admin session token (Token 3) is used.
 *
 * Routes through nginx: /fraud/ → zava-fraud-detector:8080
 * Struts 2 actions: flaggedQueue, transactionDetail, alertDecision
 */

const ADMIN_SESSION_TOKEN = 'C3D4E5F6-A7B8-9012-CDEF-123456789012';

test.describe('Fraud Review', () => {
  test('unauthenticated access to /fraud/ shows fraud login page', async ({ page }) => {
    await page.goto('/fraud/');
    await expect(page.locator('text=ZavaFraudDetector')).toBeVisible({ timeout: 30000 });
    // Should prompt for session token (same SSO pattern as PayGateway)
    await expect(page.locator('text=Session Token').or(page.locator('text=session token'))).toBeVisible();
  });

  test('valid session token authenticates and shows flagged queue', async ({ page }) => {
    await page.goto(`/fraud/login?sessionToken=${ADMIN_SESSION_TOKEN}`);
    // AuthTokenInterceptor resolves the token and forwards to flaggedQueue
    await expect(page).toHaveURL(/\/fraud\/flaggedQueue/, { timeout: 30000 });
    await expect(page.locator('text=ZavaFraudDetector - AlertService Flagged Queue')).toBeVisible();
    await expect(page.locator('text=Analyst: admin')).toBeVisible();
  });

  test('flagged queue shows alert table headers', async ({ page }) => {
    await page.goto(`/fraud/login?sessionToken=${ADMIN_SESSION_TOKEN}`);
    await page.waitForURL(/flaggedQueue/, { timeout: 30000 });

    // Table headers must be present
    await expect(page.locator('th:has-text("Alert ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Transaction ID")')).toBeVisible();
    await expect(page.locator('th:has-text("Severity")')).toBeVisible();
    await expect(page.locator('th:has-text("Status")')).toBeVisible();
  });

  test('clicking Review on a flagged alert opens transaction detail', async ({ page }) => {
    await page.goto(`/fraud/login?sessionToken=${ADMIN_SESSION_TOKEN}`);
    await page.waitForURL(/flaggedQueue/, { timeout: 30000 });

    // If there are alerts, click the first Review link
    const reviewLink = page.locator('a:has-text("Review")').first();
    const hasAlerts = await reviewLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAlerts) {
      await reviewLink.click();
      await expect(page).toHaveURL(/transactionDetail/, { timeout: 15000 });
      await expect(page.locator('text=ZavaFraudDetector - Transaction Alert Detail')).toBeVisible();
      await expect(page.locator('text=Alert ID')).toBeVisible();
      await expect(page.locator('text=Approve / Reject')).toBeVisible();
    } else {
      // No alerts in seed data for this run — verify empty queue message
      await expect(page.locator('text=No pending alerts in queue')).toBeVisible({ timeout: 5000 });
    }
  });

  test('submitting an alert decision posts and redirects', async ({ page }) => {
    await page.goto(`/fraud/login?sessionToken=${ADMIN_SESSION_TOKEN}`);
    await page.waitForURL(/flaggedQueue/, { timeout: 30000 });

    const reviewLink = page.locator('a:has-text("Review")').first();
    const hasAlerts = await reviewLink.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasAlerts) {
      test.skip(true, 'No flagged alerts in seed data for this test run');
      return;
    }

    await reviewLink.click();
    await expect(page).toHaveURL(/transactionDetail/, { timeout: 15000 });

    // Fill decision form (Struts 2 select + textarea)
    await page.selectOption('select[name="decision"]', 'Approved');
    await page.fill('textarea[name="notes"]', 'Playwright automated review: approved for testing');
    await page.click('input[type="submit"][value="Submit Decision"]');

    // Should redirect back to flagged queue or show updated status
    await expect(
      page.locator('text=Flagged Queue').or(page.locator('text=flaggedQueue'))
    ).toBeVisible({ timeout: 30000 });
  });
});
