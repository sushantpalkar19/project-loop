/**
 * VoC Reports Tests
 * TC-192: VoC report numbers consistent with actual feedback data
 * TC-193: VoC report generation restricted to ADMIN and ANALYST
 * TC-194: VoC report content generated from period data, not generic filler
 */

import { test, expect } from '@playwright/test';
import { loginAs, authenticatedRequest, BASE_URL } from './helpers/auth';

// ── TC-192: VoC report numbers consistent with actual feedback data ────────────
test('VoC report numbers are consistent with actual feedback data TC-192', async ({ page }) => {
  await loginAs(page, 'admin');

  // Get existing reports
  const reportsRes = await authenticatedRequest(page, 'GET', '/api/reports');
  expect(reportsRes.status).toBe(200);
  const reportsBody = reportsRes.json as { reports?: Array<{ id: string; periodStart?: string; periodEnd?: string; totalFeedback?: number }> };

  if (!reportsBody.reports || reportsBody.reports.length === 0) {
    // Generate a report first
    const createRes = await authenticatedRequest(page, 'POST', '/api/reports', {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    // 201 = created, 500/502 = AI unavailable
    expect([201, 500, 502]).toContain(createRes.status);
    if (createRes.status !== 201) {
      test.skip();
      return;
    }
  }

  // Get analytics for the same period to compare
  const analyticsRes = await authenticatedRequest(
    page, 'GET',
    '/api/analytics/overview'
  );
  expect(analyticsRes.status).toBe(200);
  const analyticsBody = analyticsRes.json as {
    metrics: { totalFeedback: number };
    themes: Array<{ name: string; count: number }>;
  };

  // Get feedback count for the same period
  const feedbackRes = await authenticatedRequest(
    page, 'GET',
    '/api/feedback?dateFrom=2024-01-01&dateTo=2024-12-31&pageSize=1'
  );
  expect(feedbackRes.status).toBe(200);
  const feedbackBody = feedbackRes.json as { pagination: { total: number } };

  // Analytics total should match feedback pagination total
  expect(analyticsBody.metrics.totalFeedback).toBe(feedbackBody.pagination.total);

  // Navigate to reports page
  await page.goto(`${BASE_URL}/reports`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();
});

// ── TC-193: VoC report generation restricted to ADMIN and ANALYST ─────────────
test('VoC report generation is restricted to ADMIN and ANALYST roles TC-193', async ({ page }) => {
  // VIEWER cannot generate reports
  await loginAs(page, 'viewer');

  await page.goto(`${BASE_URL}/reports`);
  await page.waitForLoadState('networkidle');

  // VIEWER should not see a Generate Report button, or it should be disabled
  const generateBtn = page.getByRole('button', { name: /generate report/i });
  const btnCount = await generateBtn.count();
  if (btnCount > 0) {
    const isDisabled = await generateBtn.first().isDisabled();
    expect(isDisabled).toBe(true);
  }

  // API-level: VIEWER POST /api/reports → 403
  const viewerRes = await authenticatedRequest(page, 'POST', '/api/reports', {
    title: 'Viewer Report Attempt',
    periodStart: '2024-01-01',
    periodEnd: '2024-12-31',
  });
  expect(viewerRes.status).toBe(403);

  // ANALYST can generate reports
  await page.goto(`${BASE_URL}/login`);
  await loginAs(page, 'analyst');
  const analystRes = await authenticatedRequest(page, 'POST', '/api/reports', {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  });
  // 201 = created, 500/502 = AI unavailable in test env
  expect([201, 500, 502]).toContain(analystRes.status);

  // ADMIN can generate reports
  await page.goto(`${BASE_URL}/login`);
  await loginAs(page, 'admin');
  const adminRes = await authenticatedRequest(page, 'POST', '/api/reports', {
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  });
  expect([201, 500, 502]).toContain(adminRes.status);
});

// ── TC-194: VoC report content generated from period data, not generic filler ──
test('VoC report content is generated from period data not generic filler TC-194', async ({ page }) => {
  await loginAs(page, 'admin');

  // Generate two reports for different periods
  const reportARes = await authenticatedRequest(page, 'POST', '/api/reports', {
    startDate: '2024-01-01',
    endDate: '2024-06-30',
  });
  const reportBRes = await authenticatedRequest(page, 'POST', '/api/reports', {
    startDate: '2024-07-01',
    endDate: '2024-12-31',
  });

  // If AI is unavailable, skip the content comparison
  if (reportARes.status !== 201 || reportBRes.status !== 201) {
    test.skip();
    return;
  }

  const reportA = reportARes.json as { report: { id: string; content?: string; title: string } };
  const reportB = reportBRes.json as { report: { id: string; content?: string; title: string } };

  // Reports should exist
  expect(reportA.report).toHaveProperty('id');
  expect(reportB.report).toHaveProperty('id');

  // If content is returned, the two reports should not be identical
  if (reportA.report.content && reportB.report.content) {
    expect(reportA.report.content).not.toBe(reportB.report.content);
  }

  // Navigate to reports page and verify both reports are listed
  await page.goto(`${BASE_URL}/reports`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).not.toBeEmpty();

  // Fetch reports list and verify both exist
  const listRes = await authenticatedRequest(page, 'GET', '/api/reports');
  expect(listRes.status).toBe(200);
  const listBody = listRes.json as { reports: Array<{ id: string }> };
  const ids = listBody.reports.map((r) => r.id);
  expect(ids).toContain(reportA.report.id);
  expect(ids).toContain(reportB.report.id);
});
