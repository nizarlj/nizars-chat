import { NextRequest, NextResponse } from "next/server";
import { createAuth } from '@convex/auth';
import { getToken } from "@convex-dev/better-auth/nextjs";

const isPage = (request: NextRequest, path: string) => {
  return request.nextUrl.pathname.startsWith(path);
}

export default async function middleware(request: NextRequest) {
  if (isPage(request, "/api")) {
    return NextResponse.next();
  }

  const token = await getToken(createAuth);
  const isAuthenticated = !!token;

  if (isPage(request, "/auth") && isAuthenticated) {
    return NextResponse.redirect( new URL("/", request.url));
  }
  if (!isPage(request, "/auth") && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/"],
};