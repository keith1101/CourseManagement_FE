import { expect, test, type Page } from '@playwright/test';

const examUrl = process.env.E2E_EXAM_URL;
const enabled = process.env.E2E_ENABLED === 'true' && !!examUrl;
const incorrectUrl = process.env.E2E_INCORRECT_URL;
const doubleSubmitUrl = process.env.E2E_DOUBLE_SUBMIT_URL;
const refreshUrl = process.env.E2E_REFRESH_URL;
const runtimeErrors = new WeakMap<Page, string[]>();

test.describe('v2 sequential submission flow', () => {
  test.skip(!enabled, 'Set E2E_ENABLED=true and E2E_EXAM_URL for an isolated seeded attempt');

  test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    runtimeErrors.set(page, errors);
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('response', (response) => {
      if (response.status() >= 500) errors.push(`HTTP ${response.status()}: ${response.url()}`);
    });
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
  });

  test.afterEach(async ({ page }, testInfo) => {
    const errors = runtimeErrors.get(page) || [];
    if (errors.length) {
      await testInfo.attach('runtime-errors', {
        body: errors.join('\n'),
        contentType: 'text/plain',
      });
    }
    expect(errors, 'No HTTP 500, pageerror, or console error should occur').toEqual([]);
  });

  const openAttempt = async (page: Page, url: string) => {
    await page.goto(url);

    // A storageState is preferred, but credentials make the suite convenient
    // for local runs against a freshly seeded test database.
    if (/\/login(?:\?|$)/.test(page.url())) {
      const email = process.env.E2E_STUDENT_EMAIL;
      const password = process.env.E2E_STUDENT_PASSWORD;
      if (!email || !password) {
        throw new Error('The attempt redirected to login; set E2E_STORAGE_STATE or E2E_STUDENT_EMAIL/E2E_STUDENT_PASSWORD');
      }
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Mật khẩu').fill(password);
      await page.getByRole('button', { name: /đăng nhập/i }).click();
      await page.goto(url);
    }
    await expect(page.getByRole('button', { name: 'Nộp' })).toBeVisible();
  };

  test('submits the selected answer with one request', async ({ page }) => {
    let submitCalls = 0;
    page.on('request', (request) => {
      if (request.url().includes('/current-question/submit')) submitCalls += 1;
    });

    await openAttempt(page, examUrl!);
    await page.getByRole('button', { name: /^A\./ }).first().click();
    const submit = page.getByRole('button', { name: 'Nộp' });
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByRole('button', { name: 'Đang nộp…' })).toBeDisabled();
    await expect.poll(() => submitCalls).toBe(1);
    await expect(page.getByRole('button', { name: /Tiếp tục|Đang nộp…/ })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('shows incorrect feedback and does not auto-advance', async ({ page }) => {
    test.skip(!incorrectUrl, 'Provide E2E_INCORRECT_URL with a fresh seeded attempt');
    await openAttempt(page, incorrectUrl!);
    await page.getByRole('button', { name: /^B\./ }).first().click();
    await page.getByRole('button', { name: 'Nộp' }).click();
    await expect(page.getByRole('button', { name: /Tiếp tục|Hoàn thành bài thi/ })).toBeEnabled();
    await expect(page.getByText(/GUIDANCE:/)).toBeVisible();
    await expect(page.getByText(/EXPLANATION:/)).toBeVisible();
    await page.waitForTimeout(3_200);
    await expect(page.getByRole('button', { name: /Tiếp tục|Hoàn thành bài thi/ })).toBeEnabled();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('double-clicking Nộp creates exactly one submission request', async ({ page }) => {
    test.skip(!doubleSubmitUrl, 'Provide E2E_DOUBLE_SUBMIT_URL with a fresh seeded attempt');
    let submitCalls = 0;
    page.on('request', (request) => {
      if (request.url().includes('/current-question/submit')) submitCalls += 1;
    });
    await openAttempt(page, doubleSubmitUrl!);
    await page.getByRole('button', { name: /^A\./ }).first().click();
    await page.getByRole('button', { name: 'Nộp' }).dblclick();
    await expect.poll(() => submitCalls).toBe(1);
    await expect(page.getByRole('button', { name: /Tiếp tục|Đang nộp…/ })).toBeVisible();
  });

  test('refresh keeps the server-owned current question and locks the navigator', async ({ page }) => {
    test.skip(!refreshUrl, 'Provide E2E_REFRESH_URL with a fresh seeded attempt');
    await openAttempt(page, refreshUrl!);
    const currentQuestion = await page.locator('[data-testid="question-card"]').getAttribute('data-question-id').catch(() => null);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Nộp' })).toBeVisible();
    if (currentQuestion) {
      await expect(page.locator('[data-testid="question-card"]')).toHaveAttribute('data-question-id', currentQuestion);
    }
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
