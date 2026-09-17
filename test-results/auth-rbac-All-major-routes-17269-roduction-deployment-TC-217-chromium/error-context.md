# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-rbac.spec.ts >> All major routes load without errors on production deployment TC-217
- Location: tests\auth-rbac.spec.ts:55:5

# Error details

```
Error: JS errors on routes: Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.

expect(received).toHaveLength(expected)

Expected length: 0
Received length: 8
Received array:  ["Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.", "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.", "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.", "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.", "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.", "Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.", "Minified React error #418; visit https://react.dev/errors/418 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.", "Minified React error #423; visit https://react.dev/errors/423 for the full message or use the non-minified dev environment for full errors and additional helpful warnings."]
```

# Page snapshot

```yaml
- generic [active] [ref=f8e1]:
  - generic [ref=f8e3]:
    - complementary [ref=f8e4]:
      - generic [ref=f8e5]:
        - link "LOOP Feedback Intelligence" [ref=f8e7] [cursor=pointer]:
          - /url: /dashboard
          - generic [ref=f8e13]:
            - generic [ref=f8e14]: LOOP
            - generic [ref=f8e15]: Feedback Intelligence
        - generic [ref=f8e17]:
          - generic [ref=f8e18]:
            - generic [ref=f8e19]: Tenant Workspace
            - generic [ref=f8e20]: demo-workspace…
          - generic "Active" [ref=f8e21]
        - navigation [ref=f8e22]:
          - generic [ref=f8e23]:
            - generic [ref=f8e24]: Main Platform
            - generic [ref=f8e25]:
              - link "Dashboard" [ref=f8e26] [cursor=pointer]:
                - /url: /dashboard
              - link "Feedback Inbox" [ref=f8e34] [cursor=pointer]:
                - /url: /feedback
              - link "Insights & Trends" [ref=f8e39] [cursor=pointer]:
                - /url: /trends
              - link "Ask LOOP AI" [ref=f8e45] [cursor=pointer]:
                - /url: /ask
              - link "VoC Reports" [ref=f8e51] [cursor=pointer]:
                - /url: /reports
        - generic [ref=f8e56]:
          - generic [ref=f8e57]:
            - generic [ref=f8e58]: M
            - generic [ref=f8e59]:
              - paragraph [ref=f8e60]: Marcus Johnson
              - paragraph [ref=f8e61]: analyst@loop.demo
          - generic [ref=f8e62]:
            - generic [ref=f8e63]: ANALYST
            - button "Log out" [ref=f8e64] [cursor=pointer]
    - generic [ref=f8e69]:
      - banner [ref=f8e71]:
        - generic [ref=f8e73]:
          - generic [ref=f8e74]:
            - generic [ref=f8e75]: Workspace
            - generic [ref=f8e76]: /
            - heading "Workspace Settings" [level=1] [ref=f8e77]
          - paragraph [ref=f8e78]: Tenant configuration & system information
        - generic [ref=f8e79]:
          - link "Ask LOOP" [ref=f8e80] [cursor=pointer]:
            - /url: /ask
          - generic [ref=f8e86]:
            - generic [ref=f8e91]: "Tenant:"
            - generic [ref=f8e92]: demo-wor
          - generic [ref=f8e93]: ANALYST
          - button "User account menu" [ref=f8e95] [cursor=pointer]:
            - generic [ref=f8e96]: M
      - main [ref=f8e99]:
        - generic [ref=f8e100]:
          - generic [ref=f8e103]:
            - generic [ref=f8e104]: SYSTEM & WORKSPACE CONFIGURATION
            - heading "Workspace Settings" [level=1] [ref=f8e109]
            - paragraph [ref=f8e110]: Overview of active tenant isolation, user role security, and platform specifications.
          - generic [ref=f8e111]:
            - generic [ref=f8e112]:
              - heading "User Account Profile" [level=3] [ref=f8e113]
              - paragraph [ref=f8e117]: Authenticated session user details
            - generic [ref=f8e119]:
              - generic [ref=f8e120]:
                - generic [ref=f8e121]: "Full Name:"
                - paragraph [ref=f8e122]: Marcus Johnson
              - generic [ref=f8e123]:
                - generic [ref=f8e124]: "Email Address:"
                - paragraph [ref=f8e125]: analyst@loop.demo
              - generic [ref=f8e126]:
                - generic [ref=f8e127]: "Role Permissions:"
                - generic [ref=f8e128]: ANALYST
              - generic [ref=f8e129]:
                - generic [ref=f8e130]: "Authentication Provider:"
                - paragraph [ref=f8e131]: NextAuth.js Credentials (JWT Session)
          - generic [ref=f8e132]:
            - generic [ref=f8e133]:
              - heading "Workspace Tenant Isolation" [level=3] [ref=f8e134]
              - paragraph [ref=f8e139]: Multi-tenant security parameters
            - generic [ref=f8e140]:
              - generic [ref=f8e141]:
                - generic [ref=f8e142]: Multi-Tenant Query Scoping Enforced
                - paragraph [ref=f8e146]:
                  - text: Every database query and API call in Project LOOP is strictly scoped to your authenticated
                  - code [ref=f8e147]: workspaceId
                  - text: . Client requests cannot bypass workspace boundaries.
              - generic [ref=f8e148]:
                - generic [ref=f8e149]:
                  - generic [ref=f8e150]: "Active Workspace ID:"
                  - paragraph [ref=f8e151]: demo-workspace-001
                - generic [ref=f8e152]:
                  - generic [ref=f8e153]: "Isolation Mode:"
                  - generic [ref=f8e154]: Active Tenant Scoping
          - generic [ref=f8e158]:
            - generic [ref=f8e159]:
              - heading "System Infrastructure & Architecture" [level=3] [ref=f8e160]
              - paragraph [ref=f8e164]: Official Zidio Project LOOP Specifications
            - generic [ref=f8e166]:
              - generic [ref=f8e167]:
                - generic [ref=f8e168]: Framework
                - text: Next.js 14 App Router
              - generic [ref=f8e169]:
                - generic [ref=f8e170]: Database & ORM
                - text: PostgreSQL + Prisma ORM
              - generic [ref=f8e171]:
                - generic [ref=f8e172]: AI Intelligence
                - text: Google Gemini / Vector Search
      - contentinfo [ref=f8e173]:
        - generic [ref=f8e174]:
          - generic [ref=f8e181]:
            - generic [ref=f8e182]: Project LOOP
            - generic [ref=f8e183]: ·
            - generic [ref=f8e184]: AI Feedback Intelligence Platform
          - navigation "Footer navigation" [ref=f8e185]:
            - link "Dashboard" [ref=f8e186] [cursor=pointer]:
              - /url: /dashboard
            - link "Feedback" [ref=f8e187] [cursor=pointer]:
              - /url: /feedback
            - link "Insights" [ref=f8e188] [cursor=pointer]:
              - /url: /trends
            - link "Ask LOOP" [ref=f8e189] [cursor=pointer]:
              - /url: /ask
            - link "Reports" [ref=f8e190] [cursor=pointer]:
              - /url: /reports
          - generic [ref=f8e191]:
            - generic [ref=f8e192]: Isolated Tenant
            - generic [ref=f8e197]: © 2026 Project LOOP
  - alert [ref=f8e198]
```

