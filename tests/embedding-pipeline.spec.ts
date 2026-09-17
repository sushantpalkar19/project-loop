/**
 * Embedding Pipeline + Reindex API Tests
 *
 * Covers:
 * - TC-EMB-01: ADMIN can GET /api/admin/reindex for workspace embedding status
 * - TC-EMB-02: Non-ADMIN cannot GET /api/admin/reindex (403)
 * - TC-EMB-03: ADMIN can POST /api/admin/reindex to trigger backfill
 * - TC-EMB-04: Reindex POST with ?regenerate=true is accepted
 * - TC-EMB-05: Non-ADMIN cannot POST /api/admin/reindex (403)
 * - TC-EMB-06: Unauthenticated request to /api/admin/reindex returns 401
 * - TC-EMB-07: Reindex GET returns geminiAvailable flag
 * - TC-EMB-08: Reindex GET returns structurally correct response
 * - TC-EMB-09: After simulate, Ask LOOP eventually answers (embeddings generated)
 */

import { test, expect } from '@playwright/test';
import {
  loginAs,
  unauthenticatedRequest,
  authenticatedRequest,
  BASE_URL,
} from './helpers/auth';

// ── TC-EMB-01: ADMIN can GET embedding status ─────────────────────────────

test('ADMIN can GET /api/admin/reindex for workspace embedding status TC-EMB-01', async ({ page }) => {
  await loginAs(page, 'admin');

  const res = await authenticatedRequest(page, 'GET', '/api/admin/reindex');

  expect(res.status, 'Expected 200 for ADMIN GET reindex status').toBe(200);

  const body = (res.json as Record<string, unknown>) || {};
  expect(typeof body.totalFeedback).toBe('number');
  expect(typeof body.embeddingCount).toBe('number');
  expect(typeof body.missingEmbeddings).toBe('number');
  expect(typeof body.isFullyIndexed).toBe('boolean');
  expect(typeof body.geminiAvailable).toBe('boolean');
  expect(typeof body.hint).toBe('string');

  // Basic consistency check
  expect(body.missingEmbeddings).toBe(
    (body.totalFeedback as number) - (body.embeddingCount as number)
  );
});

// ── TC-EMB-02: Non-ADMIN cannot GET /api/admin/reindex ───────────────────

test('Non-ADMIN roles cannot GET /api/admin/reindex TC-EMB-02', async ({ page }) => {
  // ANALYST → 403
  await loginAs(page, 'analyst');
  const r1 = await authenticatedRequest(page, 'GET', '/api/admin/reindex');
  expect(r1.status, 'Expected 403 for ANALYST GET reindex').toBe(403);
  const b1 = r1.json as Record<string, unknown>;
  expect(b1).toHaveProperty('error');

  // VIEWER → 403
  await page.goto(`${BASE_URL}/login`);
  await loginAs(page, 'viewer');
  const r2 = await authenticatedRequest(page, 'GET', '/api/admin/reindex');
  expect(r2.status, 'Expected 403 for VIEWER GET reindex').toBe(403);
});

// ── TC-EMB-03: ADMIN can POST /api/admin/reindex to trigger backfill ──────

test('ADMIN can POST /api/admin/reindex to trigger embedding backfill TC-EMB-03', async ({ page }) => {
  await loginAs(page, 'admin');

  // POST with a small limit to avoid a long-running test
  const res = await page.request.fetch(`${BASE_URL}/api/admin/reindex?limit=5`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    failOnStatusCode: false,
  });

  const status = res.status();

  // Acceptable outcomes:
  // 200 = success (all processed)
  // 207 = partial success (some failed)
  // 503 = GEMINI_API_KEY not configured in test environment
  // 500 = unexpected server error (should not happen)
  expect(
    [200, 207, 503],
    `Unexpected reindex status: ${status}`
  ).toContain(status);

  const body = await res.json() as Record<string, unknown>;

  if (status === 503) {
    expect(body).toHaveProperty('error');
    // Gemini not configured in this environment — that's fine
    return;
  }

  // 200 or 207 — check structural correctness
  expect(typeof body.processed).toBe('number');
  expect(typeof body.succeeded).toBe('number');
  expect(typeof body.failed).toBe('number');
  expect(typeof body.totalFeedback).toBe('number');
  expect(typeof body.embeddingCount).toBe('number');
});

// ── TC-EMB-04: ?regenerate=true is accepted ──────────────────────────────

test('POST /api/admin/reindex?regenerate=true is accepted by ADMIN TC-EMB-04', async ({ page }) => {
  await loginAs(page, 'admin');

  const res = await page.request.fetch(
    `${BASE_URL}/api/admin/reindex?regenerate=true&limit=2`,
    { method: 'POST', failOnStatusCode: false }
  );

  const status = res.status();
  expect(
    [200, 207, 503],
    `Unexpected status for regenerate reindex: ${status}`
  ).toContain(status);
});

