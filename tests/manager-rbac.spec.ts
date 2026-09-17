/**
 * MANAGER role - permissions and Feedback Inbox access
 */

import { test, expect } from "@playwright/test";
import {
  loginAs,
  authenticatedRequest,
  BASE_URL,
} from "./helpers/auth";

test("MANAGER can list the same workspace feedback as ADMIN TC-MGR-001", async ({
  page,
}) => {
  await loginAs(page, "manager");

  const managerRes = await authenticatedRequest(
    page,
    "GET",
    "/api/feedback?pageSize=5"
  );
  expect(managerRes.status).toBe(200);
  const managerBody = managerRes.json as {
    pagination: { total: number };
    feedback: Array<{ id: string }>;
  };
  expect(managerBody.pagination.total).toBeGreaterThan(0);
  expect(Array.isArray(managerBody.feedback)).toBe(true);

  await loginAs(page, "admin");

  const adminRes = await authenticatedRequest(
    page,
    "GET",
    "/api/feedback?pageSize=5"
  );
  expect(adminRes.status).toBe(200);
  const adminBody = adminRes.json as { pagination: { total: number } };
  expect(adminBody.pagination.total).toBe(managerBody.pagination.total);
});

test("MANAGER can access analytics, Ask LOOP, reports, PDF download route, and themes TC-MGR-002", async ({
  page,
}) => {
  await loginAs(page, "manager");

  const allowedGets = [
    "/api/analytics/overview",
    "/api/themes",
    "/api/reports",
  ];

  for (const path of allowedGets) {
    const res = await authenticatedRequest(page, "GET", path);
    expect(res.status, path).toBe(200);
  }

  const askValidationRes = await authenticatedRequest(page, "POST", "/api/ask", {
    question: "x",
  });
  expect(askValidationRes.status).toBe(400);

  const reportValidationRes = await authenticatedRequest(
    page,
    "POST",
    "/api/reports",
    { startDate: "not-a-date", endDate: "2024-01-31" }
  );
  expect(reportValidationRes.status).toBe(400);

  const reportsRes = await authenticatedRequest(page, "GET", "/api/reports");
  const reportsBody = reportsRes.json as {
    reports?: Array<{ id: string; title: string }>;
  };
  const firstReport = reportsBody.reports?.[0];
  const pdfRes = await authenticatedRequest(
    page,
    "GET",
    firstReport
      ? `/api/reports/${firstReport.id}/pdf`
      : "/api/reports/nonexistent-report-id/pdf"
  );
  expect(firstReport ? [200] : [404]).toContain(pdfRes.status);

  const logsRes = await authenticatedRequest(page, "GET", "/api/admin/logs");
  expect(logsRes.status).toBe(403);
});

test("MANAGER can reach permitted feedback actions without creating records TC-MGR-003", async ({
  page,
}) => {
  await loginAs(page, "manager");

  const createValidationRes = await authenticatedRequest(
    page,
    "POST",
    "/api/feedback",
    { content: "", channel: "email" }
  );
  expect(createValidationRes.status).toBe(400);

  const updateMissingRes = await authenticatedRequest(
    page,
    "PATCH",
    "/api/feedback/nonexistent-feedback-id",
    { status: "REVIEWED" }
  );
  expect(updateMissingRes.status).toBe(404);

  const classifyMissingRes = await authenticatedRequest(
    page,
    "POST",
    "/api/feedback/nonexistent-feedback-id/classify"
  );
  expect(classifyMissingRes.status).toBe(404);

  const deleteMissingRes = await authenticatedRequest(
    page,
    "DELETE",
    "/api/feedback/nonexistent-feedback-id"
  );
  expect(deleteMissingRes.status).toBe(404);
});

test("MANAGER cannot grant ADMIN or modify/delete ADMIN accounts TC-MGR-004", async ({
  page,
}) => {
  await loginAs(page, "manager");

  const membersRes = await authenticatedRequest(page, "GET", "/api/workspace/members");
  expect(membersRes.status).toBe(200);
  const membersBody = membersRes.json as {
    members: Array<{ id: string; role: string; email: string }>;
  };

  const adminMember = membersBody.members.find((m) => m.role === "ADMIN");
  expect(adminMember).toBeTruthy();

  const nonAdminMember = membersBody.members.find((m) => m.role !== "ADMIN");
  expect(nonAdminMember).toBeTruthy();

  if (nonAdminMember) {
    const promoteRes = await authenticatedRequest(
      page,
      "PATCH",
      `/api/workspace/members/${nonAdminMember.id}`,
      { role: "ADMIN" }
    );
    expect(promoteRes.status).toBe(403);
  }

  if (adminMember) {
    const modifyAdminRes = await authenticatedRequest(
      page,
      "PATCH",
      `/api/workspace/members/${adminMember.id}`,
      { role: "VIEWER" }
    );
    expect(modifyAdminRes.status).toBe(403);

    const deleteAdminRes = await authenticatedRequest(
      page,
      "DELETE",
      `/api/workspace/members/${adminMember.id}`
    );
    expect(deleteAdminRes.status).toBe(403);
  }

  const createAdminRes = await authenticatedRequest(
    page,
    "POST",
    "/api/workspace/members",
    {
      name: "Manager Admin Attempt",
      email: `manager-admin-attempt-${Date.now()}@loop.invalid`,
      password: "Password123!",
      role: "ADMIN",
    }
  );
  expect([400, 403]).toContain(createAdminRes.status);
});