# Test source

```ts
  1   | /**
  2   |  * Authentication, RBAC & Route Tests
  3   |  * TC-216: Seed data present and demo credentials work
  4   |  * TC-217: All major routes load without errors on production
  5   |  * TC-218: Zidio M1 Foundation milestone — auth, RBAC, workspace isolation
  6   |  */
  7   | 
  8   | import { test, expect } from '@playwright/test';
  9   | import { loginAs, authenticatedRequest, BASE_URL, CREDENTIALS } from './helpers/auth';
  10  | 
  11  | // ── TC-216: Seed data present and all demo credentials work ───────────────────
  12  | test('Seed data is present and all demo credentials work TC-216', async ({ page }) => {
  13  |   // ADMIN login
  14  |   await loginAs(page, 'admin');
  15  |   await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  16  | 
  17  |   // Verify feedback items exist (seed creates 26+ items)
  18  |   const feedbackRes = await authenticatedRequest(page, 'GET', '/api/feedback?pageSize=1');
  19  |   expect(feedbackRes.status).toBe(200);
  20  |   const feedbackBody = feedbackRes.json as { pagination: { total: number } };
  21  |   expect(feedbackBody.pagination.total).toBeGreaterThanOrEqual(20);
  22  | 
  23  |   // Verify themes exist
  24  |   const themesRes = await authenticatedRequest(page, 'GET', '/api/themes');
  25  |   expect(themesRes.status).toBe(200);
  26  |   const themesBody = themesRes.json as unknown[];
  27  |   expect(Array.isArray(themesBody)).toBe(true);
  28  |   expect(themesBody.length).toBeGreaterThan(0);
  29  | 
  30  |   // ANALYST login
  31  |   await page.goto(`${BASE_URL}/login`);
  32  |   await page.locator('#email').fill(CREDENTIALS.analyst.email);
  33  |   await page.locator('#password').fill(CREDENTIALS.analyst.password);
  34  |   await page.getByRole('button', { name: /sign in/i }).click();
  35  |   await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
  36  |   await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  37  | 
  38  |   // VIEWER login
  39  |   await page.goto(`${BASE_URL}/login`);
  40  |   await page.locator('#email').fill(CREDENTIALS.viewer.email);
  41  |   await page.locator('#password').fill(CREDENTIALS.viewer.password);
  42  |   await page.getByRole('button', { name: /sign in/i }).click();
  43  |   await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 15000 });
  44  |   await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
  45  | 
  46  |   // VIEWER should see data but not be able to create feedback
  47  |   const viewerFeedbackPost = await authenticatedRequest(page, 'POST', '/api/feedback', {
  48  |     content: 'Viewer test',
  49  |     channel: 'email',
  50  |   });
  51  |   expect(viewerFeedbackPost.status).toBe(403);
  52  | });
  53  | 
  54  | // ── TC-217: All major routes load without errors ───────────────────────────────
  55  | test('All major routes load without errors on production deployment TC-217', async ({ page }) => {
  56  |   // Public routes
  57  |   await page.goto(`${BASE_URL}/`);
  58  |   await page.waitForLoadState('networkidle');
  59  |   expect(page.url()).toContain(BASE_URL.replace(/\/$/, ''));
  60  | 
  61  |   await page.goto(`${BASE_URL}/login`);
  62  |   await page.waitForLoadState('networkidle');
  63  |   await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  64  | 
  65  |   // Authenticated routes
  66  |   await loginAs(page, 'analyst');
  67  | 
  68  |   const routes = [
  69  |     { path: '/dashboard', label: 'dashboard' },
  70  |     { path: '/feedback', label: 'feedback' },
  71  |     { path: '/trends', label: 'trends' },
  72  |     { path: '/ask', label: 'ask' },
  73  |     { path: '/reports', label: 'reports' },
  74  |     { path: '/settings', label: 'settings' },
  75  |   ];
  76  | 
  77  |   const errors: string[] = [];
  78  |   page.on('pageerror', (err) => errors.push(err.message));
  79  | 
  80  |   for (const route of routes) {
  81  |     const response = await page.goto(`${BASE_URL}${route.path}`);
  82  |     await page.waitForLoadState('networkidle');
  83  |     expect(response?.status(), `Route ${route.path} returned non-200`).toBeLessThan(400);
  84  |     await expect(page.locator('body')).not.toBeEmpty();
  85  |   }
  86  | 
  87  |   const realErrors = errors.filter(e => !e.includes('ResizeObserver'));
> 88  |   expect(realErrors, `JS errors on routes: ${realErrors.join('\n')}`).toHaveLength(0);
      |                                                                       ^ Error: JS errors on routes: Minified React error #425; visit https://react.dev/errors/425 for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
  89  | });
  90  | 
  91  | // ── TC-218: M1 Foundation — auth, RBAC, workspace isolation ──────────────────
  92  | test('Zidio M1 Foundation milestone — auth, RBAC, workspace isolation verified TC-218', async ({ page }) => {
  93  |   // 1. Application loads
  94  |   await page.goto(`${BASE_URL}/`);
  95  |   await page.waitForLoadState('networkidle');
  96  |   await expect(page.locator('body')).not.toBeEmpty();
  97  | 
  98  |   // 2. Protected routes redirect unauthenticated users
  99  |   await page.context().clearCookies();
  100 |   await page.goto(`${BASE_URL}/dashboard`);
  101 |   await page.waitForLoadState('networkidle');
  102 |   expect(page.url()).toContain('/login');
  103 | 
  104 |   // 3. Login and verify session persistence
  105 |   await loginAs(page, 'admin');
  106 |   await page.reload();
  107 |   await page.waitForLoadState('networkidle');
  108 |   expect(page.url()).toContain('/dashboard');
  109 | 
  110 |   // 4. ADMIN can manage members
  111 |   const membersRes = await authenticatedRequest(page, 'GET', '/api/workspace/members');
  112 |   expect(membersRes.status).toBe(200);
  113 | 
  114 |   // 5. ANALYST can ingest feedback
  115 |   await page.goto(`${BASE_URL}/login`);
  116 |   await loginAs(page, 'analyst');
  117 |   const feedbackRes = await authenticatedRequest(page, 'POST', '/api/feedback', {
  118 |     content: 'M1 test feedback',
  119 |     channel: 'email',
  120 |   });
  121 |   // 201 = created, 502 = embedding failed (acceptable in test env)
  122 |   expect([201, 502]).toContain(feedbackRes.status);
  123 | 
  124 |   // 6. VIEWER is read-only — write actions blocked
  125 |   await page.goto(`${BASE_URL}/login`);
  126 |   await loginAs(page, 'viewer');
  127 |   const viewerWrite = await authenticatedRequest(page, 'POST', '/api/feedback', {
  128 |     content: 'Viewer write attempt',
  129 |     channel: 'email',
  130 |   });
  131 |   expect(viewerWrite.status).toBe(403);
  132 | 
  133 |   // 7. Cross-workspace access blocked — workspaceId from session only
  134 |   // Use analyst (who can POST) to verify injected workspaceId is ignored
  135 |   await page.goto(`${BASE_URL}/login`);
  136 |   await loginAs(page, 'analyst');
  137 |   const crossWorkspace = await authenticatedRequest(page, 'POST', '/api/feedback', {
  138 |     content: 'Cross-workspace attempt',
  139 |     channel: 'email',
  140 |     workspaceId: 'other-workspace-id',
  141 |   });
  142 |   // Should succeed (201) or fail embedding (502) — injected workspaceId is stripped by Zod
  143 |   expect([201, 400, 502]).toContain(crossWorkspace.status);
  144 | });
  145 | 
```