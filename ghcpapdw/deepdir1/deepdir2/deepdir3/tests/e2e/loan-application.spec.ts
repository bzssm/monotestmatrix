import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../helpers/auth';

/**
 * loan-application.spec.ts
 *
 * Tests the Zava Loan Portal multi-step wizard workflow:
 *   Login → /loans/ → fill wizard (5 steps) → submit → verify status row appears
 *
 * ASP.NET WebForms ID convention with MasterPage (MainContentPlaceHolder):
 *   Control IDs are prefixed: ctl00_MainContentPlaceHolder_wizLoanApplication_<controlId>
 */

const WIZ = 'ctl00_MainContentPlaceHolder_wizLoanApplication_';

test.describe('Loan Application', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/loans/Default.aspx');
    await expect(page).toHaveURL(/\/loans\/Default\.aspx/, { timeout: 30000 });
  });

  test('authenticated user sees Loan Portal with wizard and history grid', async ({ page }) => {
    // Site.Master navbar shows signed-in username
    await expect(page.locator('text=Signed in: admin')).toBeVisible({ timeout: 15000 });

    // Wizard step 1 (Personal Info) should be visible
    await expect(page.locator(`#${WIZ}txtCustomerId`)).toBeVisible();

    // Loan history grid header row should render
    await expect(page.locator('text=New Loan Application')).toBeVisible();
    await expect(page.locator('text=Loan Application History')).toBeVisible();
  });

  test('complete loan wizard end-to-end and verify submitted status', async ({ page }) => {
    // Step 1: Personal Info
    await page.fill(`#${WIZ}txtCustomerId`, '1');
    await page.fill(`#${WIZ}txtFirstName`, 'Maria');
    await page.fill(`#${WIZ}txtLastName`, 'Rodriguez');
    await page.fill(`#${WIZ}txtEmail`, 'maria.rodriguez@email.com');
    await page.click('input[type="submit"][value="Next"]');

    // Step 2: Employment
    await expect(page.locator(`#${WIZ}txtEmployer`)).toBeVisible({ timeout: 15000 });
    await page.fill(`#${WIZ}txtEmployer`, 'Zava Corporation');
    await page.fill(`#${WIZ}txtJobTitle`, 'Software Engineer');
    await page.fill(`#${WIZ}txtYearsEmployed`, '5');
    await page.fill(`#${WIZ}txtAnnualIncome`, '95000');
    await page.click('input[type="submit"][value="Next"]');

    // Step 3: Loan Details
    await expect(page.locator(`#${WIZ}txtRequestedAmount`)).toBeVisible({ timeout: 15000 });
    await page.fill(`#${WIZ}txtRequestedAmount`, '25000');
    await page.fill(`#${WIZ}txtTermMonths`, '60');
    await page.fill(`#${WIZ}txtPurpose`, 'Home improvement project');
    await page.click('input[type="submit"][value="Next"]');

    // Step 4: Review — summary is shown
    await expect(page.locator(`#${WIZ}lblReviewSummary`)).toContainText('Maria Rodriguez', { timeout: 15000 });
    await expect(page.locator(`#${WIZ}lblReviewSummary`)).toContainText('25000');
    await page.click('input[type="submit"][value="Next"]');

    // Step 5: Submit
    await expect(page.locator(`#${WIZ}lblSubmitStepMessage`)).toBeVisible({ timeout: 15000 });
    await page.click('input[type="submit"][value="Finish"]');

    // Submission status label should confirm success
    await expect(
      page.locator('#ctl00_MainContentPlaceHolder_lblSubmissionStatus')
    ).toContainText('submitted', { timeout: 30000 });

    // Loan history grid should now contain a row with "Submitted" status
    await expect(page.locator('td:has-text("Submitted")')).toBeVisible({ timeout: 15000 });
  });
});