test("VIEWER remains read-only TC-MGR-005", async ({ page }) => {
  await loginAs(page, "viewer");

  const readEndpoints = [
    "/api/feedback?pageSize=1",
    "/api/analytics/overview",
    "/api/reports",
  ];

  for (const path of readEndpoints) {
    const res = await authenticatedRequest(page, "GET", path);
    expect(res.status, path).toBe(200);
  }

  const writeAttempts = [
    {
      method: "POST" as const,
      path: "/api/feedback",
      body: { content: "Viewer write attempt", channel: "email" },
    },
    {
      method: "PATCH" as const,
      path: "/api/feedback/nonexistent-feedback-id",
      body: { status: "REVIEWED" },
    },
    {
      method: "DELETE" as const,
      path: "/api/feedback/nonexistent-feedback-id",
    },
    {
      method: "POST" as const,
      path: "/api/workspace/members",
      body: {
        name: "Viewer Attempt",
        email: "viewer-attempt@loop.invalid",
        password: "Password123!",
        role: "VIEWER",
      },
    },
    {
      method: "POST" as const,
      path: "/api/reports",
      body: { startDate: "2024-01-01", endDate: "2024-01-31" },
    },
  ];

  for (const attempt of writeAttempts) {
    const res = await authenticatedRequest(
      page,
      attempt.method,
      attempt.path,
      attempt.body
    );
    expect(res.status, `${attempt.method} ${attempt.path}`).toBe(403);
  }
});

test("Workspace-scoped feedback ignores client-supplied workspaceId TC-MGR-006", async ({
  page,
}) => {
  await loginAs(page, "manager");

  const normalRes = await authenticatedRequest(
    page,
    "GET",
    "/api/feedback?pageSize=1"
  );
  expect(normalRes.status).toBe(200);
  const normalBody = normalRes.json as {
    pagination: { total: number };
    feedback: Array<{ id: string }>;
  };

  const injectedRes = await authenticatedRequest(
    page,
    "GET",
    "/api/feedback?pageSize=1&workspaceId=outside-workspace"
  );
  expect(injectedRes.status).toBe(200);
  const injectedBody = injectedRes.json as {
    pagination: { total: number };
    feedback: Array<{ id: string }>;
  };

  expect(injectedBody.pagination.total).toBe(normalBody.pagination.total);
  expect(injectedBody.feedback.map((item) => item.id)).toEqual(
    normalBody.feedback.map((item) => item.id)
  );
});

test("Feedback Inbox UI shows records for MANAGER TC-MGR-007", async ({
  page,
}) => {
  await loginAs(page, "manager");
  await page.goto(`${BASE_URL}/feedback`);
  await page.waitForLoadState("networkidle");

  const summary = page.getByText(/recorded feedback signals in your workspace/i);
  await expect(summary).toBeVisible();
  await expect(summary).not.toContainText("Showing 0 recorded feedback signals");
  await expect(page.getByText("Unable to load feedback inbox")).toHaveCount(0);
});

test("Feedback Inbox UI displays API errors instead of empty state TC-MGR-008", async ({
  page,
}) => {
  await loginAs(page, "manager");
  await page.route("**/api/feedback?**", (route) =>
    route.fulfill({
      status: 403,
      contentType: "application/json",
      body: JSON.stringify({ error: "Forced feedback authorization failure" }),
    })
  );

  await page.goto(`${BASE_URL}/feedback`);
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Unable to load feedback inbox")).toBeVisible();
  await expect(
    page.getByText("Forced feedback authorization failure").first()
  ).toBeVisible();
  await expect(page.getByText("No feedback signals found")).toHaveCount(0);
  await expect(
    page.getByText("Showing 0 recorded feedback signals")
  ).toHaveCount(0);
});
