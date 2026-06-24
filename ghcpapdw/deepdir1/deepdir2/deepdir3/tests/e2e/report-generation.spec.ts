import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

/**
 * report-generation.spec.ts
 *
 * Tests the ZavaReportDashboard (.NET WebForms):
 *   Login → /reports/ → verify date filters → run reports → check data displayed
 *
 * Reports rendered: Loan Portfolio Summary, Delinquency Report, Daily Transaction Volume
 */

test.describe('Report Generation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports/Default.aspx');
    await expect(page).toHaveURL(/\/reports\/Default\.aspx/, { timeout: 30000 });
  });

  test('authenticated user sees report dashboard with date filters and grids', async ({ page }) => {
    await expect(page.locator('text=Reporting Dashboard')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=Report Filter')).toBeVisible();
    await expect(page.locator('text=Loan Portfolio Summary')).toBeVisible();
    await expect(page.locator('text=Delinquency Report')).toBeVisible();
    await expect(page.locator('text=Daily Transaction Volume')).toBeVisible();
  });

  test('date filter fields are pre-populated on load', async ({ page }) => {
    const startDate = page.locator('#ctl00_MainContentPlaceHolder_txtStartDate');
    const endDate = page.locator('#ctl00_MainContentPlaceHolder_txtEndDate');

    // Page_Load auto-fills dates: today-7 and today
    await expect(startDate).not.toHaveValue('', { timeout: 15000 });
    await expect(endDate).not.toHaveValue('', { timeout: 15000 });
  });

  test('reports load data on page load (auto-run)', async ({ page }) => {
    // Default.aspx.cs calls RunReports() on !IsPostBack
    // Loan Portfolio Summary is rendered as a literal HTML table
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_litLoanPortfolioSummary table')
    ).toBeVisible({ timeout: 15000 });

    // The status label should show "Reports refreshed." after auto-run
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_lblStatus')
    ).toContainText('refreshed', { timeout: 15000 });
  });

  test('changing date range and clicking Run Reports refreshes data', async ({ page }) => {
    const startDate = page.locator('#ctl00_MainContentPlaceHolder_txtStartDate');
    const endDate = page.locator('#ctl00_MainContentPlaceHolder_txtEndDate');
    const runBtn = page.locator('#ctl00_MainContentPlaceHolder_btnRunReports');

    // Set a broader date range
    await startDate.fill('2024-01-01');
    await endDate.fill('2026-12-31');
    await runBtn.click();

    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_lblStatus')
    ).toContainText('refreshed', { timeout: 30000 });

    // Loan Portfolio Summary table should still be visible
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_litLoanPortfolioSummary')
    ).not.toBeEmpty({ timeout: 15000 });
  });

  test('invalid date range shows validation error', async ({ page }) => {
    const startDate = page.locator('#ctl00_MainContentPlaceHolder_txtStartDate');
    const endDate = page.locator('#ctl00_MainContentPlaceHolder_txtEndDate');

    // End before start — should trigger validation message
    await startDate.fill('2026-12-31');
    await endDate.fill('2024-01-01');
    await page.locator('#ctl00_MainContentPlaceHolder_btnRunReports').click();

    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_lblStatus')
    ).toContainText('valid date range', { timeout: 15000 });
  });

  test('delinquency report grid has expected column headers', async ({ page }) => {
    // GridView auto-generates columns from the DataTable
    await expect(page.locator('text=DueDate').or(page.locator('text=PaymentAmount'))).toBeVisible({
      timeout: 15000,
    });
  });
});
