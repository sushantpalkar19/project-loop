import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/feedback",
    "/feedback/:path*",
    "/ask",
    "/ask/:path*",
    "/trends",
    "/trends/:path*",
    "/insights",
    "/insights/:path*",
    "/reports",
    "/reports/:path*",
    "/workspace",
    "/workspace/:path*",
    "/settings",
    "/settings/:path*",
    "/logs",
    "/logs/:path*",
  ],
};
