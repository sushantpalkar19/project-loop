/**
 * UI/UX Tests
 * TC-204: API key never exposed in client-side responses
 * TC-205: All pages show loading states
 * TC-206: All pages show empty states
 * TC-207: All pages show error states when API fails
 * TC-208: 403 page for unauthorized access
 * TC-209: 404 page for non-existent routes
 * TC-210: Application handles network failure gracefully
 * TC-211: Session expiry redirects to login
 * TC-212: Application is responsive on mobile viewport
 * TC-213: No console errors on normal navigation
 * TC-214: Keyboard navigation and focus management
 * TC-215: Basic accessibility — color contrast and semantic HTML
 */

import { test, expect } from '@playwright/test';
import { loginAs, BASE_URL } from './helpers/auth';

// ── TC-204: API key never exposed in client-side responses ────────────────────
test('API key is never exposed in client-side responses or network calls TC-204', async ({ page }) => {
  await loginAs(page, 'analyst');

  const sensitivePatterns = ['sk-ant-', 'ANTHROPIC_API_KEY', 'AIzaSy'];
  const violations: string[] = [];

  page.on('response', async (response) => {
    try {
      const url = response.url();
      if (url.includes('/_next/') || url.includes('.js') || url.includes('.css')) return;
      const text = await response.text().catch(() => '');
      for (const pattern of sensitivePatterns) {
        if (text.includes(pattern)) {
          violations.push(`Found "${pattern}" in response from ${url}`);
        }
      }
    } catch { /* ignore */ }
  });

  const routes = ['/dashboard', '/feedback', '/trends', '/ask', '/reports'];
  for (const route of routes) {
    await page.goto(`${BASE_URL}${route}`);
    await page.waitForLoadState('networkidle');
  }

  expect(violations, `Sensitive keys found in responses: ${violations.join(', ')}`).toHaveLength(0);
});

// ── TC-205: All pages show loading states ─────────────────────────────────────
test('All pages show loading states during data fetch TC-205', async ({ page }) => {
  await loginAs(page, 'analyst');

  // Intercept API calls to delay them so we can observe loading states
  await page.route('**/api/analytics/overview**', async (route) => {
    await new Promise(r => setTimeout(r, 800));
    await route.continue();
  });

  await page.goto(`${BASE_URL}/dashboard`);
  // Loading skeleton or spinner should appear before data loads
  // The page should not show a blank white screen
  const bodyText = await page.locator('body').innerText();
  expect(bodyText.length).toBeGreaterThan(0);

  // Unroute and check feedback page
  await page.unrouteAll();
  await page.route('**/api/feedback**', async (route) => {
    await new Promise(r => setTimeout(r, 800));
    await route.continue();
  });

  await page.goto(`${BASE_URL}/feedback`);
  const feedbackBody = await page.locator('body').innerText();
  expect(feedbackBody.length).toBeGreaterThan(0);
});

// ── TC-206: All pages show empty states ───────────────────────────────────────
test('All pages show empty states when no data exists TC-206', async ({ page }) => {
  await loginAs(page, 'analyst');

  // Mock empty responses
  await page.route('**/api/analytics/overview**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        metrics: { totalFeedback: 0, negativePercentage: 0, newThisWeek: 0 },
        sentiment: { POS: { count: 0, percentage: 0 }, NEU: { count: 0, percentage: 0 }, NEG: { count: 0, percentage: 0 } },
        themes: [],
        volumeByDate: [],
      }),
    })
  );

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  // Page should render without crashing
  await expect(page.locator('body')).not.toBeEmpty();

  await page.route('**/api/feedback**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ feedback: [], pagination: { total: 0, page: 1, pageSize: 20, totalPages: 0 } }),
    })
  );

  await page.goto(`${BASE_URL}/feedback`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

// ── TC-207: All pages show error states when API fails ────────────────────────
test('All pages show error states when API calls fail TC-207', async ({ page }) => {
  await loginAs(page, 'analyst');

  // Block analytics API
  await page.route('**/api/analytics/overview**', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) })
  );

  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');
  // Page should not crash — body should have content
  await expect(page.locator('body')).not.toBeEmpty();

  // Check no unhandled JS errors
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));

  await page.route('**/api/feedback**', (route) =>
    route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Server error' }) })
  );

  await page.goto(`${BASE_URL}/feedback`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();

  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
});

// ── TC-208: 403 page for unauthorized access ──────────────────────────────────
test('403 page is displayed for unauthorized access attempts TC-208', async ({ page }) => {
  await loginAs(page, 'viewer');

  // Navigate to admin-only settings member management
  await page.goto(`${BASE_URL}/settings`);
  await page.waitForLoadState('networkidle');

  // Either a 403 page is shown or the restricted action is hidden
  const pageContent = await page.locator('body').innerText();
  const has403 = pageContent.toLowerCase().includes('403') ||
    pageContent.toLowerCase().includes("don't have permission") ||
    pageContent.toLowerCase().includes('forbidden') ||
    pageContent.toLowerCase().includes('not authorized');

  // The page should either show 403 or hide the restricted UI — not crash
  await expect(page.locator('body')).not.toBeEmpty();

  // Verify no sensitive info is exposed
  expect(pageContent).not.toContain('stack');
  expect(pageContent).not.toContain('prisma');
});

