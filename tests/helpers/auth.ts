import { Page, request } from '@playwright/test';

export const BASE_URL = process.env.BASE_URL || 'https://project-loop-lemon.vercel.app';

export const CREDENTIALS = {
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@loop.demo',
    password: process.env.TEST_ADMIN_PASSWORD || 'demo-password-change-in-production',
  },
  manager: {
    email: process.env.TEST_MANAGER_EMAIL || 'manager@loop.demo',
    password: process.env.TEST_MANAGER_PASSWORD || 'demo-password-change-in-production',
  },
  analyst: {
    email: process.env.TEST_ANALYST_EMAIL || 'analyst@loop.demo',
    password: process.env.TEST_ANALYST_PASSWORD || 'demo-password-change-in-production',
  },
  viewer: {
    email: process.env.TEST_VIEWER_EMAIL || 'viewer@loop.demo',
    password: process.env.TEST_VIEWER_PASSWORD || 'demo-password-change-in-production',
  },
};

/** Log in via the UI and wait for the dashboard to load. */
export async function loginAs(
  page: Page,
  role: 'admin' | 'manager' | 'analyst' | 'viewer'
) {
  const creds = CREDENTIALS[role];
  await page.context().clearCookies();
  await page.goto(`${BASE_URL}/login`);
  await page.locator('#email').fill(creds.email);
  await page.locator('#password').fill(creds.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
}

/** Make an unauthenticated API request (no cookies). */
export async function unauthenticatedRequest(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: Record<string, unknown>
) {
  const ctx = await request.newContext({ baseURL: BASE_URL });
  const res = await ctx.fetch(path, {
    method,
    data: body,
    headers: { 'Content-Type': 'application/json' },
    failOnStatusCode: false,
  });
  const status = res.status();
  let json: unknown = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }
  await ctx.dispose();
  return { status, json };
}

/** Make an authenticated API request using the page's session cookies. */
export async function authenticatedRequest(
  page: Page,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: Record<string, unknown>
) {
  const response = await page.request.fetch(`${BASE_URL}${path}`, {
    method,
    data: body,
    headers: { 'Content-Type': 'application/json' },
    failOnStatusCode: false,
  });
  const status = response.status();
  let json: unknown = null;
  try { json = await response.json(); } catch { /* non-JSON body */ }
  return { status, json };
}
