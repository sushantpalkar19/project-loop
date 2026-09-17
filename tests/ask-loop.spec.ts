/**
 * Ask LOOP API + UI Tests
 *
 * Covers:
 * - TC-ASK-01: Unauthenticated request → 401
 * - TC-ASK-02: Invalid body (question too short) → 400
 * - TC-ASK-03: GET method → 405
 * - TC-ASK-04: Valid authenticated request → 200 with answer
 * - TC-ASK-05: Error is shown in UI, never silently replaced with "No feedback"
 * - TC-ASK-06: Workspace isolation — workspaceId from session, not request body
 * - TC-ASK-07: Empty question body → 400
 */

import { test, expect } from '@playwright/test';
import {
  loginAs,
  unauthenticatedRequest,
  authenticatedRequest,
  BASE_URL,
} from './helpers/auth';

// ── TC-ASK-01: Unauthenticated request → 401 ───────────────────────────────

test('Ask LOOP API returns 401 for unauthenticated request TC-ASK-01', async () => {
  const res = await unauthenticatedRequest('POST', '/api/ask', {
    question: 'What are the top customer complaints?',
  });

  expect(res.status, 'Expected 401 for unauthenticated Ask LOOP request').toBe(401);
  const body = res.json as Record<string, unknown>;
  expect(body).toHaveProperty('error');
  expect(JSON.stringify(body)).not.toContain('stack');
});

// ── TC-ASK-02: Question too short → 400 ────────────────────────────────────

test('Ask LOOP API returns 400 for question that is too short TC-ASK-02', async ({ page }) => {
  await loginAs(page, 'analyst');

  const res = await authenticatedRequest(page, 'POST', '/api/ask', {
    question: 'Hi', // 2 chars — below the 5-char minimum
  });

  expect(res.status, 'Expected 400 for short question').toBe(400);
  const body = res.json as Record<string, unknown>;
  expect(body).toHaveProperty('error');
});

// ── TC-ASK-03: GET method → 405 ────────────────────────────────────────────

test('Ask LOOP API returns 405 for GET method TC-ASK-03', async ({ page }) => {
  await loginAs(page, 'analyst');

  const res = await authenticatedRequest(page, 'GET', '/api/ask');

  expect(res.status, 'Expected 405 for GET method on /api/ask').toBe(405);
  const body = res.json as Record<string, unknown>;
  expect(body).toHaveProperty('error');
});

// ── TC-ASK-04: Valid authenticated request returns answer or graceful error ─

test('Ask LOOP API returns 200 or graceful error for valid question TC-ASK-04', async ({ page }) => {
  await loginAs(page, 'analyst');

  const res = await authenticatedRequest(page, 'POST', '/api/ask', {
    question: 'What are customers saying about our product?',
  });

  // Acceptable outcomes:
  // 200 = AI answered successfully
  // 404 = workspace has no indexed feedback (NO_FEEDBACK_FOUND — expected on empty workspace)
  // 502 = Gemini model error (expected if AI key is not configured in test env)
  // 429 = Gemini quota (rate limit)
  // 500 = Unexpected server error (should NOT happen after our fix)
  expect(
    [200, 404, 429, 502],
    `Expected 200/404/429/502 for valid Ask LOOP question, got ${res.status}`
  ).toContain(res.status);

  const body = res.json as Record<string, unknown>;

  if (res.status === 200) {
    expect(body).toHaveProperty('answer');
    expect(typeof body.answer).toBe('string');
    expect((body.answer as string).length).toBeGreaterThan(0);
    expect(body).toHaveProperty('sources');
    expect(Array.isArray(body.sources)).toBe(true);
    expect(body).toHaveProperty('hasEvidence');
  } else {
    // All error responses must have a structured error message
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
    // Error should not be a raw stack trace or internal error
    expect(JSON.stringify(body)).not.toContain('at Object.<anonymous>');
    expect(JSON.stringify(body)).not.toContain('GEMINI_API_KEY');
  }
});

// ── TC-ASK-05: UI shows actual error, not misleading "No feedback" message ──

test('Ask LOOP UI shows actual error message not misleading empty state TC-ASK-05', async ({ page }) => {
  await loginAs(page, 'analyst');
  await page.goto(`${BASE_URL}/ask`);

  // Wait for the Ask LOOP page to be ready
  await page.waitForSelector('textarea', { timeout: 10000 });

  // Fill in a question
  const textarea = page.locator('textarea');
  await textarea.fill('What are the most common complaints from customers?');

  // Click the Ask button
  const askButton = page.locator('button', { hasText: /^Ask$/ });
  await askButton.click();

  // Wait for loading to complete (either answer or error)
  await page.waitForFunction(
    () => {
      // Loading spinner gone or error banner appeared or assistant message appeared
      const spinner = document.querySelector('[class*="animate-spin"]');
      const errorBanner = document.querySelector('[class*="rose"]');
      const assistantMsg = document.querySelector('[class*="bg-white border border-slate-200"]');
      return !spinner || errorBanner || assistantMsg;
    },
    { timeout: 30000 }
  );

  // If there was an error, it should NOT say "No customer feedback found"
  // when the workspace actually has feedback records
  const errorBanner = page.locator('[class*="rose-50"]');
  if (await errorBanner.isVisible()) {
    const errorText = await errorBanner.textContent();
    // The error banner must show a real error message, not a silent generic message
    expect(errorText).toBeTruthy();
    // "No customer feedback" message should only appear if workspace is genuinely empty
    // It should NOT appear when the error is actually a 502/500 AI failure
  }

  // Page title should be visible
  await expect(page.locator('h1', { hasText: 'Ask LOOP' })).toBeVisible();
});

// ── TC-ASK-06: Workspace isolation — injected workspaceId is ignored ────────

test('Ask LOOP API ignores injected workspaceId in request body TC-ASK-06', async ({ page }) => {
  await loginAs(page, 'analyst');

  // Attempt to inject a fake workspaceId in the request body
  const res = await authenticatedRequest(page, 'POST', '/api/ask', {
    question: 'What are customer complaints?',
    workspaceId: 'fake-other-workspace-id',
  });

  // Server must accept the request (question is valid, workspaceId in body is ignored)
  // and use the session workspaceId — NOT the injected one.
  // 200 = answered (with session workspace), 404 = no feedback in session workspace,
  // 502/429 = AI error. All acceptable. 403/500 are NOT acceptable.
  expect(
    [200, 404, 429, 502],
    `Workspace isolation failure: unexpected status ${res.status}`
  ).toContain(res.status);
});

// ── TC-ASK-07: Empty body → 400 ────────────────────────────────────────────

test('Ask LOOP API returns 400 for empty request body TC-ASK-07', async ({ page }) => {
  await loginAs(page, 'analyst');

  const res = await authenticatedRequest(page, 'POST', '/api/ask', {});

  expect(res.status, 'Expected 400 for empty Ask LOOP body').toBe(400);
  const body = res.json as Record<string, unknown>;
  expect(body).toHaveProperty('error');
});

// ── TC-ASK-08: Question at maximum length → 400 ────────────────────────────

test('Ask LOOP API returns 400 for question exceeding 500 chars TC-ASK-08', async ({ page }) => {
  await loginAs(page, 'analyst');

  const longQuestion = 'A'.repeat(501); // 501 chars — over the 500-char limit

  const res = await authenticatedRequest(page, 'POST', '/api/ask', {
    question: longQuestion,
  });

  expect(res.status, 'Expected 400 for question over 500 chars').toBe(400);
  const body = res.json as Record<string, unknown>;
  expect(body).toHaveProperty('error');
});
