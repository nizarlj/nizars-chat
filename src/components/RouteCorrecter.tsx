"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuthToken  } from "@convex-dev/auth/react";

// We need this because for some reason the route does not update correctly when the user is authenticated
export default function RouteCorrecter() {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAuthToken();

  const isAuthenticated = !!token;
  if (pathname === "/auth" && isAuthenticated) router.replace("/");

  return null;
}
