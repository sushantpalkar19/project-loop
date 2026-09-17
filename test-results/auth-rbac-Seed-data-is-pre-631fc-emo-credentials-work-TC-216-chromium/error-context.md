# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-rbac.spec.ts >> Seed data is present and all demo credentials work TC-216
- Location: tests\auth-rbac.spec.ts:12:5

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - link "LOOP Feedback Intelligence" [ref=e7] [cursor=pointer]:
          - /url: /dashboard
          - generic [ref=e13]:
            - generic [ref=e14]: LOOP
            - generic [ref=e15]: Feedback Intelligence
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e19]: Tenant Workspace
            - generic [ref=e20]: demo-workspace…
          - generic "Active" [ref=e21]
        - navigation [ref=e22]:
          - generic [ref=e23]:
            - generic [ref=e24]: Main Platform
            - generic [ref=e25]:
              - link "Dashboard" [ref=e26] [cursor=pointer]:
                - /url: /dashboard
              - link "Feedback Inbox" [ref=e36] [cursor=pointer]:
                - /url: /feedback
              - link "Insights & Trends" [ref=e41] [cursor=pointer]:
                - /url: /trends
              - link "Ask LOOP AI" [ref=e47] [cursor=pointer]:
                - /url: /ask
              - link "VoC Reports" [ref=e53] [cursor=pointer]:
                - /url: /reports
          - generic [ref=e58]:
            - generic [ref=e59]: Workspace Admin
            - generic [ref=e60]:
              - link "Team Members" [ref=e61] [cursor=pointer]:
                - /url: /workspace
              - link "Workspace Settings" [ref=e69] [cursor=pointer]:
                - /url: /settings
        - generic [ref=e75]:
          - generic [ref=e76]:
            - generic [ref=e77]: S
            - generic [ref=e78]:
              - paragraph [ref=e79]: Sarah Chen
              - paragraph [ref=e80]: admin@loop.demo
          - generic [ref=e81]:
            - generic [ref=e82]: ADMIN
            - button "Log out" [ref=e83] [cursor=pointer]
    - generic [ref=e88]:
      - banner [ref=e90]:
        - generic [ref=e92]:
          - generic [ref=e93]:
            - generic [ref=e94]: Workspace
            - generic [ref=e95]: /
            - heading "Executive Dashboard" [level=1] [ref=e96]
          - paragraph [ref=e97]: Customer feedback intelligence overview
        - generic [ref=e98]:
          - link "Ask LOOP" [ref=e99] [cursor=pointer]:
            - /url: /ask
          - generic [ref=e105]:
            - generic [ref=e110]: "Tenant:"
            - generic [ref=e111]: demo-wor
          - generic [ref=e112]: ADMIN
          - button "User account menu" [ref=e114] [cursor=pointer]:
            - generic [ref=e115]: S
      - main [ref=e118]:
        - generic [ref=e119]:
          - generic [ref=e121]:
            - generic [ref=e122]:
              - generic [ref=e123]:
                - generic [ref=e124]: ADMIN WORKSPACE
                - generic [ref=e127]: "WS: demo-workspa..."
              - heading "Good afternoon, Sarah Chen 👋" [level=1] [ref=e128]
              - paragraph [ref=e129]: Here's what your customers are saying. Review sentiment trends, high-priority feedback, and key customer topics.
            - generic [ref=e130]:
              - link [ref=e131] [cursor=pointer]:
                - /url: /feedback
                - button "Feedback Inbox" [ref=e132]
              - link [ref=e137] [cursor=pointer]:
                - /url: /ask
                - button "Ask LOOP" [ref=e138]
          - generic [ref=e144]:
            - generic [ref=e145]:
              - heading "Customer Feedback Overview" [level=2] [ref=e146]
              - paragraph [ref=e147]: Filter workspace metrics by date range
            - button "Select Date Range" [ref=e149] [cursor=pointer]
          - generic [ref=e155]:
            - generic [ref=e157]:
              - generic [ref=e158]: Total Feedback
              - generic [ref=e163]:
                - generic [ref=e164]: "82"
                - paragraph [ref=e165]: Recorded customer signals
            - generic [ref=e167]:
              - generic [ref=e168]: Negative Feedback %
              - generic [ref=e174]:
                - generic [ref=e175]: 23.2%
                - paragraph [ref=e176]: Friction & complaint ratio
            - generic [ref=e178]:
              - generic [ref=e179]: New Inbox Items
              - generic [ref=e185]:
                - generic [ref=e186]: "21"
                - paragraph [ref=e187]: Awaiting initial review
            - generic [ref=e189]:
              - generic [ref=e190]: Active Themes
              - generic [ref=e196]:
                - generic [ref=e197]: "10"
                - paragraph [ref=e198]: Categorized topic clusters
          - generic [ref=e199]:
            - generic [ref=e200]:
              - heading "Feedback Volume Over Time" [level=3] [ref=e201]
              - paragraph [ref=e203]: Daily feedback ingestion rate
            - application [ref=e208]:
              - generic [ref=e221]:
                - generic [ref=e222]:
                  - generic [ref=e223]: Jun 18
                  - generic [ref=e225]: Jun 20
                  - generic [ref=e227]: Jul 7
                  - generic [ref=e229]: Jul 8
                  - generic [ref=e231]: Jul 11
                  - generic [ref=e233]: Jul 19
                  - generic [ref=e235]: Jul 23
                  - generic [ref=e237]: Jul 31
                  - generic [ref=e239]: Aug 2
                  - generic [ref=e241]: Aug 17
                  - generic [ref=e243]: Aug 20
                  - generic [ref=e245]: Aug 21
                  - generic [ref=e247]: Aug 22
                  - generic [ref=e249]: Aug 24
                  - generic [ref=e251]: Sep 2
                  - generic [ref=e253]: Sep 13
                  - generic [ref=e255]: Sep 16
                - generic [ref=e257]:
                  - generic [ref=e258]: "0"
                  - generic [ref=e260]: "9"
                  - generic [ref=e262]: "18"
                  - generic [ref=e264]: "27"
                  - generic [ref=e266]: "36"
          - generic [ref=e268]:
            - generic [ref=e269]:
              - generic [ref=e270]:
                - heading "Sentiment Breakdown" [level=3] [ref=e271]
                - paragraph [ref=e275]: Distribution of customer sentiment
              - generic [ref=e276]:
                - generic [ref=e277]:
                  - generic [ref=e278]:
                    - generic [ref=e280]: Positive
                    - generic [ref=e281]: (30)
                  - generic [ref=e282]:
                    - generic [ref=e284]: Neutral
                    - generic [ref=e285]: (33)
                  - generic [ref=e286]:
                    - generic [ref=e288]: Negative
                    - generic [ref=e289]: (19)
                - application [ref=e293]:
                  - generic [ref=e310]:
                    - generic [ref=e311]:
                      - generic [ref=e312]: Positive
                      - generic [ref=e314]: Neutral
                      - generic [ref=e316]: Negative
                    - generic [ref=e318]:
                      - generic [ref=e319]: "0"
                      - generic [ref=e321]: "9"
                      - generic [ref=e323]: "18"
                      - generic [ref=e325]: "27"
                      - generic [ref=e327]: "36"
            - generic [ref=e329]:
              - generic [ref=e330]:
                - heading "Top Themes" [level=3] [ref=e331]
                - paragraph [ref=e335]: Themes ranked by feedback volume
              - application [ref=e340]:
                - generic [ref=e378]:
                  - generic [ref=e379]:
                    - generic [ref=e380]: "0"
                    - generic [ref=e382]: "4"
                    - generic [ref=e384]: "8"
                    - generic [ref=e386]: "12"
                    - generic [ref=e388]: "16"
                  - generic [ref=e390]:
                    - generic [ref=e391]: FeatureRequests
                    - generic [ref=e393]: Product Quality
                    - generic [ref=e395]: CustomerSupport
                    - generic [ref=e397]: Performance
                    - generic [ref=e399]: Reliability
          - generic [ref=e401]:
            - generic [ref=e402]:
              - generic [ref=e403]:
                - generic [ref=e404]:
                  - heading "Needs Attention" [level=3] [ref=e405]
                  - paragraph [ref=e408]: Negative & high-priority feedback requiring triage
                - link [ref=e409] [cursor=pointer]:
                  - /url: /feedback?sentiment=NEG
                  - button "View All" [ref=e410]
              - generic [ref=e412]:
                - generic [ref=e413] [cursor=pointer]:
                  - generic [ref=e414]:
                    - paragraph [ref=e415]: Security test feedback
                    - generic [ref=e416]:
                      - generic [ref=e417]: email
                      - generic [ref=e418]: •
                      - generic [ref=e419]: 9/16/2026
                  - generic [ref=e420]:
                    - generic [ref=e421]: NEU
                    - generic [ref=e422]: NEW
                - generic [ref=e423] [cursor=pointer]:
                  - generic [ref=e424]:
                    - paragraph [ref=e425]: Security test feedback
                    - generic [ref=e426]:
                      - generic [ref=e427]: email
                      - generic [ref=e428]: •
                      - generic [ref=e429]: 9/16/2026
                  - generic [ref=e430]:
                    - generic [ref=e431]: NEU
                    - generic [ref=e432]: NEW
                - generic [ref=e433] [cursor=pointer]:
                  - generic [ref=e434]:
                    - paragraph [ref=e435]: Security test feedback
                    - generic [ref=e436]:
                      - generic [ref=e437]: email
                      - generic [ref=e438]: •
                      - generic [ref=e439]: 9/16/2026
                  - generic [ref=e440]:
                    - generic [ref=e441]: NEU
                    - generic [ref=e442]: NEW
                - generic [ref=e443] [cursor=pointer]:
                  - generic [ref=e444]:
                    - paragraph [ref=e445]: Cross-workspace attempt
                    - generic [ref=e446]:
                      - generic [ref=e447]: email
                      - generic [ref=e448]: •
                      - generic [ref=e449]: 9/16/2026
                  - generic [ref=e450]:
                    - generic [ref=e451]: NEU
                    - generic [ref=e452]: NEW
            - generic [ref=e453]:
              - generic [ref=e454]:
                - generic [ref=e455]:
                  - heading "Top Discovered Themes" [level=3] [ref=e456]
                  - paragraph [ref=e460]: Most frequent customer feedback topics
                - link [ref=e461] [cursor=pointer]:
                  - /url: /trends
                  - button "Explore Trends" [ref=e462]
              - generic [ref=e464]:
                - generic [ref=e465]:
                  - generic [ref=e466]:
                    - generic [ref=e467]: "#1"
                    - generic [ref=e468]:
                      - paragraph [ref=e469]: User Experience
                      - paragraph [ref=e470]: 15 recorded feedback entries
                  - generic [ref=e471]: 15 items
                - generic [ref=e472]:
                  - generic [ref=e473]:
                    - generic [ref=e474]: "#2"
                    - generic [ref=e475]:
                      - paragraph [ref=e476]: Feature Requests
                      - paragraph [ref=e477]: 14 recorded feedback entries
                  - generic [ref=e478]: 14 items
                - generic [ref=e479]:
                  - generic [ref=e480]:
                    - generic [ref=e481]: "#3"
                    - generic [ref=e482]:
                      - paragraph [ref=e483]: Pricing
                      - paragraph [ref=e484]: 12 recorded feedback entries
                  - generic [ref=e485]: 12 items
                - generic [ref=e486]:
                  - generic [ref=e487]:
                    - generic [ref=e488]: "#4"
                    - generic [ref=e489]:
                      - paragraph [ref=e490]: Product Quality
                      - paragraph [ref=e491]: 11 recorded feedback entries
                  - generic [ref=e492]: 11 items
          - generic [ref=e493]:
            - generic [ref=e494]:
              - generic [ref=e495]:
                - heading "Recent Feedback Activity" [level=3] [ref=e496]
                - paragraph [ref=e500]: Latest customer feedback recorded in your workspace
              - link [ref=e501] [cursor=pointer]:
                - /url: /feedback
                - button "View All Feedback" [ref=e502]
            - table [ref=e510]:
              - rowgroup [ref=e511]:
                - row [ref=e512] [cursor=pointer]:
                  - columnheader "Feedback Content" [ref=e513]
                  - columnheader "Channel" [ref=e514]
                  - columnheader "Sentiment" [ref=e515]
                  - columnheader "Status" [ref=e516]
                  - columnheader "Recorded Date" [ref=e517]
                  - columnheader "Action" [ref=e518]
              - rowgroup [ref=e519]:
                - row [ref=e520] [cursor=pointer]:
                  - cell [ref=e521]:
                    - paragraph [ref=e522]: Security test feedback
                  - cell "email" [ref=e523]
                  - cell "NEU" [ref=e525]
                  - cell "NEW" [ref=e527]
                  - cell "9/16/2026" [ref=e529]
                  - cell [ref=e530]:
                    - button [ref=e531]
                - row [ref=e535] [cursor=pointer]:
                  - cell [ref=e536]:
                    - paragraph [ref=e537]: Security test feedback
                  - cell "email" [ref=e538]
                  - cell "NEU" [ref=e540]
                  - cell "NEW" [ref=e542]
                  - cell "9/16/2026" [ref=e544]
                  - cell [ref=e545]:
                    - button [ref=e546]
                - row [ref=e550] [cursor=pointer]:
                  - cell [ref=e551]:
                    - paragraph [ref=e552]: Security test feedback
                  - cell "email" [ref=e553]
                  - cell "NEU" [ref=e555]
                  - cell "NEW" [ref=e557]
                  - cell "9/16/2026" [ref=e559]
                  - cell [ref=e560]:
                    - button [ref=e561]
                - row [ref=e565] [cursor=pointer]:
                  - cell [ref=e566]:
                    - paragraph [ref=e567]: Cross-workspace attempt
                  - cell "email" [ref=e568]
                  - cell "NEU" [ref=e570]
                  - cell "NEW" [ref=e572]
                  - cell "9/16/2026" [ref=e574]
                  - cell [ref=e575]:
                    - button [ref=e576]
                - row [ref=e580] [cursor=pointer]:
                  - cell [ref=e581]:
                    - paragraph [ref=e582]: M1 test feedback
                  - cell "email" [ref=e583]
                  - cell "NEU" [ref=e585]
                  - cell "NEW" [ref=e587]
                  - cell "9/16/2026" [ref=e589]
                  - cell [ref=e590]:
                    - button [ref=e591]
                - row [ref=e595] [cursor=pointer]:
                  - cell [ref=e596]:
                    - paragraph [ref=e597]: M1 test feedback
                  - cell "email" [ref=e598]
                  - cell "NEU" [ref=e600]
                  - cell "NEW" [ref=e602]
                  - cell "9/16/2026" [ref=e604]
                  - cell [ref=e605]:
                    - button [ref=e606]
      - contentinfo [ref=e610]:
        - generic [ref=e611]:
          - generic [ref=e618]:
            - generic [ref=e619]: Project LOOP
            - generic [ref=e620]: ·
            - generic [ref=e621]: AI Feedback Intelligence Platform
          - navigation "Footer navigation" [ref=e622]:
            - link "Dashboard" [ref=e623] [cursor=pointer]:
              - /url: /dashboard
            - link "Feedback" [ref=e624] [cursor=pointer]:
              - /url: /feedback
            - link "Insights" [ref=e625] [cursor=pointer]:
              - /url: /trends
            - link "Ask LOOP" [ref=e626] [cursor=pointer]:
              - /url: /ask
            - link "Reports" [ref=e627] [cursor=pointer]:
              - /url: /reports
          - generic [ref=e628]:
            - generic [ref=e629]: Isolated Tenant
            - generic [ref=e634]: © 2026 Project LOOP
  - alert [ref=e635]
  - generic [aria-hidden] [ref=e636]: User Experience
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
> 27  |   expect(Array.isArray(themesBody)).toBe(true);
      |                                     ^ Error: expect(received).toBe(expected) // Object.is equality
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
  88  |   expect(realErrors, `JS errors on routes: ${realErrors.join('\n')}`).toHaveLength(0);
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
```