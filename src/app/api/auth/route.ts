import { NextRequest, NextResponse } from "next/server";
import {
  signToken,
  createCookieOptions,
  deleteCookieOptions,
  getAuthConfigurationError,
  verifyAdminPassword,
} from "@/lib/auth";
import { isAdminHostRequest } from "@/lib/adminHost";

export async function POST(request: NextRequest) {
  try {
    if (!isAdminHostRequest(request)) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    const configError = getAuthConfigurationError();
    if (configError) {
      return NextResponse.json({ error: configError }, { status: 500 });
    }

    const { password } = await request.json();

    if (!verifyAdminPassword(password)) {
      return NextResponse.json({ error: "密碼錯誤" }, { status: 401 });
    }

    const token = await signToken();
    const response = NextResponse.json({ success: true });
    const cookieOpts = createCookieOptions(token);
    response.cookies.set(cookieOpts);
    return response;
  } catch {
    return NextResponse.json({ error: "登入失敗" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdminHostRequest(request)) {
    return NextResponse.json({ error: "Not Found" }, { status: 404 });
  }

  const response = NextResponse.json({ success: true });
  const cookieOpts = deleteCookieOptions();
  response.cookies.set(cookieOpts);
  return response;
}
