"use client";
import { useConvexAuth } from "convex/react";
import { useRouter, usePathname } from "next/navigation";

// We need this because for some reason the route does not update correctly when the user is authenticated
export default function RouteCorrecter() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useConvexAuth();

  if (pathname === "/auth" && isAuthenticated) router.replace("/");

  return null;
}