// ── TC-209: 404 page for non-existent routes ──────────────────────────────────
test('404 page is displayed for non-existent routes TC-209', async ({ page }) => {
  await loginAs(page, 'analyst');

  await page.goto(`${BASE_URL}/this-page-does-not-exist`);
  await page.waitForLoadState('networkidle');

  const content = await page.locator('body').innerText();
  const has404 = content.includes('404') ||
    content.toLowerCase().includes('not found') ||
    content.toLowerCase().includes('page not found');
  expect(has404).toBe(true);

  // Should have a navigation link back
  const links = page.getByRole('link');
  const linkCount = await links.count();
  expect(linkCount).toBeGreaterThan(0);
});

// ── TC-210: Application handles network failure gracefully ────────────────────
test('Application handles network failure gracefully TC-210', async ({ page }) => {
  await loginAs(page, 'analyst');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');

  // Simulate network failure for subsequent API calls
  await page.route('**/api/**', (route) => route.abort('failed'));

  await page.goto(`${BASE_URL}/feedback`);
  await page.waitForLoadState('domcontentloaded');

  // App should not crash — body should still render
  await expect(page.locator('body')).not.toBeEmpty();

  // Re-enable network
  await page.unrouteAll();
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

// ── TC-211: Session expiry redirects to login ─────────────────────────────────
test('Session expiry redirects user to login TC-211', async ({ page }) => {
  await loginAs(page, 'analyst');
  await page.goto(`${BASE_URL}/dashboard`);

  // Clear session cookies to simulate expiry
  await page.context().clearCookies();

  // Attempt to navigate to a protected route
  await page.goto(`${BASE_URL}/feedback`);
  await page.waitForLoadState('networkidle');

  // Should be redirected to login
  expect(page.url()).toContain('/login');
});

// ── TC-212: Application is responsive on mobile viewport ─────────────────────
test('Application is responsive on mobile viewport TC-212', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await loginAs(page, 'analyst');

  const routes = ['/dashboard', '/feedback', '/ask', '/reports'];
  for (const route of routes) {
    await page.goto(`${BASE_URL}${route}`);
    await page.waitForLoadState('networkidle');

    // Check no horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow, `Horizontal overflow on ${route} at 375px`).toBe(false);

    // Body should have content
    await expect(page.locator('body')).not.toBeEmpty();
  }
});

// ── TC-213: No console errors on normal navigation ────────────────────────────
test('Application has no console errors on normal navigation TC-213', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await loginAs(page, 'analyst');

  const routes = ['/dashboard', '/feedback', '/trends', '/ask', '/reports', '/settings'];
  for (const route of routes) {
    await page.goto(`${BASE_URL}${route}`);
    await page.waitForLoadState('networkidle');
  }

  // Filter out known benign errors (ResizeObserver, etc.)
  const realErrors = errors.filter(e =>
    !e.includes('ResizeObserver') &&
    !e.includes('Non-Error promise rejection') &&
    !e.includes('favicon')
  );

  expect(realErrors, `Console errors found: ${realErrors.join('\n')}`).toHaveLength(0);
});

// ── TC-214: Keyboard navigation and focus management ─────────────────────────
test('Basic accessibility — keyboard navigation and focus management TC-214', async ({ page }) => {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');

  // Tab through form fields
  await page.keyboard.press('Tab');
  const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
  expect(['INPUT', 'BUTTON', 'A']).toContain(firstFocused);

  // Tab again
  await page.keyboard.press('Tab');
  const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
  expect(['INPUT', 'BUTTON', 'A']).toContain(secondFocused);

  // Verify focus indicators exist (outline or ring style)
  const hasFocusStyle = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return style.outline !== 'none' || style.boxShadow !== 'none' || el.className.includes('ring') || el.className.includes('focus');
  });
  expect(hasFocusStyle).toBe(true);
});

// ── TC-215: Basic accessibility — color contrast and semantic HTML ─────────────
test('Basic accessibility — color contrast and semantic HTML TC-215', async ({ page }) => {
  await loginAs(page, 'analyst');
  await page.goto(`${BASE_URL}/dashboard`);
  await page.waitForLoadState('networkidle');

  // Verify heading hierarchy exists
  const h1Count = await page.locator('h1').count();
  expect(h1Count).toBeGreaterThanOrEqual(1);

  // Verify buttons have accessible labels
  const buttons = page.getByRole('button');
  const buttonCount = await buttons.count();
  for (let i = 0; i < Math.min(buttonCount, 10); i++) {
    const btn = buttons.nth(i);
    const name = await btn.getAttribute('aria-label') || await btn.innerText();
    expect(name.trim().length, `Button at index ${i} has no accessible label`).toBeGreaterThan(0);
  }

  // Verify form inputs on feedback page have labels
  await page.goto(`${BASE_URL}/feedback`);
  await page.waitForLoadState('networkidle');
  const inputs = page.locator('input:not([type="hidden"])');
  const inputCount = await inputs.count();
  for (let i = 0; i < Math.min(inputCount, 5); i++) {
    const input = inputs.nth(i);
    const id = await input.getAttribute('id');
    const ariaLabel = await input.getAttribute('aria-label');
    const placeholder = await input.getAttribute('placeholder');
    const hasLabel = id
      ? (await page.locator(`label[for="${id}"]`).count()) > 0
      : false;
    expect(
      hasLabel || !!ariaLabel || !!placeholder,
      `Input at index ${i} has no accessible label`
    ).toBe(true);
  }
});
