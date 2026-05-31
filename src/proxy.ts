import { NextRequest, NextResponse } from "next/server";
import {
  getAdminHostname,
  isAdminHostRequest,
} from "@/lib/adminHost";
import { verifyToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminHostname = getAdminHostname();

  if (adminHostname && !isAdminHostRequest(request)) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.hostname = adminHostname;
    return NextResponse.redirect(adminUrl);
  }

  // 略過登入頁與 API
  if (pathname === "/admin/login" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