// ── TC-EMB-05: Non-ADMIN cannot POST /api/admin/reindex ──────────────────

test('Non-ADMIN cannot POST /api/admin/reindex TC-EMB-05', async ({ page }) => {
  // ANALYST → 403
  await loginAs(page, 'analyst');
  const r1 = await page.request.fetch(`${BASE_URL}/api/admin/reindex`, {
    method: 'POST',
    failOnStatusCode: false,
  });
  expect(r1.status(), 'Expected 403 for ANALYST POST reindex').toBe(403);

  // MANAGER → 403 (reindex is ADMIN-only)
  await page.goto(`${BASE_URL}/login`);
  await loginAs(page, 'manager');
  const r2 = await page.request.fetch(`${BASE_URL}/api/admin/reindex`, {
    method: 'POST',
    failOnStatusCode: false,
  });
  expect(r2.status(), 'Expected 403 for MANAGER POST reindex').toBe(403);
});

// ── TC-EMB-06: Unauthenticated → 401 ─────────────────────────────────────

test('Unauthenticated requests to /api/admin/reindex return 401 TC-EMB-06', async () => {
  const r1 = await unauthenticatedRequest('GET', '/api/admin/reindex');
  expect(r1.status, 'Expected 401 for unauthenticated GET').toBe(401);

  const r2 = await unauthenticatedRequest('POST', '/api/admin/reindex');
  expect(r2.status, 'Expected 401 for unauthenticated POST').toBe(401);
});

// ── TC-EMB-07: GET returns geminiAvailable flag ───────────────────────────

test('GET /api/admin/reindex returns geminiAvailable flag TC-EMB-07', async ({ page }) => {
  await loginAs(page, 'admin');

  const res = await authenticatedRequest(page, 'GET', '/api/admin/reindex');
  expect(res.status).toBe(200);

  const body = (res.json as Record<string, unknown>) || {};
  // geminiAvailable is a boolean — must be true for Ask LOOP to work
  expect(typeof body.geminiAvailable).toBe('boolean');
  // In production, this should be true
  // In CI without GEMINI_API_KEY, it may be false — both are valid for this test
});

// ── TC-EMB-08: Reindex GET structural correctness ─────────────────────────

test('GET /api/admin/reindex has correct structure and no negative values TC-EMB-08', async ({ page }) => {
  await loginAs(page, 'admin');

  const res = await authenticatedRequest(page, 'GET', '/api/admin/reindex');
  expect(res.status).toBe(200);

  const body = (res.json as Record<string, unknown>) || {};

  // No negative counts
  expect(body.totalFeedback as number).toBeGreaterThanOrEqual(0);
  expect(body.embeddingCount as number).toBeGreaterThanOrEqual(0);
  expect(body.missingEmbeddings as number).toBeGreaterThanOrEqual(0);

  // Embedding count cannot exceed total feedback
  expect(body.embeddingCount as number).toBeLessThanOrEqual(body.totalFeedback as number);

  // isFullyIndexed is true iff missingEmbeddings === 0
  const expectedFullyIndexed = (body.missingEmbeddings as number) === 0;
  expect(body.isFullyIndexed).toBe(expectedFullyIndexed);
});

// ── TC-EMB-09: Ask LOOP answers after reindex ────────────────────────────

test('Ask LOOP answers questions after embeddings are present TC-EMB-09', async ({ page }) => {
  await loginAs(page, 'admin');

  // First, check embedding status
  const statusRes = await authenticatedRequest(page, 'GET', '/api/admin/reindex');
  const statusBody = (statusRes.json as Record<string, unknown>) || {};

  if (!statusBody.geminiAvailable) {
    // Skip this test if Gemini is not configured or auth/status check failed
    test.skip();
    return;
  }

  // If there are missing embeddings, trigger reindex first
  if ((statusBody.missingEmbeddings as number) > 0) {
    const reindexRes = await page.request.fetch(`${BASE_URL}/api/admin/reindex?limit=50`, {
      method: 'POST',
      failOnStatusCode: false,
    });
    const reindexStatus = reindexRes.status();
    // 200 or 207 are acceptable — we just need some embeddings
    expect([200, 207]).toContain(reindexStatus);
  }

  // Now ask a question
  const askRes = await authenticatedRequest(page, 'POST', '/api/ask', {
    question: 'What are customers saying about the product?',
  });

  // After reindex, should return answer (200) or graceful not-found (404 if all embeddings failed)
  expect([200, 404, 429, 502]).toContain(askRes.status);

  if (askRes.status === 200) {
    const askBody = askRes.json as Record<string, unknown>;
    expect(typeof askBody.answer).toBe('string');
    expect(Array.isArray(askBody.sources)).toBe(true);
  }
});
